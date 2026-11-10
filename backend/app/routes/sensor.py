import os
import shutil
import subprocess
import tempfile

from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required
from app.models import SensorPresenceEvent
from app.services.transcriber import Transcriber

sensor_bp = Blueprint('sensor', __name__)


@sensor_bp.route('/sensor/state', methods=['GET'])
@jwt_required()
def sensor_state():
    session = current_app.SessionLocal()
    try:
        ev = session.query(SensorPresenceEvent).order_by(SensorPresenceEvent.id.desc()).first()
        if not ev:
            return jsonify({'is_present': False, 'since': None})
        return jsonify({'is_present': bool(ev.is_present), 'since': ev.created_at.isoformat() + 'Z'})
    finally:
        session.close()


@sensor_bp.route('/sensor/transcribe-chunk', methods=['POST'])
@jwt_required()
def transcribe_chunk():
    audio = request.files.get('audio')
    if audio is None:
        return jsonify({'text': None, 'status': 'no_audio'}), 400
    ffmpeg = shutil.which('ffmpeg') or '/opt/anaconda3/bin/ffmpeg'
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'chunk.webm')
        wav = os.path.join(tmp, 'chunk.wav')
        audio.save(src)
        proc = subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', src, '-ar', '16000', '-ac', '1', wav],
                              capture_output=True, text=True, timeout=60)
        if proc.returncode != 0 or not os.path.exists(wav):
            return jsonify({'text': None, 'status': 'convert_failed'}), 200
        result = Transcriber().transcribe(wav)
    return jsonify({'text': result.get('transcript'), 'status': result.get('status'),
                    'language': result.get('language')}), 200


@sensor_bp.route('/sensor/frame-emotion', methods=['POST'])
@jwt_required()
def frame_emotion():
    import cv2
    import numpy as np
    from app.services.emotion_analyzer import classify_frame
    image = request.files.get('frame')
    if image is None:
        return jsonify({'face': False, 'error': 'no_frame'}), 400
    frame = cv2.imdecode(np.frombuffer(image.read(), np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({'face': False, 'error': 'bad_image'}), 400
    return jsonify(classify_frame(frame)), 200

