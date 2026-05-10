from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

tickets_bp = Blueprint('tickets', __name__)

@tickets_bp.route('/tickets/analytics', methods=['GET'])
@jwt_required()
def get_ticket_analytics():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import User, Ticket
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can view analytics'}), 403
            
            tickets = session.query(Ticket).all()
            
            response_data = {
                'total': len(tickets),
                'open': len([t for t in tickets if t.status == 'Open']),
                'in_progress': len([t for t in tickets if t.status == 'In Progress']),
                'resolved': len([t for t in tickets if t.status == 'Resolved']),
                'urgent': len([t for t in tickets if t.priority == 'Urgent']),
                'high': len([t for t in tickets if t.priority == 'High']),
                'medium': len([t for t in tickets if t.priority == 'Medium']),
                'low': len([t for t in tickets if t.priority == 'Low']),
                'avg_resolution_hours': 24,
                'recent_tickets': []
            }
            
            return jsonify(response_data), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets', methods=['GET'])
@jwt_required()
def get_tickets():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import User, Ticket
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            tickets = session.query(Ticket).all()
            
            result = []
            for t in tickets:
                result.append({
                    'id': t.id,
                    'title': t.title,
                    'description': t.description,
                    'type': t.ticket_type,
                    'priority': t.priority,
                    'status': t.status,
                    'customer_name': t.customer.full_name if t.customer else 'Unknown',
                    'customer_id': t.customer_id,
                    'employee_name': t.employee.name if t.employee else 'Unassigned',
                    'employee_id': t.employee_id,
                    'created_at': t.created_at.isoformat() if t.created_at else None,
                    'updated_at': t.updated_at.isoformat() if t.updated_at else None,
                    'customer_rating': t.customer_rating,
                    'resolution_note': t.resolution_note
                })
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket_detail(ticket_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Ticket
            
            ticket = session.query(Ticket).filter_by(id=ticket_id).first()
            
            if not ticket:
                return jsonify({'error': 'Ticket not found'}), 404
            
            return jsonify({
                'id': ticket.id,
                'title': ticket.title,
                'description': ticket.description,
                'type': ticket.ticket_type,
                'priority': ticket.priority,
                'status': ticket.status,
                'customer_name': ticket.customer.full_name if ticket.customer else 'Unknown',
                'customer_id': ticket.customer_id,
                'employee_name': ticket.employee.name if ticket.employee else 'Unassigned',
                'employee_id': ticket.employee_id,
                'created_at': ticket.created_at.isoformat() if ticket.created_at else None,
                'updated_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
                'customer_rating': ticket.customer_rating,
                'resolution_note': ticket.resolution_note
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Ticket, Customer
            
            customer = session.query(Customer).filter_by(id=user_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            ticket = Ticket(
                customer_id=customer.id,
                title=data.get('title', 'Untitled'),
                description=data.get('description', ''),
                ticket_type=data.get('type', 'General'),
                priority=data.get('priority', 'Medium'),
                status='Open'
            )
            
            session.add(ticket)
            session.commit()
            
            return jsonify({
                'id': ticket.id,
                'title': ticket.title,
                'status': ticket.status,
                'message': 'Ticket created successfully'
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets/<int:ticket_id>', methods=['PUT'])
@jwt_required()
def update_ticket(ticket_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Ticket, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can update tickets'}), 403
            
            ticket = session.query(Ticket).filter_by(id=ticket_id).first()
            if not ticket:
                return jsonify({'error': 'Ticket not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            # Update fields
            if 'status' in data:
                ticket.status = data['status']
            if 'priority' in data:
                ticket.priority = data['priority']
            if 'employee_id' in data:
                ticket.employee_id = data['employee_id'] if data['employee_id'] else None
            if 'resolution_note' in data:
                ticket.resolution_note = data['resolution_note']
            if 'customer_rating' in data:
                ticket.customer_rating = data['customer_rating']
            
            ticket.updated_at = datetime.utcnow()
            session.commit()
            
            return jsonify({
                'id': ticket.id,
                'status': ticket.status,
                'employee_id': ticket.employee_id,
                'message': 'Ticket updated successfully'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets/<int:ticket_id>/messages', methods=['GET'])
@jwt_required()
def get_ticket_messages(ticket_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import TicketMessage
            
            messages = session.query(TicketMessage).filter_by(ticket_id=ticket_id).all()
            
            result = []
            for m in messages:
                result.append({
                    'id': m.id,
                    'sender_type': m.sender_type,
                    'sender_id': m.sender_id,
                    'message': m.message,
                    'sent_at': m.sent_at.isoformat() if m.sent_at else None
                })
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets/<int:ticket_id>/messages', methods=['POST'])
@jwt_required()
def add_ticket_message(ticket_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import TicketMessage, Ticket, Customer, Employee, User
            
            ticket = session.query(Ticket).filter_by(id=ticket_id).first()
            if not ticket:
                return jsonify({'error': 'Ticket not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            # Determine sender type
            customer = session.query(Customer).filter_by(id=user_id).first()
            employee = session.query(Employee).filter_by(id=user_id).first()
            
            sender_type = 'Customer' if customer else 'Employee'
            
            message = TicketMessage(
                ticket_id=ticket_id,
                sender_type=sender_type,
                sender_id=user_id,
                message=data.get('message', '')
            )
            
            session.add(message)
            session.commit()
            
            return jsonify({
                'id': message.id,
                'message': message.message,
                'sent_at': message.sent_at.isoformat()
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets/<int:ticket_id>', methods=['DELETE'])
@jwt_required()
def delete_ticket(ticket_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Ticket, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can delete'}), 403
            
            ticket = session.query(Ticket).filter_by(id=ticket_id).first()
            if not ticket:
                return jsonify({'error': 'Ticket not found'}), 404
            
            session.delete(ticket)
            session.commit()
            
            return jsonify({'message': 'Ticket deleted'}), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500