from celery import Celery
from celery.schedules import crontab
import logging
import os
import warnings

logger = logging.getLogger(__name__)

BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

celery_app = Celery('sebms')

celery_app.conf.update(
    broker_url=BROKER_URL,
    result_backend=RESULT_BACKEND,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    beat_schedule={
        'process-daily-interactions': {
            'task': 'app.pipelines.behavioral_processor.process_daily_interactions',
            'schedule': crontab(hour=0, minute=0),  # every day at 00:00 UTC
        },
    },
)

logger.info(f"✅ Celery configured - Broker: {BROKER_URL}")
