import datetime
import json
import logging
import threading
import time

from sqlalchemy import text

from app.services.sentiment_analyzer import analyze_sentiment

logger = logging.getLogger(__name__)

HARM_NEG_PROB = 0.8
PENALTY_PER_FLAG = 25
RATING_WEIGHT = 0.6
CHAT_WEIGHT = 0.4
DEFAULT_SECONDS_PER_MESSAGE = 6.0

CREATE_ANALYSIS = (
    "CREATE TABLE IF NOT EXISTS ticket_analysis ("
    " ticket_id INT PRIMARY KEY,"
    " chat_score DECIMAL(5,2),"
    " flagged_count INT NOT NULL DEFAULT 0,"
    " flagged_messages TEXT,"
    " quality_score DECIMAL(5,2),"
    " analyzed_at DATETIME)"
)

CREATE_JOB = (
    "CREATE TABLE IF NOT EXISTS ticket_analysis_job ("
    " ticket_id INT PRIMARY KEY,"
    " status VARCHAR(16) NOT NULL,"
    " total INT NOT NULL DEFAULT 0,"
    " done INT NOT NULL DEFAULT 0,"
    " seconds_total DECIMAL(10,2) NOT NULL DEFAULT 0,"
    " started_at DATETIME,"
    " finished_at DATETIME,"
    " error TEXT)"
)

UPSERT_ANALYSIS = (
    "INSERT INTO ticket_analysis (ticket_id, chat_score, flagged_count, flagged_messages, quality_score, analyzed_at)"
    " VALUES (:tid, :chat, :n, :flags, :quality, :now)"
    " ON DUPLICATE KEY UPDATE chat_score = VALUES(chat_score), flagged_count = VALUES(flagged_count),"
    " flagged_messages = VALUES(flagged_messages), quality_score = VALUES(quality_score),"
    " analyzed_at = VALUES(analyzed_at)"
)

UPSERT_JOB = (
    "INSERT INTO ticket_analysis_job (ticket_id, status, total, done, seconds_total, started_at, finished_at, error)"
    " VALUES (:tid, :status, :total, :done, :secs, :started, :finished, :error)"
    " ON DUPLICATE KEY UPDATE status = VALUES(status), total = VALUES(total), done = VALUES(done),"
    " seconds_total = VALUES(seconds_total), started_at = VALUES(started_at),"
    " finished_at = VALUES(finished_at), error = VALUES(error)"
)


def ensure_tables(session):
    session.execute(text(CREATE_ANALYSIS))
    session.execute(text(CREATE_JOB))
    session.commit()


def chat_score_from_flags(flag_count):
    return max(0.0, 100.0 - PENALTY_PER_FLAG * flag_count)


def quality_score(rating, chat_score):
    if rating is None or chat_score is None:
        return None
    return round(RATING_WEIGHT * (rating / 5.0 * 100.0) + CHAT_WEIGHT * chat_score, 2)


def _save_job(session, tid, status, total, done, secs, started, finished=None, error=None):
    session.execute(text(UPSERT_JOB), {
        'tid': tid, 'status': status, 'total': total, 'done': done,
        'secs': round(secs, 2), 'started': started, 'finished': finished, 'error': error,
    })
    session.commit()


def run_analysis(app, ticket_id):
    session = app.SessionLocal()
    started = datetime.datetime.utcnow()
    try:
        from app.models import Ticket, TicketMessage
        ensure_tables(session)
        rows = session.query(TicketMessage).filter_by(ticket_id=ticket_id).all()
        messages = [(m.id, m.sender_type, m.message) for m in rows if m.message and m.message.strip()]
        total = len(messages)
        _save_job(session, ticket_id, 'running', total, 0, 0.0, started)

        flagged = []
        seconds_total = 0.0
        for i, (mid, sender, body) in enumerate(messages, start=1):
            t0 = time.time()
            result = analyze_sentiment(body)
            seconds_total += time.time() - t0
            if result.get('status') == 'ok' and result['probs']['negative'] >= HARM_NEG_PROB:
                flagged.append({'message_id': mid, 'sender_type': sender,
                                'negative_prob': result['probs']['negative'], 'text': body[:200]})
            _save_job(session, ticket_id, 'running', total, i, seconds_total, started)

        chat = chat_score_from_flags(len(flagged))
        ticket = session.query(Ticket).filter_by(id=ticket_id).first()
        rating = ticket.customer_rating if ticket else None
        session.execute(text(UPSERT_ANALYSIS), {
            'tid': ticket_id,
            'chat': chat,
            'n': len(flagged),
            'flags': json.dumps(flagged),
            'quality': quality_score(rating, chat),
            'now': datetime.datetime.utcnow(),
        })
        session.commit()
        _save_job(session, ticket_id, 'done', total, total, seconds_total, started, datetime.datetime.utcnow())
    except Exception as e:
        session.rollback()
        logger.exception('ticket analysis failed for ticket %s: %s', ticket_id, e)
        try:
            _save_job(session, ticket_id, 'failed', 0, 0, 0.0, started, datetime.datetime.utcnow(), str(e)[:500])
        except Exception:
            session.rollback()
    finally:
        session.close()


def start_analysis(app, ticket_id):
    threading.Thread(target=run_analysis, args=(app, ticket_id), daemon=True).start()


def refresh_quality(session, ticket_id, rating):
    ensure_tables(session)
    row = session.execute(text("SELECT chat_score FROM ticket_analysis WHERE ticket_id = :tid"),
                          {'tid': ticket_id}).first()
    if row is None:
        return
    chat = float(row[0]) if row[0] is not None else None
    session.execute(text("UPDATE ticket_analysis SET quality_score = :q WHERE ticket_id = :tid"),
                    {'q': quality_score(rating, chat), 'tid': ticket_id})
    session.commit()


def load_analysis(session):
    score_rows = session.execute(text(
        "SELECT ticket_id, chat_score, flagged_count, quality_score, analyzed_at FROM ticket_analysis"
    )).mappings().all()
    scores = {}
    for r in score_rows:
        scores[r['ticket_id']] = {
            'chat_score': float(r['chat_score']) if r['chat_score'] is not None else None,
            'flagged_count': r['flagged_count'],
            'quality_score': float(r['quality_score']) if r['quality_score'] is not None else None,
            'analyzed_at': r['analyzed_at'].isoformat() if r['analyzed_at'] else None,
        }
    job_rows = session.execute(text(
        "SELECT ticket_id, status, total, done, seconds_total, error FROM ticket_analysis_job"
    )).mappings().all()
    jobs = {}
    for r in job_rows:
        done = r['done'] or 0
        total = r['total'] or 0
        secs = float(r['seconds_total'] or 0)
        avg = secs / done if done else DEFAULT_SECONDS_PER_MESSAGE
        jobs[r['ticket_id']] = {
            'status': r['status'],
            'total': total,
            'done': done,
            'eta_seconds': round(max(0, total - done) * avg, 1) if r['status'] == 'running' else 0,
            'error': r['error'],
        }
    return {'scores': scores, 'jobs': jobs}
