# ai-engine/services/oracle_caller.py - FULL & ROBUST VERSION

from typing import List, Any
from web3 import Web3
# ایمپورت کانفیگ و لاگر
from config import w3, AI_ORACLE_ADDRESS, AI_ORACLE_PRIVATE_KEY, DAO_REGISTRY_ADDRESS, DAO_ABI, REGISTRY_ABI
from logger_config import logger 

# متغیر سراسری برای نگهداری کانکشن قرارداد (Singleton)
_dao_contract_instance = None

def get_dao_contract():
    """
    آدرس قرارداد DAO را از رجیستری می‌خواند و آبجکت قرارداد را می‌سازد.
    """
    global _dao_contract_instance
    if _dao_contract_instance:
        return _dao_contract_instance

    if not DAO_REGISTRY_ADDRESS:
        logger.error("FATAL: DAO_REGISTRY_ADDRESS is missing in .env")
        raise ValueError("DAO_REGISTRY_ADDRESS is missing")
        
    # ABI پیش‌فرض رجیستری (فقط تابع getAddress)
    registry_fallback_abi = [{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]
    
    # استفاده از ABI فایل کانفیگ یا فال‌بک
    final_registry_abi = REGISTRY_ABI if REGISTRY_ABI else registry_fallback_abi
    
    try:
        # اتصال به قرارداد Registry
        registry_contract = w3.eth.contract(address=w3.to_checksum_address(DAO_REGISTRY_ADDRESS), abi=final_registry_abi)
        
        # محاسبه هش کلید 'RAYAN_CHAIN_DAO'
        dao_key_hash = w3.keccak(text="RAYAN_CHAIN_DAO")
        
        # دریافت آدرس DAO
        dao_address_str = registry_contract.functions.getAddress(dao_key_hash).call()
        
        # بررسی معتبر بودن آدرس
        if not dao_address_str or dao_address_str == '0x' + '0' * 40:
             logger.error(f"Registry returned zero address for DAO. Check Registry at {DAO_REGISTRY_ADDRESS}")
             raise ValueError("Registry returned zero address for DAO")

        logger.info(f"✅ DAO Address found in Registry: {dao_address_str}")
        
        # ساخت آبجکت قرارداد DAO
        _dao_contract_instance = w3.eth.contract(address=w3.to_checksum_address(dao_address_str), abi=DAO_ABI)
        return _dao_contract_instance

    except Exception as e:
        logger.error(f"Failed to initialize DAO contract: {e}")
        raise e

def send_transaction(function_name: str, args: List[Any]) -> str | None:
    """
    ارسال تراکنش به شبکه بلاکچین با امضای دیجیتال و مدیریت خطا.
    """
    try:
        logger.info(f"Preparing to call '{function_name}' with args: {args}")
        
        dao_contract = get_dao_contract()
        
        # آماده‌سازی تابع
        if not hasattr(dao_contract.functions, function_name):
            raise ValueError(f"Function '{function_name}' not found in DAO ABI.")
            
        func_call = getattr(dao_contract.functions, function_name)(*args)
        
        # 1. دریافت Nonce
        nonce = w3.eth.get_transaction_count(AI_ORACLE_ADDRESS)
        
        # 2. دریافت Gas Price (با فال‌بک)
        try:
            gas_price = w3.eth.gas_price
        except Exception:
            logger.warning("Failed to fetch gas price from node, using default 35 Gwei")
            gas_price = w3.to_wei('35', 'gwei')

        # 3. ساخت اولیه تراکنش
        tx_build = func_call.build_transaction({
            'from': AI_ORACLE_ADDRESS,
            'nonce': nonce,
            'gasPrice': gas_price, 
        })
        
        # 4. تخمین گاز (با 50% اطمینان بیشتر برای جلوگیری از OutOfGas)
        try:
            estimated_gas = w3.eth.estimate_gas(tx_build)
            tx_build['gas'] = int(estimated_gas * 1.5) 
        except Exception as gas_err:
            logger.warning(f"Gas estimation failed ({gas_err}), using safe fallback: 5,000,000")
            tx_build['gas'] = 5000000

        # 5. امضای تراکنش
        if not AI_ORACLE_PRIVATE_KEY:
            raise ValueError("Private Key is missing in .env")
            
        signed_tx = w3.eth.account.sign_transaction(tx_build, private_key=AI_ORACLE_PRIVATE_KEY)
        
        # 6. استخراج بایت‌های خام تراکنش (رفع باگ نسخه‌های مختلف Web3)
        raw_tx = None
        if hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        elif hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        elif isinstance(signed_tx, dict) and 'rawTransaction' in signed_tx:
            raw_tx = signed_tx['rawTransaction']
        
        if raw_tx is None:
             raise ValueError(f"Could not extract raw transaction bytes from signed object: {type(signed_tx)}")

        # 7. ارسال نهایی
        tx_hash_bytes = w3.eth.send_raw_transaction(raw_tx)
        tx_hash_hex = tx_hash_bytes.hex()
        
        logger.info(f"🚀 Transaction sent successfully! Hash: {tx_hash_hex}")
        return tx_hash_hex

    except Exception as e:
        logger.error(f"CRITICAL: Transaction failed for {function_name}: {e}")
        # برای دیباگ بهتر، خطا را در کنسول هم چاپ می‌کنیم
        print(f"!!! ORACLE ERROR !!! {e}")
        return None

# --- توابع عمومی (Public Methods) ---

def update_proposal_risk_score(proposal_id: int, risk_score: int):
    """
    ارسال امتیاز ریسک هوش مصنوعی به قرارداد هوشمند.
    """
    logger.info(f"Updating On-Chain Risk Score -> Proposal ID: {proposal_id}, Score: {risk_score}")
    # اطمینان از تایپ صحیح ورودی‌ها
    send_transaction('updateProposalRiskScore', [int(proposal_id), int(risk_score)])


def update_participation_score(user_address: str, score: int):
    """
    ارسال امتیاز مشارکت (PoP) کاربر به قرارداد.
    """
    logger.info(f"Updating Participation Score -> User: {user_address}, Score: {score}")
    try:
        # تبدیل آدرس به فرمت Checksum (حروف بزرگ و کوچک استاندارد)
        checksum_addr = w3.to_checksum_address(user_address)
        send_transaction('updateParticipationScore', [checksum_addr, int(score)])
    except Exception as e:
        logger.error(f"Invalid address format for participation score: {user_address} - {e}")


def check_and_execute_proposal(proposal_id: int):
    """
    بررسی و نهایی‌سازی وضعیت پروپوزال در بلاکچین.
    این تابع سعی می‌کند تابع executeProposal را صدا بزند.
    اگر پروپوزال شرایط اجرا را داشته باشد (زمان تمام شده + رأی کافی)، وضعیت آن تغییر می‌کند.
    """
    try:
        logger.info(f"🤖 Observer: Checking proposal {proposal_id} for execution...")
        
        # فراخوانی تابع executeProposal در قرارداد
        # نکته: در قراردادهای استاندارد، اگر زمان نرسیده باشد یا رأی کافی نباشد، این تراکنش Revert می‌شود.
        # ما فقط تراکنش را می‌فرستیم، منطق قرارداد تصمیم می‌گیرد.
        tx_hash = send_transaction('executeProposal', [int(proposal_id)])
        
        if tx_hash:
            logger.info(f"✅ Observer: Execution transaction sent for Proposal {proposal_id}: {tx_hash}")
            return True
        return False

    except Exception as e:
        # اگر خطا داد (مثلاً هنوز زمانش نرسیده)، فقط لاگ می‌کنیم و برنامه متوقف نمی‌شود
        if "execution reverted" in str(e).lower():
            logger.debug(f"Proposal {proposal_id} not ready for execution yet.")
        else:
            logger.error(f"Observer Error for proposal {proposal_id}: {e}")
        return False
