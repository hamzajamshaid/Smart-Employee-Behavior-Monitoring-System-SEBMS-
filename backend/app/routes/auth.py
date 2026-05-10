from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models import User, Employee, Customer
import hashlib
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ============================================================================
# ADMIN LOGIN
# ============================================================================

@auth_bp.route('/auth/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        from flask import current_app
        session = current_app.SessionLocal()
        
        try:
            user = session.query(User).filter_by(username=username).first()
            
            if not user or user.password_hash != hash_password(password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            user.last_login = datetime.utcnow()
            session.commit()
            
            token = create_access_token(identity=str(user.id))
            
            return jsonify({
                'token': token,
                'role': user.role,
                'username': user.username
            }), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# EMPLOYEE LOGIN
# ============================================================================

@auth_bp.route('/api/auth/employee-login', methods=['POST'])
def employee_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        employee_code = data.get('employee_code', '').strip()
        password = data.get('password', '').strip()
        
        if not employee_code or not password:
            return jsonify({'error': 'Employee code and password required'}), 400
        
        from flask import current_app
        session = current_app.SessionLocal()
        
        try:
            employee = session.query(Employee).filter_by(employee_code=employee_code).first()
            
            if not employee or not employee.password_hash:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            if employee.password_hash != hash_password(password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            if employee.status != 'Active':
                return jsonify({'error': 'Employee account is inactive'}), 403
            
            token = create_access_token(identity=str(employee.id))
            
            return jsonify({
                'token': token,
                'role': 'Employee',
                'employee_id': employee.id,
                'name': employee.name
            }), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# CUSTOMER LOGIN
# ============================================================================

@auth_bp.route('/api/auth/customer-login', methods=['POST'])
def customer_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        phone = data.get('phone', '').strip()
        password = data.get('password', '').strip()
        
        if not phone or not password:
            return jsonify({'error': 'Phone and password required'}), 400
        
        from flask import current_app
        session = current_app.SessionLocal()
        
        try:
            customer = session.query(Customer).filter_by(phone=phone).first()
            
            if not customer or customer.password_hash != hash_password(password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            if not customer.is_active:
                return jsonify({'error': 'Customer account is inactive'}), 403
            
            token = create_access_token(identity=str(customer.id))
            
            return jsonify({
                'token': token,
                'role': 'Customer',
                'customer_id': customer.id,
                'name': customer.full_name
            }), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# CUSTOMER REGISTER
# ============================================================================

@auth_bp.route('/api/auth/customer-register', methods=['POST'])
def customer_register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        full_name = data.get('full_name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        if not full_name or not phone or not password:
            return jsonify({'error': 'Name, phone, and password required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        from flask import current_app
        session = current_app.SessionLocal()
        
        try:
            existing = session.query(Customer).filter_by(phone=phone).first()
            if existing:
                return jsonify({'error': 'Phone already registered'}), 409
            
            if email:
                existing_email = session.query(Customer).filter_by(email=email).first()
                if existing_email:
                    return jsonify({'error': 'Email already registered'}), 409
            
            new_customer = Customer(
                full_name=full_name,
                phone=phone,
                email=email if email else None,
                password_hash=hash_password(password),
                is_active=True
            )
            
            session.add(new_customer)
            session.commit()
            
            token = create_access_token(identity=str(new_customer.id))
            
            return jsonify({
                'token': token,
                'role': 'Customer',
                'customer_id': new_customer.id,
                'name': new_customer.full_name
            }), 201
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500