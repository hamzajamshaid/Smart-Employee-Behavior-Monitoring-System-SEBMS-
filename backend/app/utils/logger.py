import logging
import os
from datetime import datetime

def setup_logger(name: str, log_file: str = None) -> logging.Logger:
    """Setup logger with file and console handlers"""
    
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(console_format)
        logger.addHandler(file_handler)
    
    return logger

def get_batch_log_path() -> str:
    """Get path for batch processing logs"""
    log_dir = 'backend/storage/logs'
    os.makedirs(log_dir, exist_ok=True)
    date_str = datetime.utcnow().strftime('%Y-%m-%d')
    return os.path.join(log_dir, f'batch_process_{date_str}.log')

