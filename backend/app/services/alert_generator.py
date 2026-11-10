"""Alert generation from behavioral scores."""
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Alert

logger = logging.getLogger(__name__)

# Unified-score threshold for each Settings sensitivity level
ALERT_SENSITIVITY_THRESHOLDS = {'low': 50, 'medium': 60, 'high': 75}


class AlertGenerator:
    """Generate alerts based on behavioral scores.
    Rule 1 (implemented): unified score below the sensitivity threshold -> 'Low Score' alert.
    Rule 2 (not implemented yet): 3+ consecutive low scores."""

    def __init__(self, session: Session):
        self.session = session
        self.alerts_created = 0

    def check_and_create_alerts(self, employee_id: int, unified_score: float,
                                threshold: float = ALERT_SENSITIVITY_THRESHOLDS['medium']) -> dict:
        try:
            if unified_score < threshold:
                alert = Alert(
                    employee_id=employee_id,
                    alert_type='Low Score',
                    message=f'Low behavioral score: {unified_score:.2f} (< {threshold:g} threshold)',
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
