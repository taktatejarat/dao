# ai-engine/layers/layer_5_integration.py

def generate_xai_report(financial_report: dict, investability_score: float) -> dict:
    raw_factors = financial_report.get('xai_factors', [])
    
    strengths = []
    weaknesses = []
    
    for f in raw_factors:
        item = {"key": f["key"], "values": f.get("values", {})}
        if f.get("type") == "strength":
            strengths.append(item)
        else:
            weaknesses.append(item)

    if investability_score >= 80:
        rec_key = "recommendation.low_risk"
    elif investability_score >= 60:
        rec_key = "recommendation.medium_risk"
    else:
        rec_key = "recommendation.high_risk"

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "key_decision_factors": strengths + weaknesses,
        "recommendation_key": rec_key
    }

def generate_final_investability_score(financial_report: dict, security_report: dict) -> dict:
    # 1. دریافت امتیازات هوشمند
    risk_score = financial_report.get('risk_score', 50)
    trust_score = security_report.get('trust_score', 50)
    
    # کیفیت مالی = 100 - ریسک
    financial_quality = 100 - risk_score
    
    # 2. محاسبه نهایی (70% مالی، 30% امنیت)
    final_score = int((financial_quality * 0.7) + (trust_score * 0.3))
    
    # 3. تعیین سطح
    if final_score >= 80: risk_level = "risk_level.low"
    elif final_score >= 60: risk_level = "risk_level.medium"
    elif final_score >= 40: risk_level = "risk_level.high"
    else: risk_level = "risk_level.very_high"

    # 4. تولید متن
    xai_report = generate_xai_report(financial_report, final_score)

    return {
        "investability_score": final_score,
        "overall_risk_level_key": risk_level,
        
        # انتقال تمام جزییات برای نمایش در داشبورد
        "risk_score": risk_score,
        "success_probability": financial_report.get('success_probability'),
        "team_competency_score": financial_report.get('team_competency_score'),
        "market_sentiment_score": financial_report.get('market_sentiment_score'),
        "proposer_trust_score": trust_score,
        
        "xai_report": xai_report
    }