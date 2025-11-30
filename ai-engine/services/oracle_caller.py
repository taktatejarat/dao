# ai-engine/services/oracle_caller.py

from typing import List, Any
from web3 import Web3
from config import w3, AI_ORACLE_ADDRESS, AI_ORACLE_PRIVATE_KEY, DAO_REGISTRY_ADDRESS, DAO_ABI, REGISTRY_ABI

# --- مدیریت Instance قرارداد ---
_dao_contract_instance = None

def get_dao_contract():
    global _dao_contract_instance
    if _dao_contract_instance:
        return _dao_contract_instance

    if not DAO_REGISTRY_ADDRESS:
        raise ValueError("FATAL: DAO_REGISTRY_ADDRESS is missing in .env")
        
    # استفاده از Fallback ABI اگر در متغیرهای محیطی نبود
    final_registry_abi = REGISTRY_ABI if REGISTRY_ABI else [{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
    
    try:
        registry_contract = w3.eth.contract(address=w3.to_checksum_address(DAO_REGISTRY_ADDRESS), abi=final_registry_abi)
        dao_key_hash = w3.keccak(text="RAYAN_CHAIN_DAO")
        
        # دریافت آدرس DAO از رجیستری
        dao_address_str = registry_contract.functions.getAddress(dao_key_hash).call()
        
        if not dao_address_str or dao_address_str == '0x' + '0' * 40:
             raise ValueError(f"Registry returned zero address for DAO. Check Registry at {DAO_REGISTRY_ADDRESS}")

        print(f"[ORACLE] ✅ DAO Address found: {dao_address_str}")
        _dao_contract_instance = w3.eth.contract(address=w3.to_checksum_address(dao_address_str), abi=DAO_ABI)
        return _dao_contract_instance

    except Exception as e:
        print(f"[ORACLE ERROR] Failed to initialize DAO contract: {e}")
        raise e

def send_transaction(function_name: str, args: List[Any]) -> str | None:
    """
    ارسال تراکنش به شبکه بلاکچین با امضای دیجیتال
    """
    try:
        print(f"[ORACLE] Preparing to call {function_name} with args: {args}")
        dao_contract = get_dao_contract()
        func_call = getattr(dao_contract.functions, function_name)(*args)
        
        # 1. دریافت Nonce
        nonce = w3.eth.get_transaction_count(AI_ORACLE_ADDRESS)
        
        # 2. ساخت پارامترهای تراکنش
        tx_build = func_call.build_transaction({
            'from': AI_ORACLE_ADDRESS,
            'nonce': nonce,
            'gasPrice': w3.eth.gas_price, 
        })
        
        # 3. تخمین گاز (اختیاری ولی پیشنهادی)
        try:
            estimated_gas = w3.eth.estimate_gas(tx_build)
            tx_build['gas'] = int(estimated_gas * 1.2) # 20% Buffer
        except Exception as gas_err:
            print(f"[ORACLE WARN] Gas estimation failed, using default high limit. Error: {gas_err}")
            tx_build['gas'] = 500000

        # 4. امضای تراکنش
        signed_tx = w3.eth.account.sign_transaction(tx_build, private_key=AI_ORACLE_PRIVATE_KEY)
        
        # 5. ارسال تراکنش
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        print(f"[ORACLE] 🚀 Transaction sent! Hash: {tx_hash.hex()}")
        
        # 6. انتظار برای تأیید (اختیاری، چون ممکن است زمان‌بر باشد)
        # receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        # print(f"[ORACLE] ✅ Transaction confirmed in block {receipt.blockNumber}")
        
        return tx_hash.hex()

    except Exception as e:
        print(f"[ORACLE CRITICAL ERROR] Transaction failed: {e}")
        return None

# --- توابع عمومی ---

def update_proposal_risk_score(proposal_id: int, risk_score: int):
    """
    ارسال امتیاز ریسک به قرارداد. 
    نکته: risk_score در اینجا همان investability_score است (بالا = خوب) 
    یا risk_score (بالا = خطرناک)؟
    قرارداد هوشمند `aiRiskScore` را ذخیره می‌کند. معمولاً قراردادها امتیاز "ریسک" (0=امن) 
    یا "اعتبار" (100=امن) را ذخیره می‌کنند. 
    در اینجا فرض می‌کنیم قرارداد انتظار یک عدد 0 تا 100 را دارد.
    """
    print(f"[ORACLE] Updating On-Chain Risk Score for Proposal ID {proposal_id}: Score {risk_score}")
    # تبدیل به int جهت اطمینان
    send_transaction('updateProposalRiskScore', [int(proposal_id), int(risk_score)])


def update_participation_score(user_address: str, score: int):
    """
    ارسال امتیاز مشارکت به قرارداد DAO.
    """
    print(f"[ORACLE] Updating Participation Score for {user_address}: {score}")
    # آدرس کاربر باید به فرمت Checksum باشد
    checksum_addr = w3.to_checksum_address(user_address)
    send_transaction('updateParticipationScore', [checksum_addr, int(score)])