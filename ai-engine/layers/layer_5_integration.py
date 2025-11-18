# ai-engine/layers/layer_5_integration.py (نسخه نهایی و کامل)


def generate_xai_report(financial_report: dict) -> dict:
    risk_score = financial_report.get('risk_score', 100)
    team_score = financial_report.get('team_competency_score', 0)
    xai_factors = financial_report.get('xai_factors', [])

    strengths = []
    weaknesses = []
    # ✅✅✅ NEW: یک لیست جدید برای فاکتورهای کلیدی ✅✅✅
    key_decision_factors = []

    # تحلیل نقاط قوت و ضعف (این بخش می‌تواند باقی بماند)
    if team_score > 75: strengths.append({"key": "xai.strength.strong_team"})
    elif team_score < 40: weaknesses.append({"key": "xai.weakness.inexperienced_team"})
        
    if risk_score < 30: strengths.append({"key": "xai.strength.strong_financials"})
    elif risk_score > 70: weaknesses.append({"key": "xai.weakness.high_financial_risk"})
    
    # ✅✅✅ THE FIX IS HERE: پیمایش تمام فاکتورها به جای فقط اولین مورد ✅✅✅
    if xai_factors:
        for factor in xai_factors:
            # ما هر فاکتور را با کلید ترجمه و مقادیرش به لیست جدید اضافه می‌کنیم
            key_decision_factors.append({
                "key": factor['key'],
                "values": factor.get('values', {}),
                "importance": factor.get('importance', 0)
            })

    # تولید توصیه داینامیک
    if risk_score > 65: recommendation_key = "recommendation.high_risk"
    elif risk_score > 40: recommendation_key = "recommendation.medium_risk"
    else: recommendation_key = "recommendation.low_risk"

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "key_decision_factors": key_decision_factors, # ✅ NEW: ارسال لیست جدید به خروجی
        "recommendation_key": recommendation_key
    }

# یک تابع کمکی برای جایگزینی متغیرها
def tVar(key: str, values: dict) -> str:
    # این یک پیاده‌سازی ساده برای نمایش است
    # مثال: "xai.feature.industry" با "Industry: AI"
    base_string = key.split('.')[-1].replace('_', ' ').title()
    if values and 'value' in values:
        return f"{base_string}: {values['value']}"
    return base_string

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