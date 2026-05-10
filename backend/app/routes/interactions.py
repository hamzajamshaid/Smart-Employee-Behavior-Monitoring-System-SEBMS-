from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

interactions_bp = Blueprint('interactions', __name__)

@interactions_bp.route('/interactions', methods=['GET'])
@jwt_required()
def get_interactions():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Interaction
            
            interactions = session.query(Interaction).all()
            
            result = []
            for i in interactions:
                result.append({
                    'id': i.id,
                    'employee_id': i.employee_id,
                    'employee_name': i.employee.name if i.employee else 'Unknown',
                    'start_timestamp': i.start_timestamp.isoformat() if i.start_timestamp else None,
                    'end_timestamp': i.end_timestamp.isoformat() if i.end_timestamp else None,
                    'created_at': i.created_at.isoformat() if i.created_at else None
                })
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@interactions_bp.route('/interactions', methods=['POST'])
@jwt_required()
def create_interaction():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Interaction, Employee
            
            employee = session.query(Employee).filter_by(id=user_id).first()
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            interaction = Interaction(
                employee_id=user_id,
                start_timestamp=datetime.utcnow(),
                video_file_path=data.get('video_file_path')
            )
            
            session.add(interaction)
            session.commit()
            
            return jsonify({
                'id': interaction.id,
                'employee_id': interaction.employee_id,
                'start_timestamp': interaction.start_timestamp.isoformat(),
                'message': 'Interaction created'
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@interactions_bp.route('/interactions/<int:interaction_id>', methods=['GET'])
@jwt_required()
def get_interaction_detail(interaction_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Interaction
            
            interaction = session.query(Interaction).filter_by(id=interaction_id).first()
            
            if not interaction:
                return jsonify({'error': 'Interaction not found'}), 404
            
            return jsonify({
                'id': interaction.id,
                'employee_id': interaction.employee_id,
                'employee_name': interaction.employee.name if interaction.employee else 'Unknown',
                'start_timestamp': interaction.start_timestamp.isoformat() if interaction.start_timestamp else None,
                'end_timestamp': interaction.end_timestamp.isoformat() if interaction.end_timestamp else None,
                'video_file_path': interaction.video_file_path,
                'created_at': interaction.created_at.isoformat() if interaction.created_at else None
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@interactions_bp.route('/interactions/<int:interaction_id>', methods=['PUT'])
@jwt_required()
def update_interaction(interaction_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Interaction
            
            interaction = session.query(Interaction).filter_by(id=interaction_id).first()
            
            if not interaction:
                return jsonify({'error': 'Interaction not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            if 'end_timestamp' in data:
                interaction.end_timestamp = datetime.fromisoformat(data['end_timestamp'])
            if 'video_file_path' in data:
                interaction.video_file_path = data['video_file_path']
            
            session.commit()
            
            return jsonify({
                'id': interaction.id,
                'end_timestamp': interaction.end_timestamp.isoformat() if interaction.end_timestamp else None,
                'message': 'Interaction updated'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500