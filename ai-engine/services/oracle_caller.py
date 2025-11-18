# ai-engine/oracle_caller.py - FIXED with dotenv loading

import os
import json
from web3 import Web3
from typing import Dict, Any, List

# ✅ FIX: وارد کردن تمام تنظیمات از config.py
from config import w3, AI_ORACLE_ADDRESS, AI_ORACLE_PRIVATE_KEY, DAO_REGISTRY_ADDRESS, DAO_ABI

# Local imports of AI models
from risk_assessor import analyze_risk
from score_calculator import calculate_pop_score

# --- Contract Interaction Helpers ---

def get_dao_address() -> str:
    """Fetches the main DAO contract address from the DAORegistry."""
    if not DAO_REGISTRY_ADDRESS:
        raise ValueError("DAO_REGISTRY_ADDRESS is not set.")
        
    registry_abi = json.loads('[{"constant":true,"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]')
    
    # ✅ FIX: کلید "RAYAN_CHAIN_DAO" را به صورت bytes32 صحیح ایجاد می‌کنیم
    DAO_KEY_HASH = w3.keccak(text="RAYAN_CHAIN_DAO")
    
    registry = w3.eth.contract(address=w3.to_checksum_address(DAO_REGISTRY_ADDRESS), abi=registry_abi)
    
    # ✅ FIX: ارسال مستقیم آرگومان HexBytes (bytes32)
    dao_address = registry.functions.getAddress(DAO_KEY_HASH).call()
    return dao_address

# یک  (global instance) از DAO برای جلوگیری از فراخوانی‌های تکراری
_dao_contract = None
def get_dao_contract():
    """Returns a cached instance of the DAO contract."""
    global _dao_contract
    if _dao_contract is None:
        dao_address_str = get_dao_address()
        _dao_contract = w3.eth.contract(address=w3.to_checksum_address(dao_address_str), abi=DAO_ABI)
    return _dao_contract

def send_transaction(function_name: str, args: List[Any]):
    """Generic helper to build and send a transaction from the AI Oracle."""
    dao_contract = get_dao_contract()
    func_call = getattr(dao_contract.functions, function_name)(*args)
    
    try:
        # ساخت تراکنش با مدیریت nonce
        tx = func_call.build_transaction({
            'from': AI_ORACLE_ADDRESS,
            'nonce': w3.eth.get_transaction_count(AI_ORACLE_ADDRESS),
            'gasPrice': w3.eth.gas_price,
        })
        
        # تخمین و تنظیم گاز
        estimated_gas = w3.eth.estimate_gas(tx)
        tx['gas'] = int(estimated_gas * 1.2) # افزودن 20% بافر
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=AI_ORACLE_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        print(f"Sent {function_name} transaction. Hash: {tx_hash.hex()}")
        w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Transaction confirmed: {function_name}")
        return tx_hash.hex()

    except Exception as e:
        print(f"ERROR sending transaction for {function_name}: {e}")
        return None

# --- Core AI Oracle Functions ---


def update_proposal_risk_score(proposal_id: int, risk_score: int):
    """فقط امتیاز ریسک را به قرارداد هوشمند ارسال می‌کند."""
    print(f"Oracle Caller: Sending risk score {risk_score} for proposal {proposal_id}.")
    send_transaction('updateProposalRiskScore', [proposal_id, risk_score])

def update_participation_score(user_address: str, pop_score: int):
    """فقط امتیاز مشارکت را به قرارداد هوشمند ارسال می‌کند."""
    print(f"Oracle Caller: Sending PoP score {pop_score} for user {user_address}.")
    send_transaction('updateParticipationScore', [w3.to_checksum_address(user_address), pop_score])