from app import create_app
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    try:
        app = create_app()
        logger.info("🚀 Starting SEBMS Backend Server...")
        app.run(debug=True, host='127.0.0.1', port=5000)
    except Exception as e:
        logger.error(f"❌ Failed to start server: {str(e)}")
        raise