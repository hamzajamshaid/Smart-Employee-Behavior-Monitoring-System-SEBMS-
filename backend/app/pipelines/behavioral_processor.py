import json
import logging
import os
from datetime import datetime, timedelta

from celery import shared_task

from app.config.constants import SCORE_WEIGHTS, ALERT_UNIFIED_SCORE_THRESHOLD

logger = logging.getLogger(__name__)

def _extract_audio(video_path, wav_path):
    import shutil, subprocess
    ff = shutil.which('ffmpeg') or '/opt/anaconda3/bin/ffmpeg'
    if not video_path or not os.path.exists(video_path):
        return False, 'video_missing'
    if not os.path.exists(ff):
        return False, 'ffmpeg_not_found'
    r = subprocess.run([ff, '-y', '-loglevel', 'error', '-i', video_path,
                        '-vn', '-ac', '1', '-ar', '16000', wav_path],
                       capture_output=True, text=True, timeout=120)
    if r.returncode != 0 or not os.path.exists(wav_path):
        return False, 'audio_extract_failed: ' + (r.stderr or '').strip()[-200:]
    return True, None

MIN_SIGNALS_FOR_SCORE = 2  # presence must also be present (checked below)


def _fuse(signals):
    """Weighted average over available signals only. Returns None if not scorable."""
    if 'presence' not in signals or len(signals) < MIN_SIGNALS_FOR_SCORE:
        return None
    total_w = sum(SCORE_WEIGHTS[k] for k in signals)
    return sum(SCORE_WEIGHTS[k] * v for k, v in signals.items()) / total_w


@shared_task
def process_daily_interactions(hours=24, rescore_ids=None):
    rescore = set(rescore_ids or [])
    from app import create_app

    app = create_app()
    with app.app_context():
        from app.models import Interaction, BehavioralScore, ResponseTimeRecord
        from app.services.response_timer import compute_response_time
        from app.services.ml_executor import MLExecutor
        from app.services.voice_analyzer import VoiceAnalyzer
        from app.services.file_manager import get_file_manager
        from app.services.alert_generator import AlertGenerator

        session = app.SessionLocal()
        counts = {'scored': 0, 'insufficient_signals': 0, 'skipped_duplicate': 0, 'failed': 0}
        try:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            interactions = session.query(Interaction).filter(
                Interaction.end_timestamp >= cutoff,
                Interaction.end_timestamp.isnot(None),
            ).all()
            logger.info(f"Batch: {len(interactions)} interactions in last {hours}h")

            ml = MLExecutor()
            voice = VoiceAnalyzer()
            fm = get_file_manager()

            for it in interactions:
                existing = session.query(BehavioralScore).filter(
                        BehavioralScore.interaction_id == it.id).first()
                if existing is not None and it.id not in rescore:
                    counts['skipped_duplicate'] += 1
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

                    # Voice: only if an audio file exists
                    audio_path = fm.get_audio_path(it.id)
                    if not os.path.exists(audio_path):
                        ok, why = _extract_audio(it.video_file_path, audio_path)
                        if not ok:
                            errors['voice'] = why
                    if os.path.exists(audio_path):
                        vr = voice.analyze_voice(audio_path)
                        if vr['status'] == 'ok' and vr['voice_score'] is not None:
                            signals['voice'] = float(vr['voice_score'])
                        else:
                            errors['voice'] = vr.get('error') or vr['status']
                    elif 'voice' not in errors:
                        errors['voice'] = 'no_audio_file'

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
                    errors['response'] = f"{rt_res['status']}: {rt_res.get('error') or 'measured, not fused'}"
                    errors['feedback'] = 'not_implemented'

                    unified = _fuse(signals)
                    status = 'scored' if unified is not None else 'insufficient_signals'

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
                        signals_used=','.join(sorted(signals)) or None,
                        score_status=status,
                        error_details=json.dumps(errors),
                    )
                    if existing is not None:
                        for col in ('employee_id', 'date', 'presence_score', 'emotion_score',
                                    'response_score', 'feedback_score', 'voice_score',
                                    'unified_score', 'signals_used', 'score_status', 'error_details'):
                            setattr(existing, col, getattr(row, col))
                        row = existing
                    else:
                        session.add(row)
                    session.commit()
                    counts[status] += 1

                    if unified is not None and unified < ALERT_UNIFIED_SCORE_THRESHOLD:
                        AlertGenerator(session).check_and_create_alerts(it.employee_id, unified)

                    logger.info(f"Interaction {it.id}: {status} unified={row.unified_score} signals={row.signals_used}")
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
