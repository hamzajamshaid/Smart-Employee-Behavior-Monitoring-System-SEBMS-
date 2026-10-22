from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
import logging
import os
from celery import Celery

logger = logging.getLogger(__name__)

batch_bp = Blueprint('batch', __name__)

celery = Celery('sebms', broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

@batch_bp.route('/batch/trigger', methods=['POST'])
@jwt_required()
def trigger_batch():
    from flask_jwt_extended import get_jwt
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    """Manually trigger batch processing (task only, no import)"""
    try:
        task = celery.send_task('app.pipelines.behavioral_processor.process_daily_interactions')
        
        return jsonify({
            'status': 'queued',
            'task_id': task.id,
            'message': 'Batch processing task queued'
        }), 202
    
    except Exception as e:
        logger.error(f"Batch trigger error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@batch_bp.route('/batch/status/<task_id>', methods=['GET'])
@jwt_required()
def batch_status(task_id):
    from flask_jwt_extended import get_jwt
    if get_jwt().get('role') != 'Admin':
        return jsonify({'error': 'Admin role required'}), 403
    """Check batch task status"""
    try:
        task = celery.AsyncResult(task_id)
        
        return jsonify({
            'task_id': task_id,
            'status': task.status,
            'result': task.result if task.ready() else None
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

