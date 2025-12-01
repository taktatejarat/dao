# ai-engine/logger_config.py

import logging
import os
import sys
from logging.handlers import RotatingFileHandler

# مسیر فایل لاگ
LOG_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(LOG_DIR, 'ai_oracle_service.log')

# تنظیم فرمت: زمان - سطح - پیام
FORMATTER = logging.Formatter("%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s")

def get_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # جلوگیری از تکرار هندلرها
    if not logger.handlers:
        # 1. هندلر فایل (نوشتن در فایل با چرخش خودکار)
        file_handler = RotatingFileHandler(LOG_FILE, maxBytes=10*1024*1024, backupCount=5)
        file_handler.setFormatter(FORMATTER)
        logger.addHandler(file_handler)

        # 2. هندلر کنسول (نمایش در ترمینال)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(FORMATTER)
        logger.addHandler(console_handler)

    return logger

# ایجاد یک لاگر اصلی برای استفاده
logger = get_logger("RayanAI")