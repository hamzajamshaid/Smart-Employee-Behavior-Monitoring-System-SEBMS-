from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

# ============================================================================
# USER MODELS
# ============================================================================

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # Admin, Employee, Customer
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = 'employees'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    counter_id = Column(Integer, nullable=False)
    employee_code = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(String(50), default='Active')  # Active, Inactive, On Leave
    hire_date = Column(DateTime, default=datetime.utcnow)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    interactions = relationship('Interaction', back_populates='employee')
    behavioral_scores = relationship('BehavioralScore', back_populates='employee')
    appointments = relationship('Appointment', back_populates='employee')
    tickets = relationship('Ticket', back_populates='employee')
    alerts = relationship('Alert', back_populates='employee')

class Customer(Base):
    __tablename__ = 'customers'
    
    id = Column(Integer, primary_key=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    appointments = relationship('Appointment', back_populates='customer')
    tickets = relationship('Ticket', back_populates='customer')

# ============================================================================
# SERVICE MODELS
# ============================================================================

class Appointment(Base):
    __tablename__ = 'appointments'
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=True)
    appointment_date = Column(DateTime, nullable=False)
    service_type = Column(String(100), nullable=False)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_plate = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default='Pending')  # Pending, Confirmed, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship('Customer', back_populates='appointments')
    employee = relationship('Employee', back_populates='appointments')

class Ticket(Base):
    __tablename__ = 'tickets'
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    ticket_type = Column(String(100), nullable=False)  # General, Technical, Billing, Other
    priority = Column(String(50), default='Medium')  # Low, Medium, High, Urgent
    status = Column(String(50), default='Open')  # Open, In Progress, Resolved
    resolution_note = Column(Text, nullable=True)
    customer_rating = Column(Integer, nullable=True)  # 1-5 stars
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    customer = relationship('Customer', back_populates='tickets')
    employee = relationship('Employee', back_populates='tickets')
    messages = relationship('TicketMessage', back_populates='ticket', cascade='all, delete-orphan')

class TicketMessage(Base):
    __tablename__ = 'ticket_messages'
    
    id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey('tickets.id'), nullable=False)
    sender_type = Column(String(50), nullable=False)  # Customer, Employee
    sender_id = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ticket = relationship('Ticket', back_populates='messages')

# ============================================================================
# PERFORMANCE & TRACKING MODELS
# ============================================================================

class Interaction(Base):
    __tablename__ = 'interactions'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    start_timestamp = Column(DateTime, nullable=False)
    end_timestamp = Column(DateTime, nullable=True)
    video_file_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    employee = relationship('Employee', back_populates='interactions')
    presence_record = relationship('PresenceRecord', uselist=False, back_populates='interaction')
    emotion_record = relationship('EmotionRecord', uselist=False, back_populates='interaction')
    response_time_record = relationship('ResponseTimeRecord', uselist=False, back_populates='interaction')
    customer_feedback = relationship('CustomerFeedback', uselist=False, back_populates='interaction')
    voice_record = relationship('VoiceRecord', uselist=False, back_populates='interaction')

class BehavioralScore(Base):
    __tablename__ = 'behavioral_scores'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    date = Column(DateTime, nullable=False)
    presence_score = Column(Float, default=0)
    emotion_score = Column(Float, default=0)
    response_score = Column(Float, default=0)
    feedback_score = Column(Float, default=0)
    voice_score = Column(Float, default=0)
    unified_score = Column(Float, default=0)  # Weighted average
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    employee = relationship('Employee', back_populates='behavioral_scores')

class PresenceRecord(Base):
    __tablename__ = 'presence_records'
    
    id = Column(Integer, primary_key=True)
    interaction_id = Column(Integer, ForeignKey('interactions.id'), nullable=False)
    is_present = Column(Boolean, default=True)
    presence_score = Column(Float, default=0)
    
    # Relationships
    interaction = relationship('Interaction', back_populates='presence_record')

class EmotionRecord(Base):
    __tablename__ = 'emotion_records'
    
    id = Column(Integer, primary_key=True)
    interaction_id = Column(Integer, ForeignKey('interactions.id'), nullable=False)
    emotion_score = Column(Float, default=0)  # 0-100
    dominant_emotion = Column(String(50), nullable=True)  # Happy, Sad, Angry, Neutral, etc
    
    # Relationships
    interaction = relationship('Interaction', back_populates='emotion_record')

class ResponseTimeRecord(Base):
    __tablename__ = 'response_time_records'
    
    id = Column(Integer, primary_key=True)
    interaction_id = Column(Integer, ForeignKey('interactions.id'), nullable=False)
    response_seconds = Column(Float, default=0)
    
    # Relationships
    interaction = relationship('Interaction', back_populates='response_time_record')

class CustomerFeedback(Base):
    __tablename__ = 'customer_feedback'
    
    id = Column(Integer, primary_key=True)
    interaction_id = Column(Integer, ForeignKey('interactions.id'), nullable=False)
    star_rating = Column(Integer, default=3)  # 1-5
    comments = Column(Text, nullable=True)
    
    # Relationships
    interaction = relationship('Interaction', back_populates='customer_feedback')

class VoiceRecord(Base):
    __tablename__ = 'voice_records'
    
    id = Column(Integer, primary_key=True)
    interaction_id = Column(Integer, ForeignKey('interactions.id'), nullable=False)
    voice_score = Column(Float, default=0)  # 0-100 (tone analysis)
    voice_file_path = Column(String(255), nullable=True)
    
    # Relationships
    interaction = relationship('Interaction', back_populates='voice_record')

# ============================================================================
# ADMIN MODELS
# ============================================================================

class Attendance(Base):
    __tablename__ = 'attendance'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    check_in_time = Column(DateTime, nullable=False)
    check_out_time = Column(DateTime, nullable=True)
    status = Column(String(50), default='Present')  # Present, Absent, On Leave
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = 'alerts'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    alert_type = Column(String(100), nullable=False)  # Low Score, Absence, High Response Time, Negative Feedback
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    employee = relationship('Employee', back_populates='alerts')

class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)