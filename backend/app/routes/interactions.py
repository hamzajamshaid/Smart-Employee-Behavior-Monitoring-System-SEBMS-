from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models import Interaction, Employee

interactions_bp = Blueprint('interactions', __name__)

@interactions_bp.route('/interactions/start', methods=['POST'])
@jwt_required()
def start_interaction():
    try:
        from app.services.file_manager import get_file_manager
        
        identity = get_jwt_identity()
        employee_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            employee = session.query(Employee).filter_by(id=employee_id).first()
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            interaction = Interaction(
                employee_id=employee_id,
                start_timestamp=datetime.utcnow(),
                video_file_path=None
            )
            
            session.add(interaction)
            session.commit()
            
            file_manager = get_file_manager()
            video_path = file_manager.get_video_path(interaction.id)
            audio_path = file_manager.get_audio_path(interaction.id)
            
            return jsonify({
                'id': interaction.id,
                'employee_id': employee_id,
                'employee_name': employee.name,
                'start_timestamp': interaction.start_timestamp.isoformat(),
                'video_file_path': video_path,
                'audio_file_path': audio_path,
                'status': 'started',
                'message': 'Interaction started. Begin capturing video/audio.'
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@interactions_bp.route('/interactions/<int:interaction_id>/end', methods=['PUT'])
@jwt_required()
def end_interaction(interaction_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            interaction = session.query(Interaction).filter_by(id=interaction_id).first()
            
            if not interaction:
                return jsonify({'error': 'Interaction not found'}), 404
            
            if interaction.employee_id != user_id:
                return jsonify({'error': 'Unauthorized'}), 403
            
            data = request.get_json() or {}
            
            if 'end_timestamp' in data:
                interaction.end_timestamp = datetime.fromisoformat(data['end_timestamp'])
            else:
                interaction.end_timestamp = datetime.utcnow()
            
            if 'video_file_path' in data:
                interaction.video_file_path = data['video_file_path']
            
            session.commit()
            
            return jsonify({
                'id': interaction.id,
                'employee_id': interaction.employee_id,
                'start_timestamp': interaction.start_timestamp.isoformat(),
                'end_timestamp': interaction.end_timestamp.isoformat(),
                'duration_seconds': (interaction.end_timestamp - interaction.start_timestamp).total_seconds(),
                'status': 'queued_for_processing',
                'message': 'Interaction ended. Queued for behavioral analysis.'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def _caller():
    """Return (role, user_id) from the token. Never trust a client-supplied employee_id."""
    from flask_jwt_extended import get_jwt, get_jwt_identity
    return get_jwt().get('role'), int(get_jwt_identity())


@interactions_bp.route('/interactions', methods=['GET'])
@jwt_required()
def get_interactions():
    try:
        role, user_id = _caller()
        if role not in ('Admin', 'Employee'):
            return jsonify([]), 200
        
        session = current_app.SessionLocal()
        
        try:
            q = session.query(Interaction)
            if role == 'Employee':
                q = q.filter(Interaction.employee_id == user_id)
            interactions = q.all()
            
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

@interactions_bp.route('/interactions/<int:interaction_id>', methods=['GET'])
@jwt_required()
def get_interaction_detail(interaction_id):
    try:
        role, user_id = _caller()
        if role not in ('Admin', 'Employee'):
            return jsonify({'error': 'Interaction not found'}), 404
        
        session = current_app.SessionLocal()
        
        try:
            interaction = session.query(Interaction).filter_by(id=interaction_id).first()
            
            if not interaction or (role == 'Employee' and interaction.employee_id != user_id):
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

