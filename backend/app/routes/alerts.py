from datetime import datetime
from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.models import Alert, Employee, BehavioralScore
from app.services.note_wording import get_polished

alerts_bp = Blueprint('alerts', __name__)


@alerts_bp.route('/alerts', methods=['GET'])
@jwt_required()
def list_alerts():
    from flask_jwt_extended import get_jwt
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    session = current_app.SessionLocal()
    try:
        rows = session.query(Alert).order_by(Alert.triggered_at.desc()).limit(200).all()
        names = {e.id: e.name for e in session.query(Employee).all()}
        return jsonify([{
            'id': a.id,
            'employee_id': a.employee_id,
            'employee_name': names.get(a.employee_id),
            'alert_type': a.alert_type,
            'message': a.message,
            'is_resolved': bool(a.is_resolved),
            'triggered_at': a.triggered_at.isoformat() if a.triggered_at else None,
            'resolved_at': a.resolved_at.isoformat() if a.resolved_at else None,
        } for a in rows]), 200
    except Exception as e:
        return jsonify({'error': 'alerts unavailable', 'detail': str(e)}), 500
    finally:
        session.close()


@alerts_bp.route('/alerts/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    from flask_jwt_extended import get_jwt
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    session = current_app.SessionLocal()
    try:
        a = session.query(Alert).filter(Alert.id == alert_id).first()
        if a is None:
            return jsonify({'error': 'alert not found'}), 404
        if not a.is_resolved:
            a.is_resolved = True
            a.resolved_at = datetime.utcnow()
            session.commit()
        return jsonify({'id': a.id, 'is_resolved': True}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': 'resolve failed', 'detail': str(e)}), 500
    finally:
        session.close()


FIXES = {
    'presence_score': ('Presence', 'keep the face in front of the camera for the whole visit'),
    'emotion_score': ('Expression', 'greet the customer with a warm, visible expression'),
    'response_score': ('Response time', 'respond faster, aiming for under 15 seconds'),
    'feedback_score': ('Customer rating', 'follow up politely so the customer submits the QR rating'),
    'voice_score': ('Voice', 'speak clearly, close to the microphone, and check the audio is working'),
}


@alerts_bp.route('/alerts/<int:alert_id>/explain', methods=['GET'])
@jwt_required()
def explain_alert(alert_id):
    import re
    from datetime import timedelta
    from flask_jwt_extended import get_jwt
    from app.models import CustomerFeedback, Interaction
    from app.services.scoring_weights import scoring_weights_fraction
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    session = current_app.SessionLocal()
    try:
        a = session.query(Alert).filter(Alert.id == alert_id).first()
        if a is None:
            return jsonify({'error': 'alert not found'}), 404
        m = re.search(r'([0-9]+(?:\.[0-9]+)?)', a.message or '')
        alert_score = float(m.group(1)) if m else None
        q = session.query(BehavioralScore).filter(BehavioralScore.employee_id == a.employee_id)
        if a.triggered_at:
            q = q.filter(BehavioralScore.date <= a.triggered_at,
                         BehavioralScore.date >= a.triggered_at - timedelta(minutes=10))
        score = None
        for row in q.order_by(BehavioralScore.date.desc()).all():
            if alert_score is None or (row.unified_score is not None and abs(row.unified_score - alert_score) < 0.01):
                score = row
                break
        if score is None:
            return jsonify({'alert_id': a.id, 'components': [],
                            'lines': [f"No score record matches this alert's score ({alert_score}). The explanation cannot be matched to a session."]}), 200

        weights = scoring_weights_fraction(session)
        labels = {'presence': 'Presence', 'emotion': 'Expression', 'response': 'Response time',
                  'feedback': 'Customer rating', 'voice': 'Voice'}
        fields = {'presence': 'presence_score', 'emotion': 'emotion_score', 'response': 'response_score',
                  'feedback': 'feedback_score', 'voice': 'voice_score'}
        components, notes = [], []
        for key, field in fields.items():
            w = weights.get(key, 0.0)
            value = getattr(score, field)
            if value is None:
                components.append({'name': labels[key], 'score': None, 'points': 0.0,
                                   'weight_pct': round(w * 100, 1), 'note': 'no data, 0 points'})
                continue
            components.append({'name': labels[key], 'score': round(value, 1),
                               'points': round(w * value, 1), 'weight_pct': round(w * 100, 1), 'note': None})
            if value < 60:
                notes.append(f"{labels[key]} is {round(value)}, below 60. Fix: {FIXES[field][1]}.")

        inter = session.query(Interaction).filter(Interaction.id == score.interaction_id).first()
        fb = session.query(CustomerFeedback).filter(CustomerFeedback.interaction_id == score.interaction_id).first()
        customer = fb.customer_name if fb and fb.customer_name else 'No customer recorded'
        when = inter.start_timestamp.strftime('%d %b %Y, %I:%M %p') if inter and inter.start_timestamp else 'time not recorded'
        header = (f"Customer: {customer}. Session {score.interaction_id} on {when}. "
                  f"Overall score {round(score.unified_score or 0, 1)}.")
        if not notes:
            notes.append(f"Overall score {round(score.unified_score or 0, 1)} is below 60, but no single part is below 60. Review the whole visit with the employee.")

        def same_numbers(orig, new):
            return bool(new) and set(re.findall(r'\d+(?:\.\d+)?', orig)) <= set(re.findall(r'\d+(?:\.\d+)?', new))

        polished = get_polished(notes)
        lines = [header] + [polished.get(n) if same_numbers(n, polished.get(n) or '') else n for n in notes]
        return jsonify({
            'alert_id': a.id,
            'unified_score': round(score.unified_score, 1) if score.unified_score is not None else None,
            'customer': customer,
            'session_time': when,
            'components': components,
            'lines': lines,
        }), 200
    except Exception as e:
        return jsonify({'error': 'explanation failed', 'detail': str(e)}), 500
    finally:
        session.close()
