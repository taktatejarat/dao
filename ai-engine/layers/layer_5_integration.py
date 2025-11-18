# ai-engine/layers/layer_5_integration.py (نسخه نهایی و کامل)

def generate_xai_report(financial_report: dict) -> dict:
    """
    یک گزارش متنی توضیحی (XAI) و توصیه داینامیک بر اساس کلیدهای i18n تولید می‌کند.
    """
    risk_score = financial_report.get('risk_score', 100)
    team_score = financial_report.get('team_competency_score', 0)
    xai_factors = financial_report.get('xai_factors', [])

    strengths = []
    weaknesses = []

    # تحلیل نقاط قوت و ضعف
    if team_score > 75: strengths.append({"key": "xai.strength.strong_team"})
    elif team_score < 40: weaknesses.append({"key": "xai.weakness.inexperienced_team"})
        
    if risk_score < 30: strengths.append({"key": "xai.strength.strong_financials"})
    elif risk_score > 70: weaknesses.append({"key": "xai.weakness.high_financial_risk"})
    
    # افزودن فاکتورهای تأثیرگذار از مدل
    for factor in xai_factors:
        # مثال: "Industry: AI"
        feature_display = factor['feature'].replace("_", ": ").title()
        strengths.append({"key": "xai.strength.top_factor", "values": {"factor": feature_display}})

    # تولید توصیه داینامیک
    if risk_score > 65: recommendation_key = "recommendation.high_risk"
    elif risk_score > 40: recommendation_key = "recommendation.medium_risk"
    else: recommendation_key = "recommendation.low_risk"

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendation_key": recommendation_key
    }

def generate_final_investability_score(financial_report: dict, security_report: dict) -> dict:
    """
    خروجی‌های لایه‌های مختلف را برای تولید امتیاز نهایی و گزارش کامل ترکیب می‌کند.
    """
    weights = {"financial": 0.7, "security": 0.3}

    financial_score = 100 - financial_report.get('risk_score', 50)
    security_score = security_report.get('trust_score', 50)

    investability_score = (financial_score * weights['financial']) + (security_score * weights['security'])
    
    risk_level_key = "risk_level.medium"
    if investability_score < 40: risk_level_key = "risk_level.very_high"
    elif investability_score < 60: risk_level_key = "risk_level.high"
    elif investability_score > 85: risk_level_key = "risk_level.low"
    
    xai_report = generate_xai_report(financial_report)

    return {
        "investability_score": round(investability_score),
        "overall_risk_level_key": risk_level_key,
        "xai_report": xai_report
    }