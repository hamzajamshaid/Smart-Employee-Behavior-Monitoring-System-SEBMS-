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


def build_breakdown(signals, weights):
    """Per-component score, percentage weight and points for the signals actually used."""
    total = sum(weights[k] for k in signals)
    if total <= 0:
        return {}
    return {
        k: {
            'score': round(v, 2),
            'weight_pct': round(weights[k] / total * 100, 2),
            'points': round(weights[k] * v / total, 2),
        }
        for k, v in signals.items()
    }
