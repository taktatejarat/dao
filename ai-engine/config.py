# ai-engine/config.py

import os
import json
from web3 import Web3
from dotenv import load_dotenv
from logger_config import logger  # ✅ ایمپورت لاگر

# بارگذاری env از پوشه ریشه (یک سطح عقب‌تر)
load_dotenv(dotenv_path="../.env")

RPC_URL = os.environ.get("AMOY_RPC_URL")
AI_ORACLE_PRIVATE_KEY = os.environ.get("AI_ORACLE_PRIVATE_KEY")
DAO_REGISTRY_ADDRESS = os.environ.get("NEXT_PUBLIC_REGISTRY_ADDRESS")

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

logger.info(f"Configuration Loaded. Oracle: {AI_ORACLE_ADDRESS} | RPC: {RPC_URL}")