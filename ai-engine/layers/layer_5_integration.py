# ai-engine/layers/layer_5_integration.py (منطق اصلاح شده و هماهنگ)

def generate_xai_report(financial_report: dict, investability_score: float) -> dict:
    """
    تولید گزارش متنی XAI بر اساس امتیاز نهایی سرمایه‌گذاری.
    ما از investability_score استفاده می‌کنیم تا با سطح ریسک کلی هماهنگ باشد.
    Investability: 0 (Bad) -> 100 (Good)
    """
    xai_factors = financial_report.get('xai_factors', [])
    team_score = financial_report.get('team_competency_score', 0)

    strengths = []
    weaknesses = []
    key_decision_factors = []

    # تحلیل نقاط قوت و ضعف (مستقل از امتیاز کلی)
    if team_score > 75: strengths.append({"key": "xai.strength.strong_team"})
    elif team_score < 40: weaknesses.append({"key": "xai.weakness.inexperienced_team"})
        
    # تبدیل امتیاز مالی به ریسک برای متن‌ها
    financial_risk = financial_report.get('risk_score', 50)
    if financial_risk < 30: strengths.append({"key": "xai.strength.strong_financials"})
    elif financial_risk > 70: weaknesses.append({"key": "xai.weakness.high_financial_risk"})
    
    if xai_factors:
        for factor in xai_factors:
            key_decision_factors.append({
                "key": factor['key'],
                "values": factor.get('values', {}),
                "importance": factor.get('importance', 0)
            })

    # ✅✅✅ FIX: هماهنگ‌سازی منطق توصیه با سطح ریسک کلی ✅✅✅
    # منطق قبلی بر اساس risk_score بود که معکوس investability_score است و باعث تداخل می‌شد.
    # الان همه چیز بر اساس investability_score (امتیاز قابلیت سرمایه‌گذاری) سنجیده می‌شود.
    
    if investability_score >= 80:
        recommendation_key = "recommendation.low_risk"      # ریسک پایین (امتیاز بالا)
    elif investability_score >= 60:
        recommendation_key = "recommendation.medium_risk"   # ریسک متوسط
    else:
        recommendation_key = "recommendation.high_risk"     # ریسک بالا (امتیاز پایین)

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "key_decision_factors": key_decision_factors,
        "recommendation_key": recommendation_key
    }

def generate_final_investability_score(financial_report: dict, security_report: dict) -> dict:
    """
    خروجی‌های لایه‌های مختلف را برای تولید امتیاز نهایی ترکیب می‌کند.
    """
    weights = {"financial": 0.7, "security": 0.3}

    # تبدیل ریسک مالی (0=خوب، 100=بد) به امتیاز مثبت (0=بد، 100=خوب)
    financial_score = 100 - financial_report.get('risk_score', 50)
    security_score = security_report.get('trust_score', 50)

    # امتیاز نهایی (0 تا 100) -> هر چه بیشتر باشد، ریسک کمتر است
    investability_score = (financial_score * weights['financial']) + (security_score * weights['security'])
    investability_score = round(investability_score)

    # ✅✅✅ FIX: تعریف دقیق بازه‌ها برای تگ "سطح ریسک" ✅✅✅
    if investability_score >= 80:
        overall_risk_level_key = "risk_level.low"       # سبز
    elif investability_score >= 60:
        overall_risk_level_key = "risk_level.medium"    # زرد
    elif investability_score >= 40:
        overall_risk_level_key = "risk_level.high"      # نارنجی
    else:
        overall_risk_level_key = "risk_level.very_high" # قرمز
    
    # تولید گزارش متنی با استفاده از همان امتیاز برای هماهنگی کامل
    xai_report = generate_xai_report(financial_report, investability_score)

    return {
        "investability_score": investability_score,
        "overall_risk_level_key": overall_risk_level_key,
        "xai_report": xai_report
    }