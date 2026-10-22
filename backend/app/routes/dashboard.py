import json
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import or_
from app.models import BehavioralScore, Interaction, ResponseTimeRecord, Employee

dashboard_bp = Blueprint('dashboard', __name__)


def _avg(values):
    """Average over real values only. Returns None (not 0) if nothing was measured."""
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 2) if vals else None


def _period_start(period):
    today = datetime.utcnow().date()
    if period == 'today':
        return today
    if period == 'week':
        return today - timedelta(days=7)
    if period == 'month':
        return today - timedelta(days=30)
    return None  # 'all'


def _valid_scores(session):
    # 'scored' rows, plus legacy seed rows that have no status (kept as valid data)
    q = session.query(BehavioralScore).filter(
        or_(BehavioralScore.score_status == 'scored',
            BehavioralScore.score_status.is_(None))
    )
    # Default: measured rows only. Seed rows (no interaction) appear only with include_seed=1.
    if request.args.get('include_seed') != '1':
        q = q.filter(BehavioralScore.interaction_id.isnot(None))
    return q


def _scoped_employee_id():
    """Admin: may filter by any employee_id query param.
    Employee: forced to their own ID (client value ignored).
    Any other role: -1, which matches no rows."""
    from flask_jwt_extended import get_jwt, get_jwt_identity
    role = get_jwt().get('role')
    if role == 'Admin':
        return request.args.get('employee_id', type=int)
    if role == 'Employee':
        return int(get_jwt_identity())
    return -1


