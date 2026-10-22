from datetime import datetime
from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.models import Alert, Employee

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
