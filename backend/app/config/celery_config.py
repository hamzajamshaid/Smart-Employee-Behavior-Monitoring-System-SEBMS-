# ============================================================================
# CELERY & REDIS CONFIGURATION
# ============================================================================

import os
from datetime import timedelta

# Redis broker
BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Task settings
TASK_SERIALIZER = 'json'
ACCEPT_CONTENT = ['json']
RESULT_SERIALIZER = 'json'
TIMEZONE = 'UTC'
ENABLE_UTC = True

# Task routing
TASK_ROUTES = {
    'app.pipelines.behavioral_processor.process_daily_interactions': {'queue': 'behavioral'},
}

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'process-daily-interactions': {
        'task': 'app.pipelines.behavioral_processor.process_daily_interactions',
        'schedule': timedelta(hours=24),  # Daily at midnight
        'options': {'queue': 'behavioral'}
    },
}

# Task timeouts
TASK_SOFT_TIME_LIMIT = 3600  # 1 hour
TASK_TIME_LIMIT = 3600 * 2   # 2 hours

