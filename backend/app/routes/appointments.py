from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
from sqlalchemy import text

appointments_bp = Blueprint('appointments', __name__)

def _appt_visible(a):
    role, uid = get_jwt().get('role'), int(get_jwt_identity())
    if role == 'Admin':
        return True
    if role == 'Customer':
        return a.customer_id == uid
    if role == 'Employee':
        return a.employee_id == uid or (a.employee_id is None and a.status == 'Pending')
    return False


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
            
            from flask_jwt_extended import get_jwt
            _role = get_jwt().get('role')
            if _role == 'Admin':
                appointments = session.query(Appointment).all()
            elif _role == 'Employee':
                appointments = session.query(Appointment).filter(Appointment.employee_id == user_id).all()
            elif _role == 'Customer':
                appointments = session.query(Appointment).filter(Appointment.customer_id == user_id).all()
            else:
                appointments = []
            
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
            from flask_jwt_extended import get_jwt
            if get_jwt().get('role') != 'Customer':
                return jsonify({'error': 'Customer role required'}), 403
            from app.models import Appointment, Customer
            
            customer = session.query(Customer).filter_by(id=user_id).first()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            try:
                slot_dt = datetime.fromisoformat(data.get('appointment_date', ''))
            except (ValueError, TypeError):
                return jsonify({'error': 'Pick a valid time slot'}), 400
            _avail_tables(session)
            if slot_dt not in _slots_for_day(session, slot_dt.date()):
                return jsonify({'error': 'This slot is not available. Please choose another'}), 409

            appointment = Appointment(
                customer_id=customer.id,
                appointment_date=slot_dt,
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
            if not _appt_visible(appointment):
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
            if not _appt_visible(appointment):
                return jsonify({'error': 'Appointment not found'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body required'}), 400
            
            if 'status' in data:
                appointment.status = data['status']
            if 'employee_id' in data and get_jwt().get('role') == 'Admin':
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
            if not _appt_visible(appointment):
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


# ---------- Availability, requests and accept (part 1) ----------

def _as_time(v):
    if isinstance(v, timedelta):
        return (datetime.min + v).time()
    if isinstance(v, str):
        return datetime.strptime(v[:5], '%H:%M').time()
    return v


def _serialize(a):
    return {
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
        'created_at': a.created_at.isoformat() if a.created_at else None,
    }


def _avail_tables(session):
    session.execute(text("""
        CREATE TABLE IF NOT EXISTS employee_availability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            weekday TINYINT NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            slot_minutes INT NOT NULL DEFAULT 30,
            UNIQUE KEY uq_emp_weekday (employee_id, weekday),
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    """))
    session.execute(text("""
        CREATE TABLE IF NOT EXISTS employee_blocked_dates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            blocked_date DATE NOT NULL,
            UNIQUE KEY uq_emp_blocked (employee_id, blocked_date),
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    """))
    session.commit()


def _slots_for_day(session, day):
    from app.models import Appointment
    rows = session.execute(text(
        "SELECT a.start_time, a.end_time, a.slot_minutes "
        "FROM employee_availability a JOIN employees e ON e.id = a.employee_id "
        "WHERE a.weekday = :wd AND e.status = 'Active' "
        "AND a.employee_id NOT IN "
        "(SELECT b.employee_id FROM employee_blocked_dates b WHERE b.blocked_date = :d)"
    ), {'wd': day.weekday(), 'd': day.isoformat()}).fetchall()

    capacity = {}
    for start, end, mins in rows:
        t = datetime.combine(day, _as_time(start))
        stop = datetime.combine(day, _as_time(end))
        step = timedelta(minutes=int(mins))
        while t + step <= stop:
            capacity[t] = capacity.get(t, 0) + 1
            t += step
    if not capacity:
        return []

    booked = {}
    taken = session.query(Appointment.appointment_date).filter(
        Appointment.appointment_date >= min(capacity),
        Appointment.appointment_date <= max(capacity),
        Appointment.status.in_(['Pending', 'Confirmed']),
    ).all()
    for (when,) in taken:
        booked[when] = booked.get(when, 0) + 1

    now = datetime.now()
    return sorted(t for t, cap in capacity.items() if t > now and booked.get(t, 0) < cap)


@appointments_bp.route('/availability/slots', methods=['GET'])
@jwt_required()
def get_open_slots():
    try:
        day = datetime.strptime(request.args.get('date', ''), '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'date must be YYYY-MM-DD'}), 400
    try:
        session = current_app.SessionLocal()
        try:
            _avail_tables(session)
            slots = _slots_for_day(session, day)
            return jsonify({'date': day.isoformat(), 'slots': [s.strftime('%Y-%m-%dT%H:%M') for s in slots]}), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@appointments_bp.route('/availability/open-days', methods=['GET'])
@jwt_required()
def get_open_days():
    try:
        n = min(max(int(request.args.get('days', 30)), 1), 60)
        session = current_app.SessionLocal()
        try:
            _avail_tables(session)
            start = datetime.now().date()
            open_days = []
            for i in range(n):
                d = start + timedelta(days=i)
                if _slots_for_day(session, d):
                    open_days.append(d.isoformat())
            return jsonify({'days': open_days}), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@appointments_bp.route('/availability/me', methods=['GET'])
@jwt_required()
def get_my_availability():
    try:
        if get_jwt().get('role') != 'Employee':
            return jsonify({'error': 'Employee role required'}), 403
        emp_id = int(get_jwt_identity())
        session = current_app.SessionLocal()
        try:
            _avail_tables(session)
            weekly = session.execute(text(
                "SELECT weekday, start_time, end_time, slot_minutes FROM employee_availability "
                "WHERE employee_id = :e ORDER BY weekday"), {'e': emp_id}).fetchall()
            blocked = session.execute(text(
                "SELECT blocked_date FROM employee_blocked_dates WHERE employee_id = :e "
                "ORDER BY blocked_date"), {'e': emp_id}).fetchall()
            return jsonify({
                'weekly': [{'weekday': w, 'start': _as_time(s).strftime('%H:%M'),
                            'end': _as_time(en).strftime('%H:%M'), 'slot_minutes': m}
                           for w, s, en, m in weekly],
                'blocked_dates': [b.isoformat() for (b,) in blocked],
            }), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@appointments_bp.route('/availability/me', methods=['PUT'])
@jwt_required()
def save_my_availability():
    try:
        if get_jwt().get('role') != 'Employee':
            return jsonify({'error': 'Employee role required'}), 403
        emp_id = int(get_jwt_identity())
        data = request.get_json(silent=True) or {}
        weekly = data.get('weekly', [])
        blocked = data.get('blocked_dates', [])
        session = current_app.SessionLocal()
        try:
            _avail_tables(session)
            session.execute(text("DELETE FROM employee_availability WHERE employee_id = :e"), {'e': emp_id})
            session.execute(text("DELETE FROM employee_blocked_dates WHERE employee_id = :e"), {'e': emp_id})
            for w in weekly:
                day_no = int(w['weekday'])
                start = _as_time(w['start'])
                end = _as_time(w['end'])
                if not (0 <= day_no <= 6) or end <= start:
                    session.rollback()
                    return jsonify({'error': 'Invalid working hours'}), 400
                session.execute(text(
                    "INSERT INTO employee_availability (employee_id, weekday, start_time, end_time, slot_minutes) "
                    "VALUES (:e, :w, :s, :en, :m)"),
                    {'e': emp_id, 'w': day_no, 's': start.strftime('%H:%M:%S'),
                     'en': end.strftime('%H:%M:%S'), 'm': int(w.get('slot_minutes', 30))})
            for d in blocked:
                session.execute(text(
                    "INSERT IGNORE INTO employee_blocked_dates (employee_id, blocked_date) VALUES (:e, :d)"),
                    {'e': emp_id, 'd': datetime.strptime(d, '%Y-%m-%d').date().isoformat()})
            session.commit()
            return jsonify({'message': 'Availability saved'}), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@appointments_bp.route('/appointments/requests', methods=['GET'])
@jwt_required()
def list_requests():
    try:
        if get_jwt().get('role') not in ('Employee', 'Admin'):
            return jsonify({'error': 'Staff role required'}), 403
        session = current_app.SessionLocal()
        try:
            from app.models import Appointment
            rows = session.query(Appointment).filter(
                Appointment.status == 'Pending',
                Appointment.employee_id.is_(None),
            ).order_by(Appointment.appointment_date).all()
            return jsonify([_serialize(a) for a in rows]), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@appointments_bp.route('/appointments/<int:appointment_id>/accept', methods=['PATCH'])
@jwt_required()
def accept_appointment(appointment_id):
    try:
        role = get_jwt().get('role')
        if role not in ('Employee', 'Admin'):
            return jsonify({'error': 'Staff role required'}), 403
        data = request.get_json(silent=True) or {}
        if role == 'Employee':
            emp_id = int(get_jwt_identity())
        else:
            if data.get('employee_id') is None:
                return jsonify({'error': 'employee_id is required'}), 400
            emp_id = int(data['employee_id'])
        session = current_app.SessionLocal()
        try:
            from app.models import Appointment, Employee
            a = session.query(Appointment).filter_by(id=appointment_id).first()
            if not a:
                return jsonify({'error': 'Appointment not found'}), 404
            if a.appointment_date < datetime.now():
                return jsonify({'error': 'This appointment time has already passed'}), 409
            if a.status != 'Pending' or a.employee_id is not None:
                return jsonify({'error': 'This request is no longer open'}), 409
            emp = session.query(Employee).filter_by(id=emp_id).first()
            if not emp or emp.status != 'Active':
                return jsonify({'error': 'Employee is not active'}), 400
            clash = session.query(Appointment).filter(
                Appointment.employee_id == emp_id,
                Appointment.appointment_date == a.appointment_date,
                Appointment.status.in_(['Pending', 'Confirmed']),
            ).first()
            if clash:
                return jsonify({'error': 'Employee already has an appointment at this time'}), 409
            a.employee_id = emp_id
            a.status = 'Confirmed'
            a.updated_at = datetime.utcnow()
            session.commit()
            return jsonify({'id': a.id, 'status': a.status, 'employee_id': emp_id,
                            'message': 'Request accepted'}), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


# ---------- Admin create (part 4) ----------

@appointments_bp.route('/appointments/admin-create', methods=['POST'])
@jwt_required()
def admin_create_appointment():
    try:
        if get_jwt().get('role') != 'Admin':
            return jsonify({'error': 'Admin role required'}), 403
        data = request.get_json(silent=True) or {}
        try:
            when = datetime.fromisoformat(data.get('appointment_date', ''))
        except (ValueError, TypeError):
            return jsonify({'error': 'Pick a valid date and time'}), 400
        if data.get('customer_id') in (None, ''):
            return jsonify({'error': 'customer_id is required'}), 400
        emp_raw = data.get('employee_id')
        session = current_app.SessionLocal()
        try:
            from app.models import Appointment, Customer, Employee
            customer = session.query(Customer).filter_by(id=int(data['customer_id'])).first()
            if not customer:
                return jsonify({'error': 'Customer not found'}), 404
            status = 'Pending'
            emp_id = None
            if emp_raw not in (None, ''):
                emp_id = int(emp_raw)
                emp = session.query(Employee).filter_by(id=emp_id).first()
                if not emp or emp.status != 'Active':
                    return jsonify({'error': 'Employee is not active'}), 400
                clash = session.query(Appointment).filter(
                    Appointment.employee_id == emp_id,
                    Appointment.appointment_date == when,
                    Appointment.status.in_(['Pending', 'Confirmed']),
                ).first()
                if clash:
                    return jsonify({'error': 'Employee already has an appointment at this time'}), 409
                status = 'Confirmed'
            appt = Appointment(
                customer_id=customer.id,
                employee_id=emp_id,
                appointment_date=when,
                service_type=data.get('service_type', 'General'),
                description=data.get('description', ''),
                status=status,
            )
            session.add(appt)
            session.commit()
            return jsonify({'id': appt.id, 'status': appt.status, 'message': 'Appointment created'}), 201
        finally:
            session.close()
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500
