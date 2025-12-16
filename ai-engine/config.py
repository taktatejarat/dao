# ai-engine/config.py - SMART AUTO-DISCOVERY

import os
import json
import httpx # استفاده از httpx برای تست اتصال
import warnings
from web3 import Web3
from dotenv import load_dotenv
from logger_config import logger

# غیرفعال کردن هشدارهای امنیتی SSL برای محیط توسعه
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

# بارگذاری متغیرها
load_dotenv(dotenv_path="../.env")

# --- تنظیمات بلاکچین ---
RPC_URL = os.environ.get("AMOY_RPC_URL")
AI_ORACLE_PRIVATE_KEY = os.environ.get("AI_ORACLE_PRIVATE_KEY")
DAO_REGISTRY_ADDRESS = os.environ.get("NEXT_PUBLIC_REGISTRY_ADDRESS")

# --- تشخیص هوشمند محیط (Build vs Dev) ---
URL_BUILD = os.environ.get("NODE_API_BASE_BUILD", "http://127.0.0.1:3000/api")
URL_DEV = os.environ.get("NODE_API_BASE_DEV", "https://127.0.0.1:3001/api")

def detect_active_api():
    """
    بررسی می‌کند که کدام محیط (Dev یا Build) در حال اجراست.
    اولویت با محیط Dev (شبکه) است.
    """
    # 1. تلاش برای اتصال به محیط Dev (HTTPS/3001)
    try:
        # یک درخواست سریع به ریشه API می‌فرستیم
        # verify=False یعنی گواهی امنیتی چک نشود (برای self-signed)
        with httpx.Client(verify=False, timeout=1.0) as client:
            # چک می‌کنیم آیا پورت باز است یا نه (حتی اگر 404 بدهد یعنی سرور زنده است)
            client.get(URL_DEV)
            logger.info(f"🌐 Environment Detected: DEV NETWORK mode ({URL_DEV})")
            return URL_DEV
    except:
        pass # اگر وصل نشد، می‌رویم سراغ بعدی

    # 2. تلاش برای اتصال به محیط Build (HTTP/3000)
    try:
        with httpx.Client(timeout=1.0) as client:
            client.get(URL_BUILD)
            logger.info(f"🏗️ Environment Detected: BUILD/PRODUCTION mode ({URL_BUILD})")
            return URL_BUILD
    except:
        pass

    # 3. اگر هیچکدام بالا نبود، پیش‌فرض را برمی‌گرداند (Dev برای امنیت بیشتر در توسعه)
    logger.warning("⚠️ No active Next.js backend detected. Defaulting to DEV configuration.")
    return URL_DEV

# تنظیم نهایی آدرس پایه
NODE_API_BASE_URL = detect_active_api()

# --- بارگذاری ABI ها ---
try:
    DAO_ABI = json.loads(os.environ.get("RAYAN_CHAIN_DAO_ABI", "[]"))
    REGISTRY_ABI = json.loads(os.environ.get("REGISTRY_ABI", "[]"))
except Exception as e:
    logger.warning(f"Failed to parse ABIs from env: {e}")
    DAO_ABI = []
    REGISTRY_ABI = []

w3 = Web3(Web3.HTTPProvider(RPC_URL))

AI_ORACLE_ADDRESS = None
if AI_ORACLE_PRIVATE_KEY:
    try:
        account = w3.eth.account.from_key(AI_ORACLE_PRIVATE_KEY)
        AI_ORACLE_ADDRESS = account.address
    except Exception as e:
        logger.error(f"Invalid Private Key: {e}")

logger.info(f"Config Ready. Oracle: {AI_ORACLE_ADDRESS} | Target API: {NODE_API_BASE_URL}")