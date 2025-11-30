# ai-engine/layers/layer_5_integration.py

def generate_xai_report(financial_report: dict, investability_score: float) -> dict:
    """
    تولید گزارش متنی بر اساس امتیاز نهایی (Investability Score).
    Investability: 0 (Bad) -> 100 (Good)
    """
    xai_factors = financial_report.get('xai_factors', [])
    
    strengths = []
    weaknesses = []
    key_decision_factors = []

    # تبدیل فاکتورها
    if xai_factors:
        for factor in xai_factors:
            key_decision_factors.append({
                "key": factor['key'],
                "values": factor.get('values', {}),
                "importance": factor.get('importance', 0)
            })

    # منطق یکپارچه: استفاده از investability_score برای تعیین متن‌ها
    # امتیاز بالای 80 = عالی (ریسک پایین)
    if investability_score >= 80:
        recommendation_key = "recommendation.low_risk"
        strengths.append({"key": "xai.strength.high_score"})
    
    # امتیاز بین 60 تا 80 = متوسط (ریسک متوسط)
    elif investability_score >= 60:
        recommendation_key = "recommendation.medium_risk"
        # بررسی دقیق‌تر برای پیدا کردن ضعف
        if financial_report.get('risk_score', 0) > 40:
            weaknesses.append({"key": "xai.weakness.financial_uncertainty"})
    
    # امتیاز زیر 60 = ضعیف (ریسک بالا)
    else:
        recommendation_key = "recommendation.high_risk"
        weaknesses.append({"key": "xai.weakness.general_risk"})

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "key_decision_factors": key_decision_factors,
        "recommendation_key": recommendation_key
    }

def generate_final_investability_score(financial_report: dict, security_report: dict) -> dict:
    weights = {"financial": 0.7, "security": 0.3}

    # تبدیل ریسک مالی (100=بد) به امتیاز مثبت (100=خوب)
    financial_score = 100 - financial_report.get('risk_score', 50)
    security_score = security_report.get('trust_score', 50)

    # محاسبه امتیاز نهایی
    investability_score = (financial_score * weights['financial']) + (security_score * weights['security'])
    investability_score = round(investability_score)

    # تعیین سطح ریسک (دقیقاً هماهنگ با بازه‌های بالا)
    if investability_score >= 80:
        overall_risk_level_key = "risk_level.low"       # سبز
    elif investability_score >= 60:
        overall_risk_level_key = "risk_level.medium"    # زرد
    elif investability_score >= 40:
        overall_risk_level_key = "risk_level.high"      # نارنجی
    else:
        overall_risk_level_key = "risk_level.very_high" # قرمز
    
    # پاس دادن امتیاز نهایی به تابع گزارش‌ساز
    xai_report = generate_xai_report(financial_report, investability_score)

    return {
        "investability_score": investability_score,
        "overall_risk_level_key": overall_risk_level_key,
        "xai_report": xai_report
    }