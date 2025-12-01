# ai-engine/services/oracle_caller.py - FINAL WITH LOGGER

from typing import List, Any
from web3 import Web3
# استفاده از کانفیگ و لاگر جدید
from config import w3, AI_ORACLE_ADDRESS, AI_ORACLE_PRIVATE_KEY, DAO_REGISTRY_ADDRESS, DAO_ABI, REGISTRY_ABI
from logger_config import logger 

# --- مدیریت Instance قرارداد ---
_dao_contract_instance = None

def get_dao_contract():
    global _dao_contract_instance
    if _dao_contract_instance:
        return _dao_contract_instance

    if not DAO_REGISTRY_ADDRESS:
        logger.error("FATAL: DAO_REGISTRY_ADDRESS is missing in .env")
        raise ValueError("FATAL: DAO_REGISTRY_ADDRESS is missing")
        
    # استفاده از Fallback ABI اگر در متغیرهای محیطی نبود
    registry_fallback_abi = [{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
    final_registry_abi = REGISTRY_ABI if REGISTRY_ABI else registry_fallback_abi
    
    try:
        registry_contract = w3.eth.contract(address=w3.to_checksum_address(DAO_REGISTRY_ADDRESS), abi=final_registry_abi)
        dao_key_hash = w3.keccak(text="RAYAN_CHAIN_DAO")
        
        # دریافت آدرس DAO از رجیستری
        dao_address_str = registry_contract.functions.getAddress(dao_key_hash).call()
        
        if not dao_address_str or dao_address_str == '0x' + '0' * 40:
             logger.error(f"Registry returned zero address for DAO. Check Registry at {DAO_REGISTRY_ADDRESS}")
             raise ValueError("Registry returned zero address for DAO")

        logger.info(f"✅ DAO Address found in Registry: {dao_address_str}")
        _dao_contract_instance = w3.eth.contract(address=w3.to_checksum_address(dao_address_str), abi=DAO_ABI)
        return _dao_contract_instance

    except Exception as e:
        logger.error(f"Failed to initialize DAO contract: {e}")
        raise e

def send_transaction(function_name: str, args: List[Any]) -> str | None:
    """
    ارسال تراکنش به شبکه بلاکچین با امضای دیجیتال
    """
    try:
        logger.info(f"Preparing to call '{function_name}' with args: {args}")
        dao_contract = get_dao_contract()
        func_call = getattr(dao_contract.functions, function_name)(*args)
        
        # 1. دریافت Nonce
        nonce = w3.eth.get_transaction_count(AI_ORACLE_ADDRESS)
        
        # 2. دریافت Gas Price (با مدیریت خطا برای شبکه‌های ناپایدار)
        try:
            gas_price = w3.eth.gas_price
        except Exception:
            logger.warning("Failed to fetch gas price, using default 30 Gwei")
            gas_price = w3.to_wei('30', 'gwei')

        # 3. ساخت پارامترهای تراکنش
        tx_build = func_call.build_transaction({
            'from': AI_ORACLE_ADDRESS,
            'nonce': nonce,
            'gasPrice': gas_price, 
        })
        
        # 4. تخمین گاز (با بافر اطمینان)
        try:
            estimated_gas = w3.eth.estimate_gas(tx_build)
            tx_build['gas'] = int(estimated_gas * 1.5) # 50% Buffer برای اطمینان
        except Exception as gas_err:
            logger.warning(f"Gas estimation failed ({gas_err}), using fallback limit: 3,000,000")
            tx_build['gas'] = 3000000

        # 5. امضای تراکنش
        signed_tx = w3.eth.account.sign_transaction(tx_build, private_key=AI_ORACLE_PRIVATE_KEY)
        
        # 6. رفع مشکل نسخه Web3 (rawTransaction vs raw_transaction)
        raw_tx = getattr(signed_tx, 'rawTransaction', None)
        if raw_tx is None:
            raw_tx = getattr(signed_tx, 'raw_transaction', None)
        
        if raw_tx is None:
             raise ValueError("Could not find rawTransaction attribute in signed tx object")

        # 7. ارسال تراکنش
        tx_hash = w3.eth.send_raw_transaction(raw_tx)
        logger.info(f"🚀 Transaction sent successfully! Hash: {tx_hash.hex()}")
        
        return tx_hash.hex()

    except Exception as e:
        logger.error(f"CRITICAL: Transaction failed for {function_name}: {e}")
        return None

# --- توابع عمومی ---

def update_proposal_risk_score(proposal_id: int, risk_score: int):
    """
    ارسال امتیاز ریسک به قرارداد هوشمند.
    """
    logger.info(f"Updating On-Chain Risk Score -> Proposal: {proposal_id}, Score: {risk_score}")
    # تبدیل به int جهت اطمینان از تایپ صحیح در ABI
    send_transaction('updateProposalRiskScore', [int(proposal_id), int(risk_score)])


def update_participation_score(user_address: str, score: int):
    """
    ارسال امتیاز مشارکت کاربر به قرارداد.
    """
    logger.info(f"Updating Participation Score -> User: {user_address}, Score: {score}")
    # تبدیل آدرس به فرمت Checksum
    try:
        checksum_addr = w3.to_checksum_address(user_address)
        send_transaction('updateParticipationScore', [checksum_addr, int(score)])
    except Exception as e:
        logger.error(f"Invalid address format for participation score: {user_address} - {e}")