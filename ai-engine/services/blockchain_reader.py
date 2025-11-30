# ai-engine/services/blockchain_reader.py

from web3 import Web3
from config import w3, DAO_REGISTRY_ADDRESS, DAO_ABI
# استفاده از نسخه صحیح در services
from services.oracle_caller import get_dao_contract 

def get_user_onchain_profile(user_address: str) -> dict:
    if not w3.is_address(user_address):
        print(f"[READER ERROR] Invalid address: {user_address}")
        return {}

    checksum_address = w3.to_checksum_address(user_address)

    try:
        # 1. موجودی متیک (Native)
        balance_wei = w3.eth.get_balance(checksum_address)
        native_balance = float(w3.from_wei(balance_wei, 'ether'))

        # 2. تعداد تراکنش‌ها
        tx_count = w3.eth.get_transaction_count(checksum_address)

        # 3. امتیاز مشارکت (از قرارداد DAO)
        participation_score = 0
        try:
            dao_contract = get_dao_contract()
            participation_score = dao_contract.functions.participationScores(checksum_address).call()
        except Exception as e:
            print(f"[READER WARN] Failed to fetch DAO score: {e}")

        profile = {
            "address": user_address,
            "amount": native_balance, # نگاشت به فیلد مورد انتظار مدل امنیت
            "gas_used": tx_count * 21000, # تخمین ساده برای مدل فعلی
            "transaction_count": tx_count,
            "dao_score": participation_score
        }
        print(f"[READER] Real data for {user_address}: {profile}")
        return profile

    except Exception as e:
        print(f"[READER ERROR] Failed to read blockchain: {e}")
        return {"amount": 0, "gas_used": 0}