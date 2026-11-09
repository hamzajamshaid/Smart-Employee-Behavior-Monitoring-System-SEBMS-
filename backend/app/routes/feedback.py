import re
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt
from app.models import Interaction, Employee, CustomerFeedback

feedback_api_bp = Blueprint('feedback_api', __name__)


@feedback_api_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    # Public: the customer scans the QR code without logging in
    data = request.get_json(silent=True) or {}
    try:
        interaction_id = int(data.get('interaction_id'))
        rating = int(data.get('rating'))
    except (TypeError, ValueError):
        return jsonify({'error': 'interaction_id and rating are required'}), 400
    if not 1 <= rating <= 5:
        return jsonify({'error': 'rating must be between 1 and 5'}), 400

    name = (data.get('customer_name') or '').strip()
    phone = re.sub(r'\D', '', str(data.get('customer_phone') or ''))
    if len(name) < 2 or len(phone) < 7:
        return jsonify({'error': 'Name and phone number are required'}), 400

    session = current_app.SessionLocal()
    try:
        if not session.query(Interaction).filter_by(id=interaction_id).first():
            return jsonify({'error': 'Interaction not found'}), 404
        if session.query(CustomerFeedback).filter_by(interaction_id=interaction_id).first():
            return jsonify({'error': 'Feedback already submitted for this session'}), 409
        fb = CustomerFeedback(
            interaction_id=interaction_id,
            star_rating=rating,
            comments=data.get('comment') or None,
            customer_name=name[:100],
            customer_phone=phone[:20],
        )
        session.add(fb)
        session.commit()
        return jsonify({'status': 'success', 'id': fb.id}), 201
    finally:
        session.close()


@feedback_api_bp.route('/feedback', methods=['GET'])
@jwt_required()
def list_feedback():
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    session = current_app.SessionLocal()
    try:
        rows = session.query(CustomerFeedback).order_by(CustomerFeedback.id.desc()).limit(200).all()
        out = []
        for fb in rows:
            it = session.query(Interaction).filter_by(id=fb.interaction_id).first()
            emp = session.query(Employee).filter_by(id=it.employee_id).first() if it else None
            out.append({
                'id': fb.id,
                'interaction_id': fb.interaction_id,
                'rating': fb.star_rating,
                'comment': fb.comments,
                'employee_name': emp.name if emp else None,
                'customer_name': fb.customer_name,
                'customer_phone': fb.customer_phone,
                'created_at': it.start_timestamp.isoformat() + 'Z' if it and it.start_timestamp else None,
            })
        return jsonify(out)
    finally:
        session.close()
