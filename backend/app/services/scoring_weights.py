"""Admin-configurable scoring weights, shared by the batch and the API."""
import json
from sqlalchemy import text
from app.config.constants import SCORE_WEIGHTS

# Settings page keys -> backend signal keys
UI_TO_SIGNAL = {
    'presence': 'presence',
    'faceEmotion': 'emotion',
    'responseTime': 'response',
    'customerFeedback': 'feedback',
    'voiceEmotion': 'voice',
}
DEFAULT_UI_WEIGHTS = {
    'presence': 20,
    'faceEmotion': 25,
    'responseTime': 20,
    'customerFeedback': 20,
    'voiceEmotion': 15,
}

_table_ready = False


def ensure_settings_table(session):
    global _table_ready
    if _table_ready:
        return
    session.execute(text(
        "CREATE TABLE IF NOT EXISTS app_settings ("
        " setting_key VARCHAR(50) PRIMARY KEY,"
        " value_json TEXT NOT NULL,"
        " updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
    ))
    session.commit()
    _table_ready = True


def load_settings(session):
    ensure_settings_table(session)
    row = session.execute(text("SELECT value_json FROM app_settings WHERE setting_key = 'app'")).first()
    return json.loads(row[0]) if row else {}


def scoring_weights_fraction(session):
    """Current weights as fractions per signal, normalised to sum to 1."""
    saved = load_settings(session).get('scoringWeights') or {}
    ui = {k: float(saved.get(k, DEFAULT_UI_WEIGHTS[k])) for k in DEFAULT_UI_WEIGHTS}
    total = sum(ui.values())
    if total <= 0:
        return dict(SCORE_WEIGHTS)
    return {UI_TO_SIGNAL[k]: v / total for k, v in ui.items()}


def response_score(seconds, limit=15.0):
    """Response time to 0-100. Original curve (100 up to 15 s, 70 at 60 s, 0 at 120 s),
    scaled so that 15 s corresponds to the configured limit."""
    if seconds is None:
        return None
    s = float(seconds) * 15.0 / float(limit or 15.0)
    if s <= 15:
        return 100.0
    if s <= 60:
        return 100.0 - (s - 15) * (30.0 / 45.0)
    if s <= 120:
        return 70.0 * (120.0 - s) / 60.0
    return 0.0


def build_breakdown(signals, weights):
    """Per-component score, weight and points over all configured components.
    Unmeasured components count as 0, matching the unified score."""
    total = sum(weights.values())
    if total <= 0:
        return {}
    return {
        k: {
            'score': round(signals[k], 2) if k in signals else None,
            'weight_pct': round(weights[k] / total * 100, 2),
            'points': round(weights[k] * signals.get(k, 0.0) / total, 2),
            'status': 'used' if k in signals else 'not_measured',
        }
        for k in weights
    }


DEFAULT_THRESHOLDS = {'presenceTarget': 90, 'responseTimeLimit': 15,
                       'emotionPositiveRatio': 70, 'feedbackMinimum': 3.5}


def load_thresholds(session):
    """Detection thresholds from Settings, falling back to defaults."""
    saved = load_settings(session).get('detectionThresholds') or {}
    return {k: float(saved.get(k, v)) for k, v in DEFAULT_THRESHOLDS.items()}
