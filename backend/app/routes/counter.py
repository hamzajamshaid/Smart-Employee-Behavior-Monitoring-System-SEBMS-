from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from app.models import Interaction, Employee, ResponseTimeRecord

counter_bp = Blueprint('counter', __name__)


def _iso(v):
    return v.isoformat() + 'Z' if v else None


@counter_bp.route('/counter/sessions', methods=['GET'])
@jwt_required()
def counter_sessions():
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    session = current_app.SessionLocal()
    try:
        rows = (session.query(Interaction)
                .filter(Interaction.video_file_path.isnot(None))
                .order_by(Interaction.id.desc())
                .limit(100).all())
        out = []
        for it in rows:
            emp = session.query(Employee).filter_by(id=it.employee_id).first()
            rt = session.query(ResponseTimeRecord).filter_by(interaction_id=it.id).first()
            out.append({
                'interaction_id': it.id,
                'employee_name': emp.name if emp else None,
                'start': _iso(it.start_timestamp),
                'end': _iso(it.end_timestamp),
                'arrival_at': _iso(rt.arrival_at) if rt else None,
                'response_at': _iso(rt.response_at) if rt else None,
                'response_seconds': rt.response_seconds if rt else None,
                'response_status': rt.status if rt else None,
                'has_video': bool(it.video_file_path),
            })
        return jsonify(out)
    finally:
        session.close()
