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

# یک نمونه全局 (global instance) از DAO برای جلوگیری از فراخوانی‌های تکراری
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

def update_proposal_risk(proposal_id: int, ai_features: Dict[str, Any], milestone_amounts: List[str]):
    """Calculates risk and sends the score to the DAO contract."""
    risk_score, confidence_score = analyze_risk(ai_features, milestone_amounts)
    print(f"Proposal {proposal_id} Risk: {risk_score}, Confidence: {confidence_score}")
    send_transaction('updateProposalRiskScore', [proposal_id, risk_score])

def update_user_pop_score(user_address: str, user_history: Dict[str, Any]):
    """Calculates PoP score and sends it to the DAO contract."""
    pop_score = calculate_pop_score(user_address, user_history)
    print(f"User {user_address} PoP Score: {pop_score}")
    send_transaction('updateParticipationScore', [w3.to_checksum_address(user_address), pop_score])

# --- Mock Execution for Testing ---
if __name__ == '__main__':
    print("--- AI Oracle (AIPoX) Mock Run ---")
    
    # IMPORTANT: You must ensure these variables are exported in your terminal 
    # before running this script:
    # export AMOY_RPC_URL="<Your Amoy RPC URL>"
    # export AI_ORACLE_PRIVATE_KEY="<Private Key of the AI Oracle Address>"
    # export NEXT_PUBLIC_REGISTRY_ADDRESS="<Your DAORegistry Address>"
    # export RAYAN_CHAIN_DAO_ABI='<Full JSON ABI of RayanChainDAO.sol>'
    
    mock_proposal_id = 1
    mock_ai_features = {
        "startupIndustry": "Deep Tech AI",
        "teamExperience": "Ex-FAANG with 10+ years.",
    }
    mock_milestone_amounts = ["500000", "500000", "1000000"]

    mock_user_history = {
        "num_votes_cast": 15,
        "vote_accuracy_rate": 0.85, 
        "delegated_power": 50000000000000000000000, # 50,000 RYC
        "time_since_last_vote_days": 10,
    }
    
    try:
        # 1. Update Proposal Risk Score
        update_proposal_risk(mock_proposal_id, mock_ai_features, mock_milestone_amounts)
        
        # 2. Update User PoP Score
        # For a real test, replace mock_user_address with a user who has staked tokens.
        update_user_pop_score(AI_ORACLE_ADDRESS, mock_user_history) 
        
    except EnvironmentError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"An error occurred during Oracle execution: {e}")