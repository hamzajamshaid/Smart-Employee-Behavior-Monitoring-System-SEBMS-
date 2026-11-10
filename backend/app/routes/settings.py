import json
from datetime import datetime
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import text
from app.services.scoring_weights import DEFAULT_UI_WEIGHTS, ensure_settings_table, load_settings
from app.services.video_retention import delete_videos

settings_bp = Blueprint('settings_api', __name__)

ALERT_LEVELS = ('low', 'medium', 'high')

DEFAULTS = {
    'companyName': 'Honda Breeze',
    'timezone': 'UTC+5',
    'scoringWeights': dict(DEFAULT_UI_WEIGHTS),
    'detectionThresholds': {'presenceTarget': 90, 'responseTimeLimit': 15,
                            'emotionPositiveRatio': 70, 'feedbackMinimum': 3.5},
    'alertSensitivity': 'medium',
    'retentionDays': 0,
    'batchProcessingInterval': 24,
}


def _merge(saved):
    out = json.loads(json.dumps(DEFAULTS))
    out.update(saved)
    out['scoringWeights'] = {**DEFAULTS['scoringWeights'], **(saved.get('scoringWeights') or {})}
    return out


@settings_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    session = current_app.SessionLocal()
    try:
        return jsonify(_merge(load_settings(session))), 200
    finally:
        session.close()


@settings_bp.route('/settings', methods=['PUT'])
@jwt_required()
def put_settings():
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin only'}), 403
    data = request.get_json(silent=True) or {}
    raw = data.get('scoringWeights') or {}
    try:
        vals = {k: float(raw.get(k, DEFAULT_UI_WEIGHTS[k])) for k in DEFAULT_UI_WEIGHTS}
    except (TypeError, ValueError):
        return jsonify({'error': 'Weights must be numbers'}), 400
    if any(v < 0 or v > 100 for v in vals.values()):
        return jsonify({'error': 'Each weight must be between 0 and 100'}), 400
    total = sum(vals.values())
    if abs(total - 100) > 0.01:
        return jsonify({'error': f'Weights must total 100 (currently {total:g})'}), 400

    sensitivity = data.get('alertSensitivity', DEFAULTS['alertSensitivity'])
    if sensitivity not in ALERT_LEVELS:
        return jsonify({'error': 'alertSensitivity must be low, medium or high'}), 400
    try:
        retention = int(data.get('retentionDays', DEFAULTS['retentionDays']))
    except (TypeError, ValueError):
        return jsonify({'error': 'retentionDays must be a whole number'}), 400
    if retention < 0 or retention > 3650:
        return jsonify({'error': 'retentionDays must be between 0 and 3650'}), 400

    data['scoringWeights'] = vals
    data['alertSensitivity'] = sensitivity
    data['retentionDays'] = retention
    session = current_app.SessionLocal()
    try:
        ensure_settings_table(session)
        session.execute(text(
            "INSERT INTO app_settings (setting_key, value_json) VALUES ('app', :v) "
            "ON DUPLICATE KEY UPDATE value_json = :v"
        ), {'v': json.dumps(data)})
        session.commit()
        return jsonify(_merge(data)), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@settings_bp.route('/settings/delete-videos', methods=['POST'])
@jwt_required()
def delete_videos_on_date():
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin only'}), 403
    raw = (request.get_json(silent=True) or {}).get('date', '')
    try:
        day = datetime.strptime(raw, '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return jsonify({'error': 'date must be YYYY-MM-DD'}), 400
    session = current_app.SessionLocal()
    try:
        result = delete_videos(session, on_date=day)
        return jsonify({'date': raw, **result}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()
