from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging
import os
import traceback
import sys

# CRITICAL: Disable numexpr threading BEFORE any import that uses it
os.environ['NUMEXPR_MAX_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

logger = logging.getLogger(__name__)

simulate_bp = Blueprint('simulate', __name__)

def _start_from_form():
    raw = request.form.get('recording_started_at')
    if raw:
        try:
            return datetime.fromisoformat(raw.replace('Z', '+00:00')).replace(tzinfo=None)
        except ValueError:
            pass
    return datetime.utcnow()

@simulate_bp.route('/simulate/capture', methods=['POST'])
@jwt_required()
def simulate_capture():
    """
    Receive video file from frontend, create interaction, save files
    """
    print("🔵 [SIMULATE] POST /api/simulate/capture received", flush=True)
    
    try:
        print("🔵 [SIMULATE] Importing Interaction, Employee", flush=True)
        sys.stdout.flush()
        from app.models import Interaction, Employee
        print("🔵 [SIMULATE] ✅ Models imported", flush=True)
        sys.stdout.flush()
        
        print("🔵 [SIMULATE] Importing file_manager", flush=True)
        sys.stdout.flush()
        from app.services.file_manager import get_file_manager
        print("🔵 [SIMULATE] ✅ file_manager imported", flush=True)
        sys.stdout.flush()
        
        print("🔵 [SIMULATE] Getting identity", flush=True)
        sys.stdout.flush()
        identity = get_jwt_identity()
        employee_id = int(identity)
        
        print(f"🔵 [SIMULATE] Employee ID: {employee_id}", flush=True)
        sys.stdout.flush()
        session = current_app.SessionLocal()
        
        try:
            employee = session.query(Employee).filter_by(id=employee_id).first()
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404
            
            print(f"🔵 [SIMULATE] Creating interaction for {employee.name}", flush=True)
            sys.stdout.flush()
            # 1. CREATE INTERACTION
            interaction = Interaction(
                employee_id=employee_id,
                start_timestamp=_start_from_form(),
                video_file_path=None
            )
            session.add(interaction)
            session.commit()
            interaction_id = interaction.id
            
            logger.info(f"📍 Interaction {interaction_id} created for {employee.name}")
            print(f"🔵 [SIMULATE] Interaction {interaction_id} created", flush=True)
            sys.stdout.flush()
            
            # 2. SAVE VIDEO FILE from request
            print("🔵 [SIMULATE] Getting file manager", flush=True)
            sys.stdout.flush()
            file_manager = get_file_manager()
            video_path = file_manager.get_video_path(interaction_id)
            
            print(f"🔵 [SIMULATE] Video path: {video_path}", flush=True)
            sys.stdout.flush()
            if 'video' not in request.files:
                return jsonify({'error': 'No video file provided'}), 400
            
            video_file = request.files['video']
            print(f"🔵 [SIMULATE] Saving video file: {video_file.filename}", flush=True)
            sys.stdout.flush()
            video_file.save(video_path)
            
            logger.info(f"✅ Video saved: {video_path}")
            print(f"🔵 [SIMULATE] Video saved successfully", flush=True)
            sys.stdout.flush()
            
            # 2b. RESPONSE-TIME EVENTS from manual buttons (sensor replaces this in Phase 9)
            events_raw = request.form.get('events')
            if events_raw and events_raw.strip() not in ('', '[]'):
                import json as _json
                from datetime import datetime as _dt
                from app.models import ResponseTimeRecord
                from app.services.response_timer import compute_response_time

                def _utc_naive(v):
                    return _dt.fromisoformat(v.replace('Z', '+00:00')).replace(tzinfo=None)

                events = _json.loads(events_raw) if events_raw else []
                arrivals = sorted(_utc_naive(e['at']) for e in events if e.get('type') == 'arrival')
                responses = sorted(_utc_naive(e['at']) for e in events if e.get('type') == 'response')
                arr_at = arrivals[0] if arrivals else None
                resp_at = next((r for r in responses if arr_at is None or r >= arr_at), None)
                rt = compute_response_time(arr_at, resp_at)
                session.add(ResponseTimeRecord(
                    interaction_id=interaction_id,
                    arrival_at=arr_at,
                    response_at=resp_at,
                    response_seconds=rt['response_seconds'],
                    status=rt['status'],
                ))

            # 3. END INTERACTION
            interaction.end_timestamp = datetime.utcnow()
            interaction.video_file_path = video_path
            session.commit()
            
            print(f"🔵 [SIMULATE] Returning success response", flush=True)
            sys.stdout.flush()
            return jsonify({
                'status': 'success',
                'interaction_id': interaction_id,
                'employee_id': employee_id,
                'employee_name': employee.name,
                'start_timestamp': interaction.start_timestamp.isoformat(),
                'end_timestamp': interaction.end_timestamp.isoformat(),
                'video_file_path': video_path,
                'message': 'Capture complete. Ready for batch processing.'
            }), 201
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"🔴 [SIMULATE] Exception: {str(e)}", flush=True)
        print(f"🔴 [SIMULATE] Traceback:\n{traceback.format_exc()}", flush=True)
        sys.stdout.flush()
        logger.error(f"Simulation error: {str(e)}")
        return jsonify({'error': str(e)}), 500
