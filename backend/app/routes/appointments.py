from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/appointments/service-types', methods=['GET'])
def get_service_types():
    try:
        return jsonify([
            'General',
            'Technical',
            'Maintenance',
            'Inspection',
            'Repair'
        ]), 200
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@appointments_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Appointment, Customer, Employee
            
            appointments = session.query(Appointment).all()
            
            result = []
            for a in appointments:
                result.append({
                    'id': a.id,
                    'customer_id': a.customer_id,
                    'customer_name': a.customer.full_name if a.customer else 'Unknown',
                    'employee_id': a.employee_id,
                    'employee_name': a.employee.name if a.employee else 'Unassigned',
                    'appointment_date': a.appointment_date.isoformat() if a.appointment_date else None,
                    'service_type': a.service_type,
                    'vehicle_model': a.vehicle_model,
                    'vehicle_plate': a.vehicle_plate,
                    'description': a.description,
                    'status': a.status,
                    'created_at': a.created_at.isoformat() if a.created_at else None
                })
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@appointments_bp.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Appointment, Customer
            
            customer = session.query(Customer).filter_by(id=user_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            appointment = Appointment(
                customer_id=customer.id,
                appointment_date=datetime.fromisoformat(data.get('appointment_date', '')),
                service_type=data.get('service_type', 'General'),
                vehicle_model=data.get('vehicle_model', ''),
                vehicle_plate=data.get('vehicle_plate', ''),
                description=data.get('description', ''),
                status='Pending'
            )
            
            session.add(appointment)
            session.commit()
            
            return jsonify({
                'id': appointment.id,
                'status': appointment.status,
                'message': 'Appointment booked successfully'
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@appointments_bp.route('/appointments/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment_detail(appointment_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Appointment
            
            appointment = session.query(Appointment).filter_by(id=appointment_id).first()
            
            if not appointment:
                return jsonify({'error': 'Appointment not found'}), 404
            
            return jsonify({
                'id': appointment.id,
                'customer_id': appointment.customer_id,
                'customer_name': appointment.customer.full_name if appointment.customer else 'Unknown',
                'employee_id': appointment.employee_id,
                'employee_name': appointment.employee.name if appointment.employee else 'Unassigned',
                'appointment_date': appointment.appointment_date.isoformat() if appointment.appointment_date else None,
                'service_type': appointment.service_type,
                'vehicle_model': appointment.vehicle_model,
                'vehicle_plate': appointment.vehicle_plate,
                'description': appointment.description,
                'status': appointment.status,
                'created_at': appointment.created_at.isoformat() if appointment.created_at else None
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@appointments_bp.route('/appointments/<int:appointment_id>', methods=['PATCH'])
@jwt_required()
def update_appointment(appointment_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Appointment
            
            appointment = session.query(Appointment).filter_by(id=appointment_id).first()
            
            if not appointment:
                return jsonify({'error': 'Appointment not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            if 'status' in data:
                appointment.status = data['status']
            if 'employee_id' in data:
                appointment.employee_id = data['employee_id']
            
            appointment.updated_at = datetime.utcnow()
            session.commit()
            
            return jsonify({
                'id': appointment.id,
                'status': appointment.status,
                'message': 'Appointment updated'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@appointments_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(appointment_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Appointment
            
            appointment = session.query(Appointment).filter_by(id=appointment_id).first()
            
            if not appointment:
                return jsonify({'error': 'Appointment not found'}), 404
            
            appointment.status = 'Cancelled'
            appointment.updated_at = datetime.utcnow()
            session.commit()
            
            return jsonify({
                'id': appointment.id,
                'status': appointment.status,
                'message': 'Appointment cancelled'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500