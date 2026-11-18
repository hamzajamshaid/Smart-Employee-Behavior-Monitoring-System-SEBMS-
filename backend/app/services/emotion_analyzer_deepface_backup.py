import os
os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")

import logging
import cv2
from deepface import DeepFace

logger = logging.getLogger(__name__)

SAMPLE_EVERY_N_FRAMES = 5


class EmotionAnalyzer:
    """
    Facial expression classification (EXPERIMENTAL).
    Expression labels are not a measure of professionalism, intent, or
    employee performance. Results must not drive employment decisions.
    """

    def analyze_emotions(self, video_path: str) -> dict:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return self._result('video_unreadable', None, {}, 0, 0, [f'cannot open {video_path}'])

        emotion_counts = {}
        frame_count = 0
        frames_sampled = 0
        frames_no_face = 0
        errors = []

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                frame_count += 1
                if frame_count % SAMPLE_EVERY_N_FRAMES != 0:
                    continue
                frames_sampled += 1

                try:
                    result = DeepFace.analyze(
                        frame, actions=['emotion'], enforce_detection=True
                    )
                except ValueError:
                    # DeepFace raises ValueError when no face is detected
                    frames_no_face += 1
                    continue
                except Exception as e:
                    logger.warning(f"Emotion frame {frame_count} failed: {e}")
                    errors.append(f"frame {frame_count}: {str(e)[:200]}")
                    continue

                entries = result if isinstance(result, list) else [result]
                if not entries:
                    frames_no_face += 1
                    continue

                emotion = entries[0].get('dominant_emotion')
                if emotion is None:
                    errors.append(f"frame {frame_count}: no dominant_emotion in result")
                    continue
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        finally:
            cap.release()

        analyzed = sum(emotion_counts.values())
        if analyzed == 0:
            status = 'error' if errors else 'no_face_detected'
            return self._result(status, None, {}, frames_sampled, 0, errors, frames_no_face)

        positive = emotion_counts.get('happy', 0) + emotion_counts.get('neutral', 0)
        score = round((positive / analyzed) * 100, 2)
        dominant = max(emotion_counts, key=emotion_counts.get)
        return self._result('ok', score, emotion_counts, frames_sampled, analyzed, errors,
                            frames_no_face, dominant)

    @staticmethod
    def _result(status, score, distribution, frames_sampled, frames_analyzed,
                errors, frames_no_face=0, dominant=None):
        return {
            'status': status,
            'emotion_score': score,              # None = not measured, never 0 for missing data
            'dominant_emotion': dominant,
            'emotion_distribution': distribution,
            'frames_sampled': frames_sampled,
            'frames_analyzed': frames_analyzed,
            'frames_no_face': frames_no_face,
            'errors': errors,
            'experimental': True,
        }
