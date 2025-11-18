# ai-engine/services/oracle_caller.py (نسخه نهایی و هماهنگ با config.py)

from typing import List, Any
from web3 import Web3

# ✅✅✅ FIX: وارد کردن تمام نیازمندی‌ها فقط از config.py ✅✅✅
from config import w3, AI_ORACLE_ADDRESS, AI_ORACLE_PRIVATE_KEY, DAO_REGISTRY_ADDRESS, DAO_ABI, REGISTRY_ABI

# --- توابع کمکی برای تعامل با قراردادها ---
_dao_contract_instance = None
def get_dao_contract():
    global _dao_contract_instance
    if _dao_contract_instance:
        return _dao_contract_instance

    if not DAO_REGISTRY_ADDRESS:
        raise ValueError("DAO_REGISTRY_ADDRESS is not set in config.")
        
    # ✅✅✅ FIX: منطق جایگزین برای ABI رجیستری ✅✅✅
    final_registry_abi = REGISTRY_ABI
    if not final_registry_abi:
        # اگر REGISTRY_ABI از .env خوانده نشده بود، از نسخه هاردکد به عنوان جایگزین استفاده کن
        print("[ORACLE_CALLER] WARNING: REGISTRY_ABI not found in .env. Using hardcoded fallback.")
        final_registry_abi = [{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
    
    registry_contract = w3.eth.contract(address=w3.to_checksum_address(DAO_REGISTRY_ADDRESS), abi=final_registry_abi)
    dao_key_hash = w3.keccak(text="RAYAN_CHAIN_DAO")
    
    dao_address_str = registry_contract.functions.getAddress(dao_key_hash).call()
    if not dao_address_str or dao_address_str == '0x' + '0' * 40:
         raise ValueError("Could not fetch a valid DAO address from the registry.")

    _dao_contract_instance = w3.eth.contract(address=w3.to_checksum_address(dao_address_str), abi=DAO_ABI)
    print(f"[ORACLE] DAO Contract instance created for address: {dao_address_str}")
    return _dao_contract_instance

def send_transaction(function_name: str, args: List[Any]) -> str | None:
    """
    یک تابع عمومی برای ساخت، امضا و ارسال تراکنش از طرف اوراکل AI.
    """
    try:
        dao_contract = get_dao_contract()
        func_call = getattr(dao_contract.functions, function_name)(*args)
        
        tx_params = {
            'from': AI_ORACLE_ADDRESS,
            'nonce': w3.eth.get_transaction_count(AI_ORACLE_ADDRESS),
            'gasPrice': w3.eth.gas_price,
        }
        
        estimated_gas = func_call.estimate_gas({'from': AI_ORACLE_ADDRESS})
        tx_params['gas'] = int(estimated_gas * 1.2)
        
        transaction = func_call.build_transaction(tx_params)
        
        signed_tx = w3.eth.account.sign_transaction(transaction, private_key=AI_ORACLE_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        print(f"[ORACLE] Sent transaction '{function_name}'. Hash: {tx_hash.hex()}")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"[ORACLE] Transaction '{function_name}' confirmed in block {receipt.blockNumber}.")
        
        return tx_hash.hex()

    except Exception as e:
        print(f"--- [ORACLE ERROR] ---\n   Function: {function_name}\n   Arguments: {args}\n   Error: {e}\n----------------------")
        return None

# --- توابع اصلی اوراکل (فقط برای ارسال داده به بلاکچین) ---

def update_proposal_risk_score(proposal_id: int, risk_score: int):
    """فقط امتیاز ریسک را به قرارداد هوشمند ارسال می‌کند."""
    if not (0 <= risk_score <= 100):
        print(f"Invalid risk score ({risk_score}). Not sending transaction.")
        return
    print(f"Oracle Caller: Sending risk score {risk_score} for proposal ID {proposal_id}.")
    send_transaction('updateProposalRiskScore', [proposal_id, risk_score])

def update_participation_score(user_address: str, pop_score: int):
    """فقط امتیاز مشارکت را به قرارداد هوشمند ارسال می‌کند."""
    if not (0 <= pop_score <= 1000): # محدوده امتیاز مشارکت
        print(f"Invalid PoP score ({pop_score}). Not sending transaction.")
        return
    print(f"Oracle Caller: Sending PoP score {pop_score} for user {user_address}.")
    send_transaction('updateParticipationScore', [w3.to_checksum_address(user_address), pop_score])