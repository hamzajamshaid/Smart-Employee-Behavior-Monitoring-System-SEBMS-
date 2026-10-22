from app.celery_app import celery_app

# Import task so Celery can discover it
from app.pipelines.behavioral_processor import process_daily_interactions

if __name__ == '__main__':
    celery_app.start()
