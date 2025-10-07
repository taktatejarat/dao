# ai-engine/oracle_caller.py - FIXED with dotenv loading

import os
import json
import time
from web3 import Web3
from typing import Dict, Any, List
from dotenv import load_dotenv # ✅ NEW: Import dotenv

# Local imports of your AI models
from risk_assessor import analyze_risk # R(p)
from score_calculator import calculate_pop_score # B(u)

# --- Configuration (Matching your .env names) ---
# Now these will be loaded from the .env file!
RPC_URL = os.environ.get("AMOY_RPC_URL")
AI_ORACLE_PRIVATE_KEY = os.environ.get("AI_ORACLE_PRIVATE_KEY") 
DAO_REGISTRY_ADDRESS = os.environ.get("NEXT_PUBLIC_REGISTRY_ADDRESS")
DAO_ABI = json.loads(os.environ.get("RAYAN_CHAIN_DAO_ABI", "[]"))


# For the DAO ABI, we assume you have stored it in a configuration file or a dedicated environment variable
# Since your project uses Node.js/TypeScript, you need to manually copy the DAO ABI JSON here for Python.
# For this mock, we assume the ABI is available in an environment variable RAYAN_CHAIN_DAO_ABI.
# In production, you would load this from a JSON file.
try:
    DAO_ABI = json.loads(os.environ.get("RAYAN_CHAIN_DAO_ABI", "[]"))
except json.JSONDecodeError:
    DAO_ABI = [] # Fallback to empty ABI
    
if not RPC_URL or not AI_ORACLE_PRIVATE_KEY or not DAO_REGISTRY_ADDRESS:
    raise EnvironmentError("Missing AI Oracle configuration. Ensure AMOY_RPC_URL, AI_ORACLE_PRIVATE_KEY, and NEXT_PUBLIC_REGISTRY_ADDRESS are set in your Python environment.")

# --- Web3 Setup ---
# Use the correct RPC URL from your environment
w3 = Web3(Web3.HTTPProvider(RPC_URL))
# For Amoy (Polygon PoS), you might need to check if the middleware is needed based on your node
# w3.middleware_onion.inject(geth_poa_middleware, layer=0) 

AI_ORACLE_ADDRESS = w3.eth.account.from_key(AI_ORACLE_PRIVATE_KEY).address

# --- Contract Interaction Helpers ---

def get_dao_address(registry_address: str) -> str:
    """Fetches the main DAO contract address from the DAORegistry."""
    registry_abi = [
        {"constant":True,"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":False,"stateMutability":"view","type":"function"}
    ]
    # NOTE: REGISTRY_KEYS.DAO (keccak256("RAYAN_CHAIN_DAO"))
    DAO_KEY_HASH = Web3.keccak(text="RAYAN_CHAIN_DAO").hex() 
    
    registry = w3.eth.contract(address=w3.to_checksum_address(registry_address), abi=registry_abi)
    # The result of getAddress is an address string
    dao_address = registry.functions.getAddress(bytes.fromhex(DAO_KEY_HASH[2:])).call() 
    return dao_address

def send_transaction(dao_contract, function_name: str, args: List[Any]):
    """Generic helper to build and send a transaction from the AI Oracle."""
    
    # ⚠️ Check ABI existence before calling
    if not DAO_ABI:
        print("ERROR: DAO ABI is missing. Cannot send on-chain transaction.")
        return None
        
    func_call = dao_contract.functions[function_name](*args)
    
    # Estimate gas (important for PoS networks)
    try:
        estimated_gas = func_call.estimate_gas({'from': AI_ORACLE_ADDRESS})
    except Exception as e:
        print(f"Gas estimation failed for {function_name}: {e}")
        estimated_gas = 300000 # Fallback gas limit

    # Build transaction
    tx = func_call.build_transaction({
        'from': AI_ORACLE_ADDRESS,
        'nonce': w3.eth.get_transaction_count(AI_ORACLE_ADDRESS),
        'gas': estimated_gas + 50000, # Add a buffer
        'gasPrice': w3.eth.gas_price,
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=AI_ORACLE_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"Sent {function_name} transaction. Hash: {tx_hash.hex()}")
    w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction confirmed: {function_name}")
    return tx_hash.hex()


# --- Core AI Oracle Functions ---

def update_proposal_risk(proposal_id: int, ai_features: Dict[str, Any], milestone_amounts: List[str]):
    """Calculates risk and sends the score to the DAO contract."""
    dao_address_str = get_dao_address(DAO_REGISTRY_ADDRESS)
    dao_contract = w3.eth.contract(address=w3.to_checksum_address(dao_address_str), abi=DAO_ABI)
    
    # 1. Calculate Risk (Using local AI model)
    risk_score, confidence_score = analyze_risk(ai_features, milestone_amounts)
    
    # NOTE: You can add logic here to only update the score if confidence is high, 
    # but for now, we send it regardless, allowing the DAO to use the score.
    
    print(f"Proposal {proposal_id} Risk: {risk_score}, Confidence: {confidence_score}")
    
    # 2. Send Score On-Chain (Uses AI_ORACLE_ROLE)
    send_transaction(
        dao_contract,
        'updateProposalRiskScore',
        [proposal_id, risk_score]
    )

def update_user_pop_score(user_address: str, user_history: Dict[str, Any]):
    """Calculates PoP score and sends it to the DAO contract."""
    dao_address_str = get_dao_address(DAO_REGISTRY_ADDRESS)
    dao_contract = w3.eth.contract(address=w3.to_checksum_address(dao_address_str), abi=DAO_ABI)
    
    # 1. Calculate PoP Score (Using local AI model)
    pop_score = calculate_pop_score(user_address, user_history)
    
    print(f"User {user_address} PoP Score: {pop_score}")

    # 2. Send Score On-Chain (Uses AI_ORACLE_ROLE)
    send_transaction(
        dao_contract,
        'updateParticipationScore',
        [w3.to_checksum_address(user_address), pop_score]
    )


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