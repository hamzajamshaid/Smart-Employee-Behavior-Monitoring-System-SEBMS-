from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime, timedelta
import hashlib
import random
import string

employees_bp = Blueprint('employees', __name__)

def generate_employee_code():
    return 'EMP' + ''.join(random.choices(string.digits, k=3))

def generate_password(length=8):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

# ============================================================================
# ADD EMPLOYEE
# ============================================================================

@employees_bp.route('/employees', methods=['POST'])
@jwt_required()
def add_employee():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        from app.models import User, Employee
        session = current_app.SessionLocal()
        
        try:
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can add employees'}), 403
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            name = data.get('name', '').strip()
            counter_id = data.get('counter_id')
            
            if not name:
                return jsonify({'error': 'Name required'}), 400
            
            if counter_id is None:
                return jsonify({'error': 'counter_id required'}), 400
            
            email = data.get('email', '').strip() if data.get('email') else None
            phone = data.get('phone', '').strip() if data.get('phone') else None
            
            employee_code = generate_employee_code()
            while session.query(Employee).filter_by(employee_code=employee_code).first():
                employee_code = generate_employee_code()
            
            password = generate_password()
            
            employee = Employee(
                name=name,
                counter_id=counter_id,
                status='Active',
                employee_code=employee_code,
                password_hash=hash_pw(password),
                email=email,
                phone=phone
            )
            
            session.add(employee)
            session.commit()
            
            return jsonify({
                'id': employee.id,
                'name': employee.name,
                'employee_code': employee_code,
                'password': password,
                'counter_id': employee.counter_id,
                'status': employee.status,
                'message': 'Employee created successfully. Save credentials!'
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ============================================================================
# GET ALL EMPLOYEES
# ============================================================================

@employees_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Employee, BehavioralScore, Interaction, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can view employees'}), 403
            
            employees = session.query(Employee).all()
            
            employees_data = []
            for e in employees:
                latest_score = session.query(BehavioralScore).filter_by(
                    employee_id=e.id
                ).order_by(BehavioralScore.date.desc()).first()
                
                total_interactions = session.query(func.count(Interaction.id)).filter_by(
                    employee_id=e.id
                ).scalar() or 0
                
                employees_data.append({
                    'id': e.id,
                    'name': e.name,
                    'counter_id': e.counter_id,
                    'status': e.status,
                    'employee_code': e.employee_code,
                    'email': e.email,
                    'phone': e.phone,
                    'hire_date': e.hire_date.isoformat() if e.hire_date else None,
                    'unified_score': round(latest_score.unified_score, 1) if latest_score else 0,
                    'total_interactions': total_interactions
                })
            
            return jsonify(employees_data), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ============================================================================
# GET EMPLOYEE DETAIL
# ============================================================================

@employees_bp.route('/employees/<int:employee_id>', methods=['GET'])
@jwt_required()
def get_employee_detail(employee_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Employee, BehavioralScore, Interaction, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can view employee details'}), 403
            
            employee = session.query(Employee).filter_by(id=employee_id).first()
            
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            sixty_days_ago = datetime.utcnow() - timedelta(days=60)
            scores = session.query(BehavioralScore).filter(
                BehavioralScore.employee_id == employee_id,
                BehavioralScore.date >= sixty_days_ago
            ).order_by(BehavioralScore.date.asc()).all()
            
            trend = []
            for s in scores:
                trend.append({
                    'date': s.date.strftime('%Y-%m-%d') if s.date else None,
                    'score': round(s.unified_score, 1)
                })
            
            latest_score = round(scores[-1].unified_score, 1) if scores else 0
            
            return jsonify({
                'id': employee.id,
                'name': employee.name,
                'counter_id': employee.counter_id,
                'status': employee.status,
                'employee_code': employee.employee_code,
                'email': employee.email,
                'phone': employee.phone,
                'hire_date': employee.hire_date.isoformat() if employee.hire_date else None,
                'unified_score': latest_score,
                'trend': trend
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ============================================================================
# UPDATE EMPLOYEE STATUS
# ============================================================================

@employees_bp.route('/employees/<int:employee_id>/status', methods=['PUT'])
@jwt_required()
def update_employee_status(employee_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Employee, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can update status'}), 403
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            status = data.get('status', '').strip()
            
            if not status:
                return jsonify({'error': 'Status required'}), 400
            
            valid_statuses = ['Active', 'Inactive', 'On Leave']
            if status not in valid_statuses:
                return jsonify({'error': f'Invalid status'}), 400
            
            employee = session.query(Employee).filter_by(id=employee_id).first()
            
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            employee.status = status
            session.commit()
            
            return jsonify({
                'id': employee.id,
                'name': employee.name,
                'status': employee.status,
                'message': f'Status updated to {status}'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ============================================================================
# RESET PASSWORD
# ============================================================================

@employees_bp.route('/employees/<int:employee_id>/reset-password', methods=['PUT'])
@jwt_required()
def reset_employee_password(employee_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Employee, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can reset passwords'}), 403
            
            employee = session.query(Employee).filter_by(id=employee_id).first()
            
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            new_password = generate_password()
            employee.password_hash = hash_pw(new_password)
            session.commit()
            
            return jsonify({
                'id': employee.id,
                'name': employee.name,
                'new_password': new_password,
                'message': 'Password reset successfully!'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ============================================================================
# DELETE EMPLOYEE
# ============================================================================

@employees_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(employee_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Employee, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can delete employees'}), 403
            
            employee = session.query(Employee).filter_by(id=employee_id).first()
            
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            employee.status = 'Inactive'
            session.commit()
            
            return jsonify({
                'id': employee.id,
                'name': employee.name,
                'message': 'Employee marked as inactive'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500