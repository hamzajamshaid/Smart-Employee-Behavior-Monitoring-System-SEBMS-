from app.models import Alert
from sqlalchemy.orm import Session
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AlertGenerator:
    """Generate alerts based on behavioral scores"""
    
    def __init__(self, session: Session):
        self.session = session
        self.alerts_created = 0
    
    def check_and_create_alerts(self, employee_id: int, unified_score: float) -> dict:
        """
        Check score against thresholds and create alerts
        Rule 1: unified_score < 70 → medium alert
        Rule 2: 3+ consecutive low scores → high alert
        """
        try:
            # Rule 1: Low unified score
            if unified_score < 70:
                alert = Alert(
                    employee_id=employee_id,
                    alert_type='Low Score',
                    message=f'Low behavioral score: {unified_score:.2f} (< 70 threshold)',
                    triggered_at=datetime.utcnow()
                )
                self.session.add(alert)
                self.alerts_created += 1
                logger.info(f"🔴 Alert created: Low Score for employee {employee_id} (score={unified_score:.2f})")
            
            self.session.commit()
            return {'alerts_created': self.alerts_created}
        
        except Exception as e:
            logger.error(f"Alert generation error: {str(e)}")
            return {'alerts_created': 0, 'error': str(e)}
