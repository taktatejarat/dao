# ai-engine/layers/layer_3_financial.py - PROFESSIONAL GRADE ANALYSIS

import os
import math
import joblib
import pandas as pd
import xgboost as xgb
from logger_config import logger

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'models', 'risk_model.json')
PREPROCESSOR_PATH = os.path.join(BASE_DIR, '..', 'models', 'preprocessor.joblib')

class FinancialModelHandler:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.load_models()

    def load_models(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = xgb.Booster()
                self.model.load_model(MODEL_PATH)
            except Exception as e:
                logger.error(f"Failed to load XGBoost: {e}")
        
        if os.path.exists(PREPROCESSOR_PATH):
            try:
                self.preprocessor = joblib.load(PREPROCESSOR_PATH)
            except Exception:
                pass

    def predict_success_prob(self, features: dict):
        """پیش‌بینی احتمال موفقیت با مدل یادگیری ماشین"""
        if not self.model or not self.preprocessor:
            return 0.5 
        try:
            df = pd.DataFrame([{
                'industry': features.get('industry', 'Other'),
                'requested_amount_usd': features.get('requested_amount', 0),
                'milestone_count': features.get('milestone_count', 1),
                'team_experience_years': features.get('team_experience', 1)
            }])
            processed = self.preprocessor.transform(df)
            return float(self.model.predict(xgb.DMatrix(processed))[0])
        except Exception:
            return 0.5

ai_engine = FinancialModelHandler()

def safe_float(v):
    try: return float(str(v).replace(',', '')) if v not in [None, '', 'undefined'] else 0.0
    except: return 0.0

def calculate_team_score(data):
    """محاسبه شایستگی تیم (0-100)"""
    score = 50 # پایه
    exp = safe_float(data.get('teamExperienceYears'))
    size = safe_float(data.get('teamSize'))
    linkedin = data.get('linkedinProfile', '')

    # تجربه
    if exp > 10: score += 20
    elif exp > 5: score += 10
    elif exp < 2: score -= 10

    # سایز تیم
    if 2 <= size <= 10: score += 10
    elif size == 1: score -= 5 # Solo founder risk

    # حضور آنلاین
    if linkedin and 'linkedin.com' in linkedin: score += 10
    
    # نوع دانش بنیان
    kb_type = data.get('knowledgeBasedType', 'none')
    if kb_type in ['type1', 'creative']: score += 10

    return min(100, max(0, score))

def calculate_market_score(data, market_stats):
    """محاسبه جذابیت بازار (0-100)"""
    score = 50
    tam = safe_float(market_stats.get('tam'))
    sam = safe_float(market_stats.get('sam'))
    competitors = market_stats.get('competitors', '')
    
    # اندازه بازار
    if tam > 1_000_000_000: score += 20 # Unicorn potential
    elif tam > 100_000_000: score += 10
    elif tam < 1_000_000: score -= 10 # Niche/Small
    
    # واقع‌گرایی (SAM نباید بزرگتر از TAM باشد)
    if sam > tam: score -= 20
    
    # تحلیل رقبا (متنی)
    if len(competitors) > 50: score += 10 # Well researched
    elif len(competitors) < 5: score -= 10 # No research
    
    return min(100, max(0, score))

def generate_financial_report(proposal_data: dict) -> dict:
    market = proposal_data.get('marketStats', {})
    financials = proposal_data.get('financialStats', {})
    milestones = proposal_data.get('milestones', [])
    
    # --- 1. استخراج و نرمال‌سازی داده‌ها ---
    raw_ind = proposal_data.get('startupIndustry', 'Other')
    valid_inds = ['Software', 'Biotechnology', 'Mobile', 'E-Commerce', 'Enterprise']
    industry = raw_ind if raw_ind in valid_inds else 'Other'

    requested_amount = sum([safe_float(m.get('amount')) for m in milestones])
    team_exp = safe_float(proposal_data.get('teamExperienceYears'))
    burn_rate = safe_float(financials.get('burnRate'))
    revenue = safe_float(financials.get('revenueProj'))
    
    # --- 2. محاسبات تحلیلی (Heuristics) ---
    team_score = calculate_team_score(proposal_data)
    market_score = calculate_market_score(proposal_data, market)
    
    # پیش‌بینی ML
    ml_success_prob = ai_engine.predict_success_prob({
        'industry': industry,
        'requested_amount': requested_amount,
        'milestone_count': len(milestones),
        'team_experience': team_exp
    })

    # ترکیب امتیاز نهایی: 40% مدل ML + 30% تیم + 30% بازار
    # امتیاز ریسک برعکس موفقیت است (100 - موفقیت)
    weighted_success = (ml_success_prob * 100 * 0.4) + (team_score * 0.3) + (market_score * 0.3)
    final_risk_score = 100 - int(weighted_success)

    # --- 3. تولید تحلیل متنی (Strengths/Weaknesses) ---
    strengths = []
    weaknesses = []

    # A. تحلیل Runway (بسیار مهم برای VC)
    if burn_rate > 0 and requested_amount > 0:
        runway_months = requested_amount / burn_rate
        if runway_months < 6:
            weaknesses.append({"key": "xai.weakness.runway_critical", "values": {"val": f"{int(runway_months)}"}})
        elif runway_months > 18:
            strengths.append({"key": "xai.strength.runway_healthy", "values": {"val": f"{int(runway_months)}"}})
        elif runway_months >= 12:
             strengths.append({"key": "xai.strength.runway_standard", "values": {"val": f"{int(runway_months)}"}})
    
    # B. تحلیل تیم
    if team_score > 75:
        strengths.append({"key": "xai.strength.strong_team_composition", "values": {}})
    elif team_score < 40:
        weaknesses.append({"key": "xai.weakness.team_experience_gap", "values": {}})

    # C. تحلیل بازار
    if market_score > 70:
        strengths.append({"key": "xai.strength.large_market_potential", "values": {"val": f"${int(safe_float(market.get('tam'))/1000000)}M"}})
    
    # D. تعادل مالی
    if revenue > 0:
        if revenue > burn_rate * 12:
             strengths.append({"key": "xai.strength.profitable_projection", "values": {}})
        else:
             weaknesses.append({"key": "xai.weakness.high_burn_relative_to_revenue", "values": {}})
    elif proposal_data.get('startupStage') == 'revenue':
         weaknesses.append({"key": "xai.weakness.revenue_stage_no_revenue", "values": {}})

    # E. کیفیت مایل‌ستون‌ها
    if len(milestones) < 2:
        weaknesses.append({"key": "xai.weakness.lump_sum_risk", "values": {}})
    elif len(milestones) > 2:
        strengths.append({"key": "xai.strength.well_structured_milestones", "values": {}})

    # Fallbacks
    if not strengths: strengths.append({"key": "xai.strength.balanced_risk", "values": {}})
    if not weaknesses: weaknesses.append({"key": "xai.weakness.general_execution_risk", "values": {}})

    # --- 4. تعیین توصیه نهایی ---
    if final_risk_score <= 35:
        rec_key = "recommendation.highly_recommended"
        level_key = "risk_level.low"
    elif final_risk_score <= 60:
        rec_key = "recommendation.cautious_buy"
        level_key = "risk_level.medium"
    elif final_risk_score <= 80:
        rec_key = "recommendation.high_risk_venture"
        level_key = "risk_level.high"
    else:
        rec_key = "recommendation.not_recommended"
        level_key = "risk_level.very_high"

    return {
        "risk_score": final_risk_score,
        "success_probability": int(weighted_success),
        "team_competency_score": int(team_score),
        "market_sentiment_score": market_score / 100, # Normalize to 0-1 for UI
        "proposer_trust_score": 85, # Static for now
        
        "strengths": strengths,
        "weaknesses": weaknesses,
        
        "recommendation_text_key": rec_key,
        "risk_level_key": level_key,
        
        # اطلاعات دیباگ (در خروجی نهایی استفاده نمی‌شود اما برای لاگ خوب است)
        "debug_info": {
            "ml_prob": ml_success_prob,
            "runway": requested_amount / burn_rate if burn_rate else 0
        }
    }