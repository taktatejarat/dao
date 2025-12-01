# ai-engine/config.py

import os
import json
from web3 import Web3
from dotenv import load_dotenv
from logger_config import logger # ✅ ایمپورت لاگر

# تنظیم مسیرها
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
DOTENV_PATH = os.path.join(PROJECT_ROOT, '.env')

if os.path.exists(DOTENV_PATH):
    load_dotenv(dotenv_path=DOTENV_PATH)
    logger.info(f"Loaded .env from: {DOTENV_PATH}")
else:
    logger.warning(f".env file not found at: {DOTENV_PATH}")

RPC_URL = os.environ.get("AMOY_RPC_URL") or "https://polygon-amoy.drpc.org"
AI_ORACLE_PRIVATE_KEY = os.environ.get("AI_ORACLE_PRIVATE_KEY")
DAO_REGISTRY_ADDRESS = os.environ.get("NEXT_PUBLIC_REGISTRY_ADDRESS")

def parse_abi(env_key):
    raw = os.environ.get(env_key, "[]")
    try:
        if isinstance(raw, str):
            if raw.startswith('"') and raw.endswith('"'):
                raw = json.loads(raw)
            return json.loads(raw)
        return raw
    except Exception as e:
        logger.warning(f"Failed to parse ABI for {env_key}: {e}")
        return []

DAO_ABI = parse_abi("RAYAN_CHAIN_DAO_ABI")
REGISTRY_ABI = parse_abi("REGISTRY_ABI")

w3 = Web3(Web3.HTTPProvider(RPC_URL))

AI_ORACLE_ADDRESS = None
if AI_ORACLE_PRIVATE_KEY:
    try:
        account = w3.eth.account.from_key(AI_ORACLE_PRIVATE_KEY)
        AI_ORACLE_ADDRESS = account.address
    except Exception as e:
        logger.error(f"Invalid Private Key: {e}")

logger.info(f"Configured RPC: {RPC_URL} | Oracle: {AI_ORACLE_ADDRESS}")