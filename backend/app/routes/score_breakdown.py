import json
from flask import Blueprint, current_app, jsonify
from flask_jwt_extended import jwt_required
from app.models import BehavioralScore
from app.services.scoring_weights import scoring_weights_fraction

score_breakdown_bp = Blueprint('score_breakdown_api', __name__)

COMPONENTS = [('presence', 'Presence'), ('emotion', 'Face emotion'), ('response', 'Response time'),
              ('feedback', 'Customer feedback'), ('voice', 'Voice emotion')]


@score_breakdown_bp.route('/scores/<int:interaction_id>/breakdown', methods=['GET'])
@jwt_required()
def get_breakdown(interaction_id):
    session = current_app.SessionLocal()
    try:
        row = session.query(BehavioralScore).filter(BehavioralScore.interaction_id == interaction_id).first()
        if row is None:
            return jsonify({'error': 'No score for this session'}), 404
        stored = json.loads(row.score_breakdown) if row.score_breakdown else {}
        components = []
        for key, label in COMPONENTS:
            item = stored.get(key)
            components.append({
                'key': key,
                'label': label,
                'score': item['score'] if item else None,
                'weight_pct': item['weight_pct'] if item else None,
                'points': item['points'] if item else None,
                'status': 'used' if item else 'not_measured',
            })
        configured = {k: round(v * 100, 2) for k, v in scoring_weights_fraction(session).items()}
        return jsonify({
            'interaction_id': interaction_id,
            'unified_score': row.unified_score,
            'score_status': row.score_status,
            'components': components,
            'configured_weights_pct': configured,
        }), 200
    finally:
        session.close()
