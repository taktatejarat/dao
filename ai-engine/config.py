# ai-engine/config.py (نسخه نهایی و کامل)

import os
import json
from web3 import Web3
from dotenv import load_dotenv

# --- بارگذاری متغیرهای محیطی ---
# مسیر فایل .env را نسبت به ریشه پروژه پیدا می‌کند
# این باعث می‌شود اسکریپت از هر جایی قابل اجرا باشد
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(SCRIPT_DIR, '..', '.env') 
load_dotenv(dotenv_path=DOTENV_PATH)

# --- خواندن متغیرهای محیطی ---
RPC_URL = os.environ.get("AMOY_RPC_URL")
AI_ORACLE_PRIVATE_KEY = os.environ.get("AI_ORACLE_PRIVATE_KEY")
DAO_REGISTRY_ADDRESS = os.environ.get("NEXT_PUBLIC_REGISTRY_ADDRESS")

# --- بارگذاری ABI ها ---
try:
    DAO_ABI_STR = os.environ.get("RAYAN_CHAIN_DAO_ABI", "[]")
    DAO_ABI = json.loads(DAO_ABI_STR)

    # ✅ FIX: ما ABI رجیستری را به صورت اختیاری بارگذاری می‌کنیم
    # اگر در .env نبود، به صورت یک آرایه خالی باقی می‌ماند.
    REGISTRY_ABI_STR = os.environ.get("REGISTRY_ABI", "[]")
    REGISTRY_ABI = json.loads(REGISTRY_ABI_STR)
except (json.JSONDecodeError, TypeError) as e:
    print(f"CRITICAL ERROR: Failed to parse ABI JSON. Error: {e}")
    DAO_ABI = []
    REGISTRY_ABI = [] # مقداردهی اولیه به آرایه خالی در صورت خطا

# ✅✅✅ FIX: بررسی متغیرهای حیاتی (REGISTRY_ABI دیگر اینجا نیست) ✅✅✅
if not all([RPC_URL, AI_ORACLE_PRIVATE_KEY, DAO_REGISTRY_ADDRESS, DAO_ABI]):
    raise EnvironmentError(
        "FATAL: Missing critical AI Oracle configurations in .env file. "
        "Required: AMOY_RPC_URL, AI_ORACLE_PRIVATE_KEY, NEXT_PUBLIC_REGISTRY_ADDRESS, RAYAN_CHAIN_DAO_ABI"
    )

# --- نمونه‌سازی Web3 ---
w3 = Web3(Web3.HTTPProvider(RPC_URL))
AI_ORACLE_ACCOUNT = w3.eth.account.from_key(AI_ORACLE_PRIVATE_KEY)
AI_ORACLE_ADDRESS = AI_ORACLE_ACCOUNT.address

print(f"[CONFIG] AI Oracle configured successfully for address: {AI_ORACLE_ADDRESS}")