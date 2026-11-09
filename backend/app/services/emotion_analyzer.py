import os
os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")

import logging
import cv2
import numpy as np
from deepface import DeepFace

logger = logging.getLogger(__name__)

SAMPLE_EVERY_N_FRAMES = 5
MIN_ANALYSED_FRAMES = 10  # below this, the emotion score is not trusted
BACKEND = os.environ.get("EMOTION_BACKEND", "deepface")  # "deepface" or "resnet50_3g"
RESNET_LABELS = ['negative', 'neutral', 'positive']
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          '..', '..', 'ml_models', 'resnet50_3g_finetuned.keras')
_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
_resnet = None


def _load_resnet():
    global _resnet
    if _resnet is None:
        import tensorflow as tf
        from keras import layers, models
        from keras.applications import ResNet50
        from keras.applications.resnet50 import preprocess_input
        inp = layers.Input(shape=(48, 48, 1), dtype='uint8')
        x = layers.Lambda(lambda t: tf.cast(t, 'float32'))(inp)
        x = layers.Resizing(224, 224)(x)
        x = layers.Concatenate()([x, x, x])
        x = layers.Lambda(preprocess_input)(x)
        base = ResNet50(include_top=False, weights=None,
                        input_shape=(224, 224, 3), pooling='avg')
        x = base(x, training=False)
        out = layers.Dense(3, activation='softmax', dtype='float32')(x)
        model = models.Model(inp, out)
        model.load_weights(MODEL_PATH)
        _resnet = model
    return _resnet


def _face_48(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(40, 40))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return cv2.resize(gray[y:y + h, x:x + w], (48, 48), interpolation=cv2.INTER_AREA)


class EmotionAnalyzer:
    """
    Facial expression classification (EXPERIMENTAL).
    Expression labels are not a measure of professionalism, intent, or
    employee performance. Results must not drive employment decisions.
    """

    def analyze_emotions(self, video_path: str, allowed_frames=None) -> dict:
        allowed = set(allowed_frames) if allowed_frames is not None else None
        if BACKEND == 'resnet50_3g':
            return self._analyze_resnet(video_path, allowed)
        return self._analyze_deepface(video_path, allowed)

    def _analyze_resnet(self, video_path: str, allowed=None) -> dict:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return self._result('video_unreadable', None, {}, 0, 0, [f'cannot open {video_path}'])

        faces, frame_count, frames_sampled, frames_no_face = [], 0, 0, 0
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                frame_count += 1
                if frame_count % SAMPLE_EVERY_N_FRAMES != 0:
                    continue
                if allowed is not None and frame_count not in allowed:
                    continue
                frames_sampled += 1
                face = _face_48(frame)
                if face is None:
                    frames_no_face += 1
                else:
                    faces.append(face)
        finally:
            cap.release()

        if not faces:
            return self._result('no_face_detected', None, {}, frames_sampled, 0, [], frames_no_face)

        batch = np.stack(faces).reshape(-1, 48, 48, 1)
        probs = _load_resnet().predict(batch, batch_size=64, verbose=0)

        counts = {}
        for idx in probs.argmax(1):
            name = RESNET_LABELS[int(idx)]
            counts[name] = counts.get(name, 0) + 1

        analyzed = len(faces)
        dominant = max(counts, key=counts.get)
        if analyzed < MIN_ANALYSED_FRAMES:
            return self._result('insufficient_frames', None, counts, frames_sampled, analyzed,
                                [], frames_no_face, dominant)

        positive = counts.get('neutral', 0) + counts.get('positive', 0)
        score = round((positive / analyzed) * 100, 2)
        return self._result('ok', score, counts, frames_sampled, analyzed, [],
                            frames_no_face, dominant)

    def _analyze_deepface(self, video_path: str, allowed=None) -> dict:
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
                if allowed is not None and frame_count not in allowed:
                    continue
                frames_sampled += 1

                try:
                    result = DeepFace.analyze(
                        frame, actions=['emotion'], enforce_detection=True
                    )
                except ValueError:
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

        dominant = max(emotion_counts, key=emotion_counts.get)
        if analyzed < MIN_ANALYSED_FRAMES:
            return self._result('insufficient_frames', None, emotion_counts, frames_sampled,
                                analyzed, errors, frames_no_face, dominant)

        positive = emotion_counts.get('happy', 0) + emotion_counts.get('neutral', 0)
        score = round((positive / analyzed) * 100, 2)
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

_analyzer = EmotionAnalyzer()


def analyze_emotions(video_path: str, allowed_frames=None) -> dict:
    return _analyzer.analyze_emotions(video_path, allowed_frames)
