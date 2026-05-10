from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

def get_date_range():
    try:
        period = request.args.get('period', 'month')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        now = datetime.utcnow()
        
        if period == 'today':
            return now.replace(hour=0, minute=0, second=0), now
        elif period == 'week':
            return now - timedelta(days=7), now
        elif period == 'month':
            return now - timedelta(days=30), now
        elif date_from and date_to:
            try:
                return datetime.fromisoformat(date_from), datetime.fromisoformat(date_to)
            except ValueError:
                return now - timedelta(days=30), now
        
        return now - timedelta(days=30), now
    except Exception:
        now = datetime.utcnow()
        return now - timedelta(days=30), now

@dashboard_bp.route('/dashboard/summary', methods=['GET'])
@jwt_required()
def get_summary():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import BehavioralScore, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Unauthorized'}), 403
            
            date_from, date_to = get_date_range()
            
            scores = session.query(BehavioralScore).filter(
                BehavioralScore.date >= date_from,
                BehavioralScore.date <= date_to
            ).all()
            
            avg_score = sum([s.unified_score for s in scores]) / len(scores) if scores else 0
            avg_presence = sum([s.presence_score for s in scores]) / len(scores) if scores else 0
            avg_response = sum([s.response_score for s in scores]) / len(scores) if scores else 0
            avg_feedback = sum([s.feedback_score for s in scores]) / len(scores) if scores else 0
            avg_voice = sum([s.voice_score for s in scores]) / len(scores) if scores else 0
            
            return jsonify({
                'unified_score': round(float(avg_score), 1),
                'presence_rate': round(float(avg_presence), 1),
                'avg_response': round(float(avg_response), 1),
                'feedback': round(float(avg_feedback), 1),
                'avg_voice': round(float(avg_voice), 1),
                'active_alerts': 0
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/trend', methods=['GET'])
@jwt_required()
def get_trend():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import BehavioralScore, Employee, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Unauthorized'}), 403
            
            date_from, date_to = get_date_range()
            
            employees = session.query(Employee).filter_by(status='Active').all()
            result = {}
            
            for emp in employees:
                scores = session.query(BehavioralScore).filter(
                    BehavioralScore.employee_id == emp.id,
                    BehavioralScore.date >= date_from,
                    BehavioralScore.date <= date_to
                ).order_by(BehavioralScore.date.asc()).all()
                
                result[emp.name] = [
                    {
                        'date': s.date.strftime('%Y-%m-%d') if s.date else None,
                        'score': round(s.unified_score, 1)
                    }
                    for s in scores
                ]
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@dashboard_bp.route('/dashboard/interactions', methods=['GET'])
@jwt_required()
def get_interactions_filtered():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Interaction, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Unauthorized'}), 403
            
            date_from, date_to = get_date_range()
            
            interactions = session.query(Interaction).filter(
                Interaction.start_timestamp >= date_from,
                Interaction.start_timestamp <= date_to
            ).order_by(Interaction.start_timestamp.desc()).limit(50).all()
            
            result = []
            for i in interactions:
                result.append({
                    'id': i.id,
                    'employee_id': i.employee_id,
                    'employee_name': i.employee.name if i.employee else 'Unknown',
                    'time': i.start_timestamp.strftime('%H:%M') if i.start_timestamp else None,
                    'present': i.presence_record.is_present if i.presence_record else None,
                    'emotion': round(i.emotion_record.emotion_score, 1) if i.emotion_record else None,
                    'response': round(i.response_time_record.response_seconds, 1) if i.response_time_record else None,
                    'feedback': i.customer_feedback.star_rating if i.customer_feedback else None,
                    'voice': round(i.voice_record.voice_score, 1) if i.voice_record else None
                })
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@dashboard_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Alert, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can view alerts'}), 403
            
            alerts = session.query(Alert).order_by(Alert.triggered_at.desc()).limit(50).all()
            
            result = []
            for a in alerts:
                result.append({
                    'id': a.id,
                    'employee_id': a.employee_id,
                    'employee_name': a.employee.name if a.employee else 'Unknown',
                    'alert_type': a.alert_type,
                    'message': a.message,
                    'triggered_at': a.triggered_at.isoformat() if a.triggered_at else None,
                    'is_resolved': a.is_resolved
                })
            
            return jsonify(result), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@dashboard_bp.route('/alerts/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    try:
        identity = get_jwt_identity()
        user_id = int(identity)
        
        session = current_app.SessionLocal()
        
        try:
            from app.models import Alert, User
            
            user = session.query(User).filter_by(id=user_id).first()
            if not user or user.role != 'Admin':
                return jsonify({'error': 'Only admins can resolve alerts'}), 403
            
            alert = session.query(Alert).filter_by(id=alert_id).first()
            
            if not alert:
                return jsonify({'error': 'Alert not found'}), 404
            
            alert.is_resolved = True
            alert.resolved_at = datetime.utcnow()
            session.commit()
            
            return jsonify({
                'id': alert.id,
                'is_resolved': alert.is_resolved,
                'message': 'Alert resolved'
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500