from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Attendance, Employee
            
            employee = session.query(Employee).filter_by(id=user_id).first()
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            records = session.query(Attendance).filter_by(employee_id=user_id).all()
            
            result = []
            for r in records:
                result.append({
                    'id': r.id,
                    'employee_id': r.employee_id,
                    'check_in_time': r.check_in_time.isoformat() if r.check_in_time else None,
                    'check_out_time': r.check_out_time.isoformat() if r.check_out_time else None,
                    'status': r.status,
                    'created_at': r.created_at.isoformat() if r.created_at else None
                })
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@attendance_bp.route('/attendance', methods=['POST'])
@jwt_required()
def check_in():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Attendance, Employee
            
            employee = session.query(Employee).filter_by(id=user_id).first()
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            # Check if already checked in today
            today = datetime.utcnow().date()
            existing = session.query(Attendance).filter(
                Attendance.employee_id == user_id,
                Attendance.check_in_time >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if existing and not existing.check_out_time:
                return jsonify({'error': 'Already checked in'}), 400
            
            record = Attendance(
                employee_id=user_id,
                check_in_time=datetime.utcnow(),
                status='Present'
            )
            
            session.add(record)
            session.commit()
            
            return jsonify({
                'id': record.id,
                'check_in_time': record.check_in_time.isoformat(),
                'message': 'Checked in successfully'
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@attendance_bp.route('/attendance/<int:record_id>', methods=['PUT'])
@jwt_required()
def check_out(record_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Attendance
            
            record = session.query(Attendance).filter_by(id=record_id).first()
            
            if not record:
                return jsonify({'error': 'Record not found'}), 404
            
            if record.employee_id != user_id:
                return jsonify({'error': 'Unauthorized'}), 403
            
            if record.check_out_time:
                return jsonify({'error': 'Already checked out'}), 400
            
            record.check_out_time = datetime.utcnow()
            session.commit()
            
            return jsonify({
                'id': record.id,
                'check_out_time': record.check_out_time.isoformat(),
                'message': 'Checked out successfully'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500