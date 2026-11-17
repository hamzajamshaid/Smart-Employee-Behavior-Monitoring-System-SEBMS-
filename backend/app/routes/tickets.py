from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime

tickets_bp = Blueprint('tickets', __name__)

def _sender_name(session, m):
    from app.models import Customer, Employee
    if m.sender_type == 'Customer':
        c = session.query(Customer).filter_by(id=m.sender_id).first()
        return c.full_name if c else 'Customer'
    if m.sender_type == 'Employee':
        e = session.query(Employee).filter_by(id=m.sender_id).first()
        return e.name if e else 'Employee'
    return 'Support'

def _ticket_visible(t):
    role, uid = get_jwt().get('role'), int(get_jwt_identity())
    if role == 'Admin':
        return True
    if role == 'Customer':
        return t.customer_id == uid
    if role == 'Employee':
        return t.employee_id == uid
    return False


@tickets_bp.route('/tickets/analysis', methods=['GET'])
@jwt_required()
def get_ticket_analysis_list():
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Only admins can view analysis'}), 403
    session = current_app.SessionLocal()
    try:
        from app.services.ticket_analysis import ensure_tables, load_analysis
        ensure_tables(session)
        return jsonify(load_analysis(session)), 200
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500
    finally:
        session.close()

@tickets_bp.route('/tickets/<int:ticket_id>/analysis', methods=['GET'])
@jwt_required()
def get_single_ticket_analysis(ticket_id):
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Only admins can view analysis'}), 403
    session = current_app.SessionLocal()
    try:
        import json as _json
        from sqlalchemy import text
        from app.services.ticket_analysis import ensure_tables
        ensure_tables(session)
        job = session.execute(text(
            "SELECT status, total, done, error FROM ticket_analysis_job WHERE ticket_id = :tid"
        ), {'tid': ticket_id}).mappings().first()
        job_data = dict(job) if job else None
        row = session.execute(text(
            "SELECT chat_score, flagged_count, flagged_messages, quality_score, analyzed_at FROM ticket_analysis WHERE ticket_id = :tid"
        ), {'tid': ticket_id}).mappings().first()
        if row is None:
            return jsonify({'analyzed': False, 'job': job_data}), 200
        return jsonify({
            'analyzed': True,
            'chat_score': float(row['chat_score']) if row['chat_score'] is not None else None,
            'flagged_count': row['flagged_count'],
            'quality_score': float(row['quality_score']) if row['quality_score'] is not None else None,
            'analyzed_at': row['analyzed_at'].isoformat() if row['analyzed_at'] else None,
            'flagged_messages': _json.loads(row['flagged_messages'] or '[]'),
            'job': job_data
        }), 200
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500
    finally:
        session.close()

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
            from flask_jwt_extended import get_jwt
            if get_jwt().get('role') != 'Admin':
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
            
            
            _role = get_jwt().get('role')
            if _role == 'Admin':
                tickets = session.query(Ticket).all()
            elif _role == 'Customer':
                tickets = session.query(Ticket).filter(Ticket.customer_id == user_id).all()
            elif _role == 'Employee':
                tickets = session.query(Ticket).filter(Ticket.employee_id == user_id).all()
            else:
                tickets = []
            
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
            if not _ticket_visible(ticket):
                return jsonify({'error': 'Ticket not found'}), 404
            if get_jwt().get('role') == 'Customer' and ticket.employee_id is None:
                from app.services.ticket_assign import auto_assign_employee
                auto_assign_employee(session, ticket)
            
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
            from flask_jwt_extended import get_jwt
            if get_jwt().get('role') != 'Customer':
                return jsonify({'error': 'Customer role required'}), 403
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
            
            if get_jwt().get('role') != 'Admin':
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

@tickets_bp.route('/tickets/<int:ticket_id>/resolve', methods=['PUT'])
@jwt_required()
def customer_resolve_ticket(ticket_id):
    try:
        user_id = int(get_jwt_identity())
        if get_jwt().get('role') != 'Customer':
            return jsonify({'error': 'Customer role required'}), 403
        session = current_app.SessionLocal()
        try:
            from app.models import Ticket
            ticket = session.query(Ticket).filter_by(id=ticket_id).first()
            if not ticket or ticket.customer_id != user_id:
                return jsonify({'error': 'Ticket not found'}), 404
            if ticket.status == 'Resolved':
                return jsonify({'error': 'Ticket is already resolved'}), 400
            ticket.status = 'Resolved'
            ticket.updated_at = datetime.utcnow()
            session.commit()
            from app.services.ticket_analysis import start_analysis
            start_analysis(current_app._get_current_object(), ticket.id)
            return jsonify({'id': ticket.id, 'status': ticket.status, 'message': 'Ticket marked as resolved'}), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@tickets_bp.route('/tickets/<int:ticket_id>/rate', methods=['PUT'])
@jwt_required()
def customer_rate_ticket(ticket_id):
    try:
        user_id = int(get_jwt_identity())
        if get_jwt().get('role') != 'Customer':
            return jsonify({'error': 'Customer role required'}), 403
        session = current_app.SessionLocal()
        try:
            from app.models import Ticket
            ticket = session.query(Ticket).filter_by(id=ticket_id).first()
            if not ticket or ticket.customer_id != user_id:
                return jsonify({'error': 'Ticket not found'}), 404
            if ticket.status != 'Resolved':
                return jsonify({'error': 'Only resolved tickets can be rated'}), 400
            stars = (request.get_json() or {}).get('customer_rating')
            if not isinstance(stars, int) or not 1 <= stars <= 5:
                return jsonify({'error': 'Rating must be 1 to 5'}), 400
            ticket.customer_rating = stars
            ticket.updated_at = datetime.utcnow()
            session.commit()
            from app.services.ticket_analysis import refresh_quality
            refresh_quality(current_app.SessionLocal(), ticket.id, stars)
            return jsonify({'id': ticket.id, 'customer_rating': stars, 'message': 'Thank you for rating'}), 200
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
            from app.models import TicketMessage, Ticket
            
            _t = session.query(Ticket).filter_by(id=ticket_id).first()
            if not _t or not _ticket_visible(_t):
                return jsonify({'error': 'Ticket not found'}), 404
            messages = session.query(TicketMessage).filter_by(ticket_id=ticket_id).all()
            
            result = []
            for m in messages:
                result.append({
                    'id': m.id,
                    'sender_type': m.sender_type,
                    'sender_id': m.sender_id,
                    'message': m.message,
                    'sent_at': m.sent_at.isoformat() if m.sent_at else None,
                    'sender_name': _sender_name(session, m)
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
            if not _ticket_visible(ticket):
                return jsonify({'error': 'Ticket not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            # Determine sender type
            customer = session.query(Customer).filter_by(id=user_id).first()
            employee = session.query(Employee).filter_by(id=user_id).first()
            
            sender_type = get_jwt().get('role') or 'Unknown'
            
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
            
            if get_jwt().get('role') != 'Admin':
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