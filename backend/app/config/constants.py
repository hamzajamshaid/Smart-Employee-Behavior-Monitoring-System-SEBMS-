# ============================================================================
# SEBMS BEHAVIORAL SCORING CONSTANTS
# ============================================================================

# Behavioral Module Thresholds
PRESENCE_THRESHOLD = 70.0  # Minimum acceptable presence score
EMOTION_THRESHOLD = 65.0   # Minimum acceptable emotion score
RESPONSE_THRESHOLD = 15.0  # Maximum acceptable response time (seconds)
FEEDBACK_THRESHOLD = 3.0   # Minimum acceptable customer feedback rating

# Score Weights (must sum to 1.0)
SCORE_WEIGHTS = {
    'presence': 0.20,
    'emotion': 0.25,
    'response': 0.20,
    'feedback': 0.20,
    'voice': 0.15
}

# Alert Triggers
ALERT_UNIFIED_SCORE_THRESHOLD = 70.0
ALERT_CONSECUTIVE_LOW_SCORES = 3
ALERT_TIMEFRAME_HOURS = 24

# Storage Paths
VIDEOS_DIR = 'backend/storage/videos'
AUDIO_DIR = 'backend/storage/audio'
FRAMES_DIR = 'backend/storage/frames'
LOGS_DIR = 'backend/storage/logs'

# Processing Settings
BATCH_PROCESS_HOUR = 0  # 00:00 UTC daily
FRAME_SAMPLING_RATE = 2  # Process every 2nd frame
VIDEO_FRAME_RATE = 30  # Expected FPS

# Model Settings
DEEPFACE_MODEL = 'Facenet512'
DEEPFACE_DETECTOR = 'mediapipe'
MEDIAPIPE_CONFIDENCE = 0.5
WHISPER_MODEL = 'base'

# Trigger Modes
TRIGGER_MODE = 'manual'  # 'manual', 'simulated', 'arduino'

