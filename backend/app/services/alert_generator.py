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
    Rule 1: unified score below the sensitivity threshold -> 'Low Score' alert.
    Rule 2: each Detection Threshold breached in a session -> its own alert
            (Low Presence, Slow Response, Low Expression, Low Rating), once per session."""

    def __init__(self, session: Session):
        self.session = session
        self.alerts_created = 0

    def check_and_create_alerts(self, employee_id: int, unified_score: float,
                                threshold: float = ALERT_SENSITIVITY_THRESHOLDS['medium'],
                                interaction_id=None) -> dict:
        try:
            if unified_score < threshold:
                alert = Alert(
                    employee_id=employee_id,
                    alert_type='Low Score',
                    message=f'Low behavioral score: {unified_score:.2f} (< {threshold:g} threshold)',
                    triggered_at=datetime.utcnow(),
                    session_id=interaction_id
                )
                self.session.add(alert)
                self.alerts_created += 1
                logger.info(f"🔴 Alert created: Low Score for employee {employee_id} (score={unified_score:.2f})")

            self.session.commit()
            return {'alerts_created': self.alerts_created}

        except Exception as e:
            logger.error(f"Alert generation error: {str(e)}")
            return {'alerts_created': 0, 'error': str(e)}

    def check_threshold_alerts(self, employee_id, session_at, presence, emotion,
                               response_seconds, star_rating, thresholds, interaction_id=None) -> dict:
        checks = []
        if presence is not None and presence < thresholds['presenceTarget']:
            checks.append(('Low Presence',
                           f"Presence {presence:.1f} below target {thresholds['presenceTarget']:g}"))
        if response_seconds is not None and response_seconds > thresholds['responseTimeLimit']:
            checks.append(('Slow Response',
                           f"Response {response_seconds:.1f}s above limit {thresholds['responseTimeLimit']:g}s"))
        if emotion is not None and emotion < thresholds['emotionPositiveRatio']:
            checks.append(('Low Expression',
                           f"Expression {emotion:.1f} below ratio {thresholds['emotionPositiveRatio']:g}"))
        if star_rating is not None and star_rating < thresholds['feedbackMinimum']:
            checks.append(('Low Rating',
                           f"Rating {star_rating:g} stars below minimum {thresholds['feedbackMinimum']:g}"))
        created = 0
        try:
            for alert_type, message in checks:
                exists = self.session.query(Alert).filter(
                    Alert.employee_id == employee_id,
                    Alert.alert_type == alert_type,
                    Alert.triggered_at == session_at).first()
                if exists is None:
                    self.session.add(Alert(employee_id=employee_id, alert_type=alert_type,
                                           message=message, triggered_at=session_at,
                                           session_id=interaction_id))
                    created += 1
                    logger.info(f"🔴 Alert created: {alert_type} for employee {employee_id}")
            if created:
                self.session.commit()
            self.alerts_created += created
            return {'alerts_created': created}
        except Exception as e:
            self.session.rollback()
            logger.error(f"Threshold alert error: {str(e)}")
            return {'alerts_created': 0, 'error': str(e)}
