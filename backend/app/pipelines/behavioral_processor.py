import json
import logging
import os
from datetime import datetime, timedelta

from celery import shared_task

from app.config.constants import SCORE_WEIGHTS, ALERT_UNIFIED_SCORE_THRESHOLD
from app.services.scoring_weights import scoring_weights_fraction, build_breakdown, response_score, load_settings
from app.services.transcriber import Transcriber

logger = logging.getLogger(__name__)

def _extract_audio(video_path, wav_path):
    import shutil, subprocess
    ff = shutil.which('ffmpeg')  # must be on PATH (brew install ffmpeg)
    if not video_path or not os.path.exists(video_path):
        return False, 'video_missing'
    if not ff:
        return False, 'ffmpeg_not_found'
    r = subprocess.run([ff, '-y', '-loglevel', 'error', '-i', video_path,
                        '-vn', '-ac', '1', '-ar', '16000', wav_path],
                       capture_output=True, text=True, timeout=120)
    if r.returncode != 0 or not os.path.exists(wav_path):
        return False, 'audio_extract_failed: ' + (r.stderr or '').strip()[-200:]
    return True, None

MIN_SIGNALS_FOR_SCORE = 2  # presence must also be present (checked below)

import uuid
from sqlalchemy.exc import IntegrityError

_LOCK_KEY = 'sebms:batch_lock'
_LOCK_TTL = 3 * 60 * 60  # seconds; longer than the task time limit
_RELEASE_LUA = ("if redis.call('get', KEYS[1]) == ARGV[1] then "
                "return redis.call('del', KEYS[1]) else return 0 end")


def _emotion_model_version():
    import hashlib
    if os.environ.get('EMOTION_BACKEND', 'deepface') == 'resnet50_3g':
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'ml_models', 'resnet50_3g_finetuned.keras')
        h = hashlib.sha256()
        with open(path, 'rb') as f:
            for chunk in iter(lambda: f.read(1 << 20), b''):
                h.update(chunk)
        return 'resnet50_3g_finetuned@sha256:' + h.hexdigest()[:12]
    return 'deepface-emotion'


def _redis():
    import redis
    return redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))


def _acquire_batch_lock():
    """Return a token if this run got the lock, None if another batch holds it."""
    token = uuid.uuid4().hex
    try:
        ok = _redis().set(_LOCK_KEY, token, nx=True, ex=_LOCK_TTL)
    except Exception as e:
        logger.error(f"Batch lock check failed, not running: {e}")
        return None
    return token if ok else None


def _release_batch_lock(token):
    """Release only if we still own the lock (compare-and-delete)."""
    try:
        _redis().eval(_RELEASE_LUA, 1, _LOCK_KEY, token)
    except Exception as e:
        logger.error(f"Batch lock release failed: {e}")


def _fuse(signals, weights=None):
    """Weighted average over all configured components. Unmeasured components count as 0."""
    weights = weights or SCORE_WEIGHTS
    total_w = sum(weights.values())
    return sum(weights[k] * signals.get(k, 0.0) for k in weights) / total_w


