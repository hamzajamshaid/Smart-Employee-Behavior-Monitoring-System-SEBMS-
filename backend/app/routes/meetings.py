import json
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import text

meetings_bp = Blueprint('meetings', __name__)

JOIN_BEFORE = timedelta(minutes=10)   # meeting opens 10 min before the appointment
JOIN_AFTER = timedelta(minutes=60)    # and closes 60 min after it
SIGNAL_KEEP = timedelta(hours=2)      # old signalling rows are removed
ALLOWED_KINDS = ('presence', 'offer', 'answer', 'ice')


def _ensure_table(session):
    session.execute(text("""
        CREATE TABLE IF NOT EXISTS meeting_signals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT NOT NULL,
            sender_role VARCHAR(12) NOT NULL,
            kind VARCHAR(20) NOT NULL,
            payload LONGTEXT NULL,
            created_at DATETIME NOT NULL,
            INDEX idx_meet_appt (appointment_id, id)
        )
    """))


def _window(a):
    return a.appointment_date - JOIN_BEFORE, a.appointment_date + JOIN_AFTER


def _participant(a):
    """Role allowed to join this meeting: the booking customer or the assigned employee."""
    role, uid = get_jwt().get('role'), int(get_jwt_identity())
    if role == 'Customer' and a.customer_id == uid:
        return 'Customer'
    if role == 'Employee' and a.employee_id == uid:
        return 'Employee'
    return None


def _join_state(a):
    if a.status != 'Confirmed':
        return False, 'Meetings are available only for confirmed appointments'
    start, end = _window(a)
    now = datetime.now()  # appointment times are stored as local time
    if now < start:
        return False, f'Meeting opens {int(JOIN_BEFORE.total_seconds() // 60)} minutes before the appointment'
    if now > end:
        return False, 'This meeting window has ended'
    return True, ''


@meetings_bp.route('/meetings/<int:appointment_id>/status', methods=['GET'])
@jwt_required()
def meeting_status(appointment_id):
    try:
        session = current_app.SessionLocal()
        try:
            from app.models import Appointment
            a = session.query(Appointment).filter_by(id=appointment_id).first()
            if not a:
                return jsonify({'error': 'Appointment not found'}), 404
            role = _participant(a)
            if not role:
                return jsonify({'error': 'You are not part of this appointment'}), 403
            ok, reason = _join_state(a)
            start, end = _window(a)
            return jsonify({
                'can_join': ok,
                'reason': reason,
                'role': role,
                'window_start': start.isoformat(),
                'window_end': end.isoformat(),
                'customer_name': a.customer.full_name if a.customer else '',
                'employee_name': a.employee.name if a.employee else '',
            }), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@meetings_bp.route('/meetings/<int:appointment_id>/signal', methods=['POST'])
@jwt_required()
def post_signal(appointment_id):
    try:
        data = request.get_json(silent=True) or {}
        kind = data.get('kind')
        if kind not in ALLOWED_KINDS:
            return jsonify({'error': 'Invalid signal kind'}), 400
        session = current_app.SessionLocal()
        try:
            from app.models import Appointment
            a = session.query(Appointment).filter_by(id=appointment_id).first()
            if not a:
                return jsonify({'error': 'Appointment not found'}), 404
            role = _participant(a)
            if not role:
                return jsonify({'error': 'You are not part of this appointment'}), 403
            ok, reason = _join_state(a)
            if not ok:
                return jsonify({'error': reason}), 409
            _ensure_table(session)
            now = datetime.now()
            session.execute(text("DELETE FROM meeting_signals WHERE created_at < :cut"),
                            {'cut': now - SIGNAL_KEEP})
            session.execute(text("""
                INSERT INTO meeting_signals (appointment_id, sender_role, kind, payload, created_at)
                VALUES (:a, :r, :k, :p, :c)
            """), {'a': appointment_id, 'r': role, 'k': kind,
                   'p': json.dumps(data.get('payload')), 'c': now})
            session.commit()
            return jsonify({'ok': True}), 201
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@meetings_bp.route('/meetings/<int:appointment_id>/signals', methods=['GET'])
@jwt_required()
def get_signals(appointment_id):
    try:
        after = request.args.get('after', 0, type=int)
        session = current_app.SessionLocal()
        try:
            from app.models import Appointment
            a = session.query(Appointment).filter_by(id=appointment_id).first()
            if not a:
                return jsonify({'error': 'Appointment not found'}), 404
            role = _participant(a)
            if not role:
                return jsonify({'error': 'You are not part of this appointment'}), 403
            ok, reason = _join_state(a)
            if not ok:
                return jsonify({'error': reason}), 409
            _ensure_table(session)
            rows = session.execute(text("""
                SELECT id, sender_role, kind, payload FROM meeting_signals
                WHERE appointment_id = :a AND id > :after AND sender_role <> :me
                ORDER BY id LIMIT 200
            """), {'a': appointment_id, 'after': after, 'me': role}).fetchall()
            return jsonify({'signals': [
                {'id': r.id, 'from': r.sender_role, 'kind': r.kind,
                 'payload': json.loads(r.payload) if r.payload else None}
                for r in rows
            ]}), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500
