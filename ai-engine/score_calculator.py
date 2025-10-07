# ai-engine/score_calculator.py - Mock AI Model for User Behavior Analysis (B(u) / PoP Score)

from typing import Dict, Any, Optional

# Mock weights for Participation Score (Simulating XGBoost/Eq. 13)
POP_WEIGHTS = {
    "num_votes_cast": 0.4,        # High weight for active voting
    "vote_accuracy_rate": 0.3,    # High weight for voting on successful/low-risk proposals
    "delegated_power": 0.2,       # Weight for reputation/trust
    "time_since_last_vote_days": -0.1, # Penalty for inactivity
}

def calculate_pop_score(user_address: str, user_history: Dict[str, Any]) -> int:
    """
    Calculates the Proof of Participation (PoP) Score for a user based on their historical activity.
    The score should be a normalized value, e.g., between 0 and 1000 (matching RayanChainDAO.sol).
    
    Args:
        user_address: The wallet address of the user.
        user_history: Dictionary of on-chain and off-chain data (e.g., vote history, stake time).
        
    Returns:
        int: The normalized PoP Score (e.g., 0-1000).
    """
    
    # --- 1. Feature Extraction (Simulated) ---
    num_votes = user_history.get("num_votes_cast", 0)
    success_rate = user_history.get("vote_accuracy_rate", 0.5) # Default to 50%
    delegated_stake = user_history.get("delegated_power", 0) / 1e18 # Normalize stake
    inactivity_days = user_history.get("time_since_last_vote_days", 0)

    # --- 2. Score Calculation (Simulating XGBoost/Eq. 13) ---
    
    # Base score determined by number of votes
    base_score = min(num_votes * 100, 500) # Max 500 points from volume
    
    # Quality of vote: Max 300 points from accuracy
    quality_score = int(success_rate * 300)
    
    # Reputation score: Max 200 points from delegated power (trust)
    reputation_score = min(int(delegated_stake / 100000 * 200), 200) # Assuming 100k RYC = max rep score
    
    # Inactivity penalty
    inactivity_penalty = min(inactivity_days * 5, 200)
    
    pop_score = base_score + quality_score + reputation_score - inactivity_penalty
    
    # --- 3. Normalization ---
    
    # Normalize to a 0-1000 range (The range the smart contract expects)
    normalized_pop = min(max(0, pop_score), 1000)

    return normalized_pop

if __name__ == '__main__':
    # Example usage for testing
    test_user_history = {
        "num_votes_cast": 15,
        "vote_accuracy_rate": 0.85, # 85% of votes were on successful proposals
        "delegated_power": 50000000000000000000000, # 50,000 RYC
        "time_since_last_vote_days": 10,
    }
    
    score = calculate_pop_score("0xTestUserAddress", test_user_history)
    print(f"User Participation Score (PoP): {score}/1000")