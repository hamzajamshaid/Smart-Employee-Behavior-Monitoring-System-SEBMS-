from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.models import SensorPresenceEvent

sensor_bp = Blueprint('sensor', __name__)


@sensor_bp.route('/sensor/state', methods=['GET'])
@jwt_required()
def sensor_state():
    session = current_app.SessionLocal()
    try:
        ev = session.query(SensorPresenceEvent).order_by(SensorPresenceEvent.id.desc()).first()
        if not ev:
            return jsonify({'is_present': False, 'since': None})
        return jsonify({'is_present': bool(ev.is_present), 'since': ev.created_at.isoformat() + 'Z'})
    finally:
        session.close()
