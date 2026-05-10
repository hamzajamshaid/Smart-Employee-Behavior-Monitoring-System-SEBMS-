from app.models import (
    User, Employee, Customer, Appointment, Ticket, TicketMessage,
    Interaction, BehavioralScore, PresenceRecord, EmotionRecord,
    ResponseTimeRecord, CustomerFeedback, VoiceRecord, Attendance, Alert
)
from datetime import datetime, timedelta
import hashlib
import random

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database(session):
    """Seed database with initial data"""
    
    print("🌱 Seeding database...")
    
    # ============================================================================
    # CREATE ADMIN USER
    # ============================================================================
    
    admin = User(
        username='admin',
        password_hash=hash_password('admin123'),
        role='Admin',
        last_login=datetime.utcnow()
    )
    session.add(admin)
    session.flush()
    
    print("✅ Admin user created")
    
    # ============================================================================
    # CREATE EMPLOYEES
    # ============================================================================
    
    employees_data = [
        {'name': 'Ahmed Raza', 'code': 'EMP001', 'counter': 1, 'email': 'ahmed@company.com', 'phone': '03001234567'},
        {'name': 'Sara Khan', 'code': 'EMP002', 'counter': 2, 'email': 'sara@company.com', 'phone': '03007654321'},
        {'name': 'Bilal Ahmed', 'code': 'EMP003', 'counter': 3, 'email': 'bilal@company.com', 'phone': '03009876543'}
    ]
    
    employees = []
    for emp_data in employees_data:
        emp = Employee(
            name=emp_data['name'],
            counter_id=emp_data['counter'],
            employee_code=emp_data['code'],
            password_hash=hash_password('password'),
            status='Active',
            email=emp_data['email'],
            phone=emp_data['phone'],
            hire_date=datetime.utcnow() - timedelta(days=365)
        )
        session.add(emp)
        employees.append(emp)
    
    session.flush()
    print(f"✅ {len(employees)} employees created")
    
    # ============================================================================
    # CREATE CUSTOMERS
    # ============================================================================
    
    customers_data = [
        {'name': 'Muhammad Ali', 'phone': '03001234567', 'email': 'ali@email.com'},
        {'name': 'Fatima Khan', 'phone': '03102234567', 'email': 'fatima@email.com'},
        {'name': 'Hassan Ahmed', 'phone': '03203234567', 'email': 'hassan@email.com'}
    ]
    
    customers = []
    for cust_data in customers_data:
        cust = Customer(
            full_name=cust_data['name'],
            phone=cust_data['phone'],
            email=cust_data['email'],
            password_hash=hash_password('password'),
            is_active=True
        )
        session.add(cust)
        customers.append(cust)
    
    session.flush()
    print(f"✅ {len(customers)} customers created")
    
    # ============================================================================
    # CREATE INTERACTIONS & SCORES (365 days of data)
    # ============================================================================
    
    interactions = []
    for emp in employees:
        for day in range(365):
            date = datetime.utcnow() - timedelta(days=365-day)
            
            # Create interaction
            interaction = Interaction(
                employee_id=emp.id,
                start_timestamp=date.replace(hour=9, minute=0),
                end_timestamp=date.replace(hour=17, minute=0)
            )
            session.add(interaction)
            interactions.append(interaction)
    
    session.flush()
    print(f"✅ {len(interactions)} interactions created")
    
    # ============================================================================
    # CREATE BEHAVIORAL SCORES
    # ============================================================================
    
    scores = []
    for emp in employees:
        for day in range(365):
            date = datetime.utcnow() - timedelta(days=365-day)
            
            # Random but realistic scores
            presence = random.uniform(85, 100)
            emotion = random.uniform(65, 95)
            response = random.uniform(60, 90)
            feedback = random.uniform(70, 100)
            voice = random.uniform(70, 95)
            
            unified = (presence * 0.2 + emotion * 0.25 + response * 0.2 + feedback * 0.2 + voice * 0.15)
            
            score = BehavioralScore(
                employee_id=emp.id,
                date=date,
                presence_score=presence,
                emotion_score=emotion,
                response_score=response,
                feedback_score=feedback,
                voice_score=voice,
                unified_score=unified
            )
            session.add(score)
            scores.append(score)
    
    session.flush()
    print(f"✅ {len(scores)} behavioral scores created")
    
    # ============================================================================
    # CREATE APPOINTMENTS
    # ============================================================================
    
    appointments = []
    for i, cust in enumerate(customers):
        for j in range(10):
            apt = Appointment(
                customer_id=cust.id,
                employee_id=employees[j % len(employees)].id,
                appointment_date=datetime.utcnow() + timedelta(days=random.randint(1, 30)),
                service_type=random.choice(['General', 'Technical', 'Maintenance']),
                vehicle_model='Honda Breeze',
                vehicle_plate=f'ABC-{1000+i*10+j}',
                description=f'Service appointment #{j+1}',
                status=random.choice(['Pending', 'Confirmed', 'Completed'])
            )
            session.add(apt)
            appointments.append(apt)
    
    session.flush()
    print(f"✅ {len(appointments)} appointments created")
    
    # ============================================================================
    # CREATE TICKETS
    # ============================================================================
    
    tickets = []
    for i, cust in enumerate(customers):
        for j in range(15):
            ticket = Ticket(
                customer_id=cust.id,
                employee_id=employees[j % len(employees)].id if j % 2 == 0 else None,
                title=f'Issue #{j+1} from {cust.full_name}',
                description=f'Customer reported issue: Problem with service',
                ticket_type=random.choice(['General', 'Technical', 'Billing']),
                priority=random.choice(['Low', 'Medium', 'High', 'Urgent']),
                status=random.choice(['Open', 'In Progress', 'Resolved']),
                customer_rating=random.randint(3, 5) if j % 3 == 0 else None
            )
            session.add(ticket)
            tickets.append(ticket)
    
    session.flush()
    print(f"✅ {len(tickets)} tickets created")
    
    # ============================================================================
    # CREATE TICKET MESSAGES
    # ============================================================================
    
    messages = []
    for ticket in tickets[:10]:
        for m in range(3):
            msg = TicketMessage(
                ticket_id=ticket.id,
                sender_type=random.choice(['Customer', 'Employee']),
                sender_id=ticket.customer_id if m % 2 == 0 else (ticket.employee_id or employees[0].id),
                message=f'Message #{m+1} on ticket'
            )
            session.add(msg)
            messages.append(msg)
    
    session.flush()
    print(f"✅ {len(messages)} ticket messages created")
    
    # ============================================================================
    # CREATE ATTENDANCE RECORDS
    # ============================================================================
    
    attendance = []
    for emp in employees:
        for day in range(60):
            date = datetime.utcnow() - timedelta(days=60-day)
            
            rec = Attendance(
                employee_id=emp.id,
                check_in_time=date.replace(hour=9, minute=0),
                check_out_time=date.replace(hour=17, minute=0),
                status='Present'
            )
            session.add(rec)
            attendance.append(rec)
    
    session.flush()
    print(f"✅ {len(attendance)} attendance records created")
    
    # ============================================================================
    # CREATE ALERTS
    # ============================================================================
    
    alerts = []
    for emp in employees:
        for i in range(3):
            alert = Alert(
                employee_id=emp.id,
                alert_type=random.choice(['Low Score', 'Absence', 'High Response Time']),
                message=f'Alert for {emp.name}: Performance metric below threshold',
                is_resolved=random.choice([True, False])
            )
            session.add(alert)
            alerts.append(alert)
    
    session.flush()
    print(f"✅ {len(alerts)} alerts created")
    
    # ============================================================================
    # COMMIT ALL
    # ============================================================================
    
    session.commit()
    print("\n✅ Database seeding completed successfully!")
    print(f"   - 1 Admin user")
    print(f"   - {len(employees)} Employees")
    print(f"   - {len(customers)} Customers")
    print(f"   - {len(interactions)} Interactions")
    print(f"   - {len(scores)} Behavioral Scores")
    print(f"   - {len(appointments)} Appointments")
    print(f"   - {len(tickets)} Tickets")
    print(f"   - {len(messages)} Ticket Messages")
    print(f"   - {len(attendance)} Attendance Records")
    print(f"   - {len(alerts)} Alerts")