@shared_task
def process_daily_interactions(hours=24, rescore_ids=None):
    rescore = set(rescore_ids or [])
    lock_token = _acquire_batch_lock()
    if lock_token is None:
        logger.warning("Batch skipped: another batch is already running")
        return {'status': 'skipped_locked'}
    from app import create_app

    app = create_app()
    with app.app_context():
        from app.models import Interaction, BehavioralScore, ResponseTimeRecord
        from app.services.response_timer import compute_response_time
        from app.services.ml_executor import MLExecutor
        from app.services.sentiment_analyzer import analyze_sentiment
        from app.services.file_manager import get_file_manager
        from app.services.alert_generator import AlertGenerator, ALERT_SENSITIVITY_THRESHOLDS

        session = app.SessionLocal()
        counts = {'scored': 0, 'insufficient_signals': 0, 'no_presence': 0, 'skipped_duplicate': 0, 'failed': 0}
        try:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            from sqlalchemy import or_
            base_q = session.query(Interaction).filter(Interaction.end_timestamp.isnot(None))
            if rescore:
                # Explicit rescore IDs are processed even outside the time window
                interactions = base_q.filter(or_(Interaction.end_timestamp >= cutoff,
                                                 Interaction.id.in_(rescore))).all()
            else:
                interactions = base_q.filter(Interaction.end_timestamp >= cutoff).all()
            logger.info(f"Batch: {len(interactions)} interactions in last {hours}h")

            ml = MLExecutor()
            alert_threshold = ALERT_SENSITIVITY_THRESHOLDS.get(
                load_settings(session).get('alertSensitivity', 'medium'), 60)
            transcriber = Transcriber()
            fm = get_file_manager()
            model_version = _emotion_model_version()

            for it in interactions:
                existing = session.query(BehavioralScore).filter(
                        BehavioralScore.interaction_id == it.id).first()
                if existing is not None and it.id not in rescore:
                    counts['skipped_duplicate'] += 1
                    continue
                if it.video_file_path is None and existing is not None:
                    counts['skipped_no_video'] = counts.get('skipped_no_video', 0) + 1
                    continue

                try:
                    signals, errors = {}, {}

                    # Video: presence and emotion, each reported with its own status
                    ml_result = ml.analyze_video_subprocess(it.video_file_path)
                    pres = ml_result.get('presence', {})
                    emo = ml_result.get('emotion', {})
                    if pres.get('status') == 'ok' and pres.get('presence_score') is not None:
                        signals['presence'] = float(pres['presence_score'])
                    else:
                        errors['presence'] = pres.get('error') or pres.get('status', 'unknown')
                    if emo.get('status') == 'ok' and emo.get('emotion_score') is not None:
                        signals['emotion'] = float(emo['emotion_score'])
                    else:
                        errors['emotion'] = emo.get('error') or emo.get('status', 'unknown')

                    # Audio: extracted from the video if missing (needed for transcription)
                    audio_path = fm.get_audio_path(it.id)
                    if not os.path.exists(audio_path):
                        ok, why = _extract_audio(it.video_file_path, audio_path)
                        if not ok:
                            errors['transcript'] = why

                    # Transcription (faster-whisper), then transcript sentiment.
                    # Sentiment fills the 'voice' component (15%); stored in voice_score.
                    transcript, transcript_language = None, None
                    if os.path.exists(audio_path):
                        tr = transcriber.transcribe(audio_path)
                        if tr.get('status') == 'ok':
                            transcript = tr.get('transcript')
                            transcript_language = tr.get('language')
                        else:
                            errors['transcript'] = tr.get('error') or tr.get('status', 'unknown')

                    if transcript:
                        sent = analyze_sentiment(transcript)
                        if sent['status'] == 'ok' and sent['sentiment_score'] is not None:
                            signals['voice'] = float(sent['sentiment_score'])
                            errors['voice'] = 'scored'
                        else:
                            errors['voice'] = sent.get('error') or sent['status']
                    else:
                        errors['voice'] = 'no_transcript'

                    # Response time: measured from stored events, NOT fused yet.
                    # No validated 0-100 scoring rule exists; fusion waits for Phase 8.
                    rt = session.query(ResponseTimeRecord).filter(
                        ResponseTimeRecord.interaction_id == it.id).first()
                    if rt is None:
                        rt_res = {'status': 'missing_event', 'response_seconds': None,
                                  'is_acceptable': None, 'error': 'no response-time record'}
                    else:
                        rt_res = compute_response_time(rt.arrival_at, rt.response_at)
                        rt.response_seconds = rt_res['response_seconds']
                        rt.status = rt_res['status']
                    if rt_res.get('response_seconds') is not None:
                        signals['response'] = response_score(rt_res['response_seconds'])
                        errors['response'] = 'scored'
                    else:
                        errors['response'] = f"{rt_res['status']}: {rt_res.get('error') or 'no response'}"
                    from app.models import CustomerFeedback
                    fb = session.query(CustomerFeedback).filter(CustomerFeedback.interaction_id == it.id).first()
                    if fb is not None and fb.star_rating is not None:
                        signals['feedback'] = round(float(fb.star_rating) / 5 * 100, 2)
                        errors['feedback'] = 'rated'
                    else:
                        errors['feedback'] = 'no_rating'

                    # Presence gate: below this cutoff the session is flagged no_presence and
                    # emotion is dropped and no unified score is produced.
                    PRESENCE_MIN = 50
                    if 'presence' not in signals:
                        unified = None
                        status = 'insufficient_signals'
                    else:
                        if signals['presence'] < PRESENCE_MIN:
                            status = 'no_presence'
                            errors['gate'] = f"presence {signals['presence']} below {PRESENCE_MIN}"
                            signals.pop('emotion', None)
                            errors['emotion'] = 'dropped: presence gate'
                            unified = None
                        else:
                            status = 'scored'
                            unified = _fuse(signals, scoring_weights_fraction(session))

                    row = BehavioralScore(
                        employee_id=it.employee_id,
                        interaction_id=it.id,
                        date=it.start_timestamp or datetime.utcnow(),
                        presence_score=signals.get('presence'),
                        emotion_score=signals.get('emotion'),
                        response_score=None,
                        feedback_score=None,
                        voice_score=signals.get('voice'),
                        unified_score=round(unified, 2) if unified is not None else None,
                        score_breakdown=(json.dumps(build_breakdown(signals, scoring_weights_fraction(session))) if unified is not None else None),
                        signals_used=','.join(sorted(signals)) or None,
                        transcript=transcript,
                        transcript_language=transcript_language,
                        score_status=status,
                        error_details=json.dumps(errors),
                        model_version=model_version,
                    )
                    if existing is not None:
                        for col in ('employee_id', 'date', 'presence_score', 'emotion_score',
                                    'response_score', 'feedback_score', 'voice_score',
                                    'unified_score', 'signals_used', 'score_breakdown', 'transcript', 'transcript_language',
                                    'score_status', 'error_details', 'model_version'):
                            setattr(existing, col, getattr(row, col))
                        row = existing
                    else:
                        session.add(row)
                    session.commit()
                    counts[status] += 1

                    if unified is not None and unified < alert_threshold:
                        AlertGenerator(session).check_and_create_alerts(it.employee_id, unified, alert_threshold)

                    logger.info(f"Interaction {it.id}: {status} unified={row.unified_score} signals={row.signals_used}")
                except IntegrityError:
                    session.rollback()
                    counts['skipped_duplicate'] += 1
                    logger.warning(f"Interaction {it.id}: duplicate score row, skipped")
                except Exception as e:
                    session.rollback()
                    counts['failed'] += 1
                    logger.error(f"Interaction {it.id} failed: {e}", exc_info=True)

            return {'status': 'success', **counts}
        except Exception as e:
            logger.error(f"Batch error: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e), **counts}
        finally:
            session.close()
            _release_batch_lock(lock_token)


@shared_task
def purge_old_videos():
    """Daily retention: delete raw recordings older than the retention setting (0 = keep forever)."""
    from datetime import datetime, timedelta
    from app import create_app
    from app.services.scoring_weights import load_settings
    from app.services.video_retention import delete_videos

    app = create_app()
    with app.app_context():
        session = app.SessionLocal()
        try:
            days = int(load_settings(session).get('retentionDays') or 0)
            if days <= 0:
                return {'status': 'skipped', 'reason': 'retention disabled'}
            cutoff = datetime.utcnow() - timedelta(days=days)
            result = delete_videos(session, before_date=cutoff)
            logger.info(f"Retention: {result} (older than {days} days)")
            return {'status': 'success', **result}
        except Exception as e:
            session.rollback()
            logger.error(f"Retention error: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}
        finally:
            session.close()
