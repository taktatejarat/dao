# ai-engine/config.py

import os
import json
from web3 import Web3
from dotenv import load_dotenv
from logger_config import logger

# بارگذاری env از پوشه ریشه (یک سطح عقب‌تر)
load_dotenv(dotenv_path="../.env")

# --- تنظیمات بلاکچین ---
RPC_URL = os.environ.get("AMOY_RPC_URL")
AI_ORACLE_PRIVATE_KEY = os.environ.get("AI_ORACLE_PRIVATE_KEY")
DAO_REGISTRY_ADDRESS = os.environ.get("NEXT_PUBLIC_REGISTRY_ADDRESS")

# --- تنظیمات شبکه و API ---
# نکته مهم: برای ارتباط سرور-به-سرور (پایتون به نکست)، لوکال هاست امن‌تر و سریع‌تر است
NODE_API_BASE_URL = os.environ.get("NODE_API_BASE_URL", "http://localhost:3000/api")

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

logger.info(f"Configuration Loaded. Oracle: {AI_ORACLE_ADDRESS} | Node API: {NODE_API_BASE_URL}")