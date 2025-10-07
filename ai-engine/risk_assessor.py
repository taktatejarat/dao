# ai-engine/risk_assessor.py - Mock AI Model for Project Risk Assessment (R(p))

import json
from typing import Dict, Any, Tuple

# Mock Model Weights (Simulating DNN/XGBoost logic)
# Weights are used to determine which feature has more impact on the final score
MOCK_WEIGHTS = {
    "startupIndustry": 0.2,       # Example: Tech has higher risk than Pharma
    "teamExperience": 0.4,        # High weight: Team is crucial in VC
    "milestoneCount": 0.1,        # More milestones = slightly lower risk
    "totalAmount": 0.3,           # Higher amount = higher risk
}
MAX_RISK_SCORE = 75  # Matches the on-chain constant

def analyze_risk(ai_features: Dict[str, Any], milestone_amounts: list) -> Tuple[int, int]:
    """
    Analyzes project risk based on provided features and returns a Risk Score and Confidence Score.
    
    Args:
        ai_features: Dictionary of features (e.g., startupIndustry, teamExperience).
        milestone_amounts: List of milestone funding amounts (for total amount calc).
        
    Returns:
        Tuple[int, int]: (Risk Score [0-100], Confidence Score [0-100])
    """
    
    # --- 1. Feature Engineering and Quantification (Simulated) ---
    
    # Simulate quantification of categorical/text data
    industry_risk = 0
    if "tech" in ai_features.get("startupIndustry", "").lower():
        industry_risk = 50 # High risk for early stage tech
    elif "pharma" in ai_features.get("startupIndustry", "").lower():
        industry_risk = 30 # Lower risk for regulated industry
    
    experience_score = 0
    if len(ai_features.get("teamExperience", "").split()) > 10:
        experience_score = 80 # Experienced team = low risk
    else:
        experience_score = 30 # Inexperienced team = high risk
        
    total_amount_usd = sum(float(amount) for amount in milestone_amounts) # Assuming amounts are RYC/USD equivalent
    
    # --- 2. Risk Calculation (Simulating DNN/Eq. 11) ---
    
    # Simple weighted risk calculation: Risk = (100 - Experience) * W + IndustryRisk * W + ...
    weighted_risk = (100 - experience_score) * MOCK_WEIGHTS["teamExperience"]
    weighted_risk += industry_risk * MOCK_WEIGHTS["startupIndustry"]
    
    # Apply a base factor and normalize to 0-100 range
    final_risk = int((weighted_risk + (total_amount_usd / 1000000) * 10) / sum(MOCK_WEIGHTS.values()))
    
    # --- 3. Confidence Score (Simulating Cold Start Problem/Eq. 12) ---
    
    confidence_score = 90 # High confidence if all data is present
    if not ai_features.get("teamExperience"):
        confidence_score = 30 # Low confidence due to missing critical feature (Cold Start)
    
    # Cap risk score to 100
    final_risk = min(max(0, final_risk), 100)
    
    return final_risk, confidence_score

if __name__ == '__main__':
    # Example usage for testing
    test_features = {
        "startupIndustry": "Deep Tech AI",
        "teamExperience": "Former Google/OpenAI employees with 10+ years of experience.",
    }
    test_amounts = ["500000", "500000", "1000000"]
    
    risk, confidence = analyze_risk(test_features, test_amounts)
    print(f"Project Risk Score: {risk}")
    print(f"Model Confidence Score: {confidence}")