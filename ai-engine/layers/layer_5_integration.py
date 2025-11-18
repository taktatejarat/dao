# ai-engine/layers/layer_5_integration.py

def generate_final_investability_score(financial_report: dict, security_report: dict) -> dict:
    """
    خروجی‌های لایه‌های مختلف را برای تولید امتیاز نهایی ترکیب می‌کند.
    """
    weights = {"financial": 0.7, "security": 0.3}

    financial_score = 100 - financial_report.get('risk_score', 50)
    security_score = security_report.get('trust_score', 50)

    investability_score = (financial_score * weights['financial']) + (security_score * weights['security'])

    risk_level = "Medium"
    if investability_score < 40: risk_level = "Very High"
    elif investability_score < 60: risk_level = "High"
    elif investability_score > 85: risk_level = "Low"

    return {
        "investability_score": round(investability_score),
        "overall_risk_level": risk_level,
        "ai_recommendation": f"Investment with {risk_level.lower()} risk profile."
    }