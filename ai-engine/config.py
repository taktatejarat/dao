# ai-engine/config.py

import os
import json
from web3 import Web3
from dotenv import load_dotenv

# بارگذاری متغیرهای محیطی از فایل .env در ریشه پروژه
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(SCRIPT_DIR, '..', '.env')
load_dotenv(dotenv_path=DOTENV_PATH)

# --- متغیرهای محیطی ---
RPC_URL = os.environ.get("AMOY_RPC_URL")
AI_ORACLE_PRIVATE_KEY = os.environ.get("AI_ORACLE_PRIVATE_KEY")
DAO_REGISTRY_ADDRESS = os.environ.get("NEXT_PUBLIC_REGISTRY_ADDRESS")

# --- بارگذاری ABI ---
try:
    DAO_ABI_STR = os.environ.get("RAYAN_CHAIN_DAO_ABI", "[]")
    DAO_ABI = json.loads(DAO_ABI_STR)
except (json.JSONDecodeError, TypeError):
    DAO_ABI = []

# --- بررسی متغیرهای حیاتی ---
if not all([RPC_URL, AI_ORACLE_PRIVATE_KEY, DAO_REGISTRY_ADDRESS, DAO_ABI]):
    raise EnvironmentError("FATAL: Missing critical AI Oracle configuration in .env file.")

# --- نمونه‌سازی Web3 ---
w3 = Web3(Web3.HTTPProvider(RPC_URL))
AI_ORACLE_ACCOUNT = w3.eth.account.from_key(AI_ORACLE_PRIVATE_KEY)
AI_ORACLE_ADDRESS = AI_ORACLE_ACCOUNT.address

print(f"[CONFIG] AI Oracle configured successfully for address: {AI_ORACLE_ADDRESS}")