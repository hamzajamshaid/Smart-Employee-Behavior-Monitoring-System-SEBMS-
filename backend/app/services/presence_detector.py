import cv2
import logging
from mediapipe import solutions
import numpy as np

SAMPLE_EVERY_N_FRAMES = 5  # matches emotion_analyzer; Phase 8 tests other rates

logger = logging.getLogger(__name__)

class PresenceDetector:
    """Detect employee presence in video using MediaPipe face detection"""
    
    def __init__(self):
        self.face_detection = solutions.face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=0.5
        )
    
    def detect_presence(self, video_path: str, confidence_threshold: float = 0.5) -> dict:
        """Analyze video for presence score"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return {'status': 'video_unreadable', 'presence_score': None, 'is_present': None, 'error': f'cannot open {video_path}'}
            
            frames_with_face = 0
            total_frames = 0
            confidences = []
            face_frames = []
            
            frame_index = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                frame_index += 1
                if frame_index % SAMPLE_EVERY_N_FRAMES != 0:
                    continue
                total_frames += 1
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.face_detection.process(rgb_frame)
                kept = [d for d in (results.detections or []) if d.score[0] >= confidence_threshold]
                if kept:
                    frames_with_face += 1
                    face_frames.append(frame_index)
                    confidences.extend(d.score[0] for d in kept)
            
            cap.release()
            presence_score = (frames_with_face / max(total_frames, 1)) * 100
            return {'status': 'ok', 'presence_score': round(presence_score, 2), 'is_present': presence_score >= 70, 'face_frames': face_frames}
        except Exception as e:
            logger.error(f"Presence detection error: {str(e)}")
            return {'status': 'error', 'presence_score': None, 'is_present': None, 'error': str(e)}