@dashboard_bp.route('/dashboard/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    session = current_app.SessionLocal()
    try:
        period = request.args.get('period', 'week')
        employee_id = _scoped_employee_id()
        start = _period_start(period)

        query = _valid_scores(session)
        if start:
            query = query.filter(BehavioralScore.date >= start)
        if employee_id:
            query = query.filter(BehavioralScore.employee_id == employee_id)
        scores = query.all()

        insufficient = session.query(BehavioralScore).filter(
            BehavioralScore.score_status == 'insufficient_signals')
        if start:
            insufficient = insufficient.filter(BehavioralScore.date >= start)
        if employee_id:
            insufficient = insufficient.filter(BehavioralScore.employee_id == employee_id)

        return jsonify({
            'period': period,
            'total_interactions': len(scores),
            'insufficient_signal_count': insufficient.count(),
            'avg_unified_score': _avg([s.unified_score for s in scores]),
            'avg_presence': _avg([s.presence_score for s in scores]),
            'avg_emotion': _avg([s.emotion_score for s in scores]),
            'avg_voice': _avg([s.voice_score for s in scores]),
            # Response and feedback are not fused yet (see Phase 9 / Phase 8)
            'avg_response': None,
            'avg_feedback': None,
        }), 200
    except Exception as e:
        return jsonify({'error': 'summary unavailable', 'detail': str(e)}), 500
    finally:
        session.close()


def _processing_status(interaction, score):
    if interaction.end_timestamp is None:
        return 'in_progress'
    if score is None:
        return 'not_processed'
    return score.score_status or 'legacy'


def _missing_reasons(score):
    if score is None or not score.error_details:
        return {}
    try:
        return json.loads(score.error_details)
    except (ValueError, TypeError):
        return {'raw': score.error_details}


@dashboard_bp.route('/dashboard/interactions', methods=['GET'])
@jwt_required()
def dashboard_interactions():
    session = current_app.SessionLocal()
    try:
        period = request.args.get('period', 'week')
        employee_id = _scoped_employee_id()
        start = _period_start(period)

        query = session.query(Interaction)
        if start:
            query = query.filter(Interaction.start_timestamp >= start)
        if employee_id:
            query = query.filter(Interaction.employee_id == employee_id)
        interactions = query.order_by(Interaction.start_timestamp.desc()).limit(200).all()

        rows = []
        for it in interactions:
            score = session.query(BehavioralScore).filter(
                BehavioralScore.interaction_id == it.id).first()
            rt = session.query(ResponseTimeRecord).filter(
                ResponseTimeRecord.interaction_id == it.id).first()
            rows.append({
                'id': it.id,
                'employee_id': it.employee_id,
                'employee_name': it.employee.name if it.employee else None,
                'start_timestamp': it.start_timestamp.isoformat() if it.start_timestamp else None,
                'end_timestamp': it.end_timestamp.isoformat() if it.end_timestamp else None,
                'processing_status': _processing_status(it, score),
                'unified_score': score.unified_score if score else None,
                'presence_score': score.presence_score if score else None,
                'emotion_score': score.emotion_score if score else None,
                'voice_score': score.voice_score if score else None,
                'signals_used': score.signals_used.split(',') if score and score.signals_used else [],
                'missing_reasons': _missing_reasons(score),
                'response_seconds': rt.response_seconds if rt else None,
                'response_status': rt.status if rt else 'missing_event',
            })
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({'error': 'interactions unavailable', 'detail': str(e)}), 500
    finally:
        session.close()


@dashboard_bp.route('/dashboard/trend', methods=['GET'])
@jwt_required()
def dashboard_trend():
    """Returns {employee_name: [{date, score}]}, all series on the same date axis.
    score is the daily mean of valid unified scores; null where no valid score exists."""
    session = current_app.SessionLocal()
    try:
        period = request.args.get('period')
        if period:
            start = _period_start(period)
        else:
            days = request.args.get('days', 7, type=int)
            start = datetime.utcnow().date() - timedelta(days=days)
        employee_id = _scoped_employee_id()

        query = _valid_scores(session)
        if start:
            query = query.filter(BehavioralScore.date >= start)
        if employee_id:
            query = query.filter(BehavioralScore.employee_id == employee_id)
        scores = query.all()
        names = {e.id: e.name for e in session.query(Employee).all()}

        buckets = {}
        for sc in scores:
            if sc.unified_score is None:
                continue
            name = names.get(sc.employee_id, str(sc.employee_id))
            day = sc.date.date().isoformat()
            buckets.setdefault(name, {}).setdefault(day, []).append(sc.unified_score)

        all_days = sorted({d for series in buckets.values() for d in series})
        result = {}
        for name, by_day in buckets.items():
            result[name] = [{
                'date': d,
                'score': round(sum(by_day[d]) / len(by_day[d]), 2) if d in by_day else None,
            } for d in all_days]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': 'trend unavailable', 'detail': str(e)}), 500
    finally:
        session.close()


@dashboard_bp.route('/dashboard/performers', methods=['GET'])
@jwt_required()
def dashboard_performers():
    from flask_jwt_extended import get_jwt
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    """Per-employee average over MEASURED interactions only (interaction_id not null).
    Employees with no measured data are returned with avg=null and are not ranked."""
    session = current_app.SessionLocal()
    try:
        period = request.args.get('period', 'month')
        start = _period_start(period)
        q = _valid_scores(session)
        if start:
            q = q.filter(BehavioralScore.date >= start)
        buckets = {}
        for sc in q.all():
            if sc.unified_score is None:
                continue
            buckets.setdefault(sc.employee_id, []).append(sc.unified_score)
        rows = []
        for e in session.query(Employee).all():
            vals = buckets.get(e.id, [])
            rows.append({
                'employee_id': e.id,
                'name': e.name,
                'measured_count': len(vals),
                'avg_unified_score': round(sum(vals) / len(vals), 2) if vals else None,
            })
        ranked = sorted([r for r in rows if r['avg_unified_score'] is not None],
                        key=lambda r: r['avg_unified_score'], reverse=True)
        unranked = [r for r in rows if r['avg_unified_score'] is None]
        return jsonify({'ranked': ranked[:3], 'unranked': unranked}), 200
    except Exception as e:
        return jsonify({'error': 'performers unavailable', 'detail': str(e)}), 500
    finally:
        session.close()
