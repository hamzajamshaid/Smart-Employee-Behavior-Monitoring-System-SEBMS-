import logging
from deepface import DeepFace
import mediapipe as mp
import whisper

logger = logging.getLogger(__name__)

class ModelLoader:
    """Singleton: Load ML models once, reuse across requests"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        logger.info("🔄 Loading ML models...")
        
        # DeepFace (emotion recognition)
        try:
            self.deepface_model = DeepFace
            logger.info("✅ DeepFace loaded")
        except Exception as e:
            logger.error(f"❌ DeepFace error: {str(e)}")
            self.deepface_model = None
        
        # MediaPipe (face detection + landmarks)
        try:
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_drawing = mp.solutions.drawing_utils
            logger.info("✅ MediaPipe loaded")
        except Exception as e:
            logger.error(f"❌ MediaPipe error: {str(e)}")
            self.mp_face_detection = None
        
        # Whisper (speech-to-text)
        try:
            self.whisper_model = whisper.load_model("base")
            logger.info("✅ Whisper loaded")
        except Exception as e:
            logger.error(f"❌ Whisper error: {str(e)}")
            self.whisper_model = None
        
        self._initialized = True
        logger.info("✅ All models initialized")
    
    def get_deepface(self):
        return self.deepface_model
    
    def get_mediapipe(self):
        return self.mp_face_detection
    
    def get_whisper(self):
        return self.whisper_model

# Singleton instance
_loader = None

def get_model_loader() -> ModelLoader:
    global _loader
    if _loader is None:
        _loader = ModelLoader()
    return _loader

