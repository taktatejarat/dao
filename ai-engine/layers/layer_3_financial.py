# ai-engine/layers/layer_3_financial.py

import os
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
            except Exception as e:
                logger.error(f"Failed to load Preprocessor: {e}")

    def predict(self, raw_features: dict):
        if not self.model or not self.preprocessor:
            return 0.5 
        try:
            input_df = pd.DataFrame([{
                'industry': raw_features.get('industry', 'Other'),
                'requested_amount_usd': raw_features.get('requested_amount', 0),
                'milestone_count': raw_features.get('milestone_count', 1),
                'team_experience_years': raw_features.get('team_experience', 1)
            }])
            processed_data = self.preprocessor.transform(input_df)
            dmatrix = xgb.DMatrix(processed_data)
            return float(self.model.predict(dmatrix)[0])
        except Exception:
            return 0.5

ai_engine = FinancialModelHandler()

def generate_financial_report(proposal_data: dict) -> dict:
    market = proposal_data.get('marketStats', {})
    financials = proposal_data.get('financialStats', {})
    milestones = proposal_data.get('milestones', [])
    
    # Data Extraction & Cleaning
    raw_ind = proposal_data.get('startupIndustry', 'Other')
    # نگاشت ساده برای اطمینان از سازگاری با مدل
    valid_inds = ['Software', 'Biotechnology', 'Mobile', 'E-Commerce', 'Enterprise']
    industry = raw_ind if raw_ind in valid_inds else 'Other'

    def safe_float(v):
        try: return float(str(v).replace(',', '')) if v not in [None, ''] else 0.0
        except: return 0.0

    requested_amount = sum([safe_float(m.get('amount')) for m in milestones])
    team_exp = safe_float(proposal_data.get('teamExperienceYears'))
    burn_rate = safe_float(financials.get('burnRate'))
    
    # AI Prediction
    input_features = {
        'industry': industry,
        'requested_amount': requested_amount,
        'milestone_count': len(milestones),
        'team_experience': team_exp,
    }
    
    success_prob_raw = ai_engine.predict(input_features)
    success_probability = int(success_prob_raw * 100)
    risk_score = 100 - success_probability

    # --- Rule-Based Analysis (xAI) ---
    strengths = []
    weaknesses = []

    # 1. Team Analysis
    if team_exp >= 5:
        strengths.append({"key": "xai.strength.team_exp_high", "values": {"val": int(team_exp)}})
    elif team_exp <= 2:
        weaknesses.append({"key": "xai.weakness.team_exp_low", "values": {"val": int(team_exp)}})
    else:
        # اگر خنثی بود، در نقاط قوت با متن ملایم‌تر می‌آوریم یا اصلاً نمی‌آوریم
        strengths.append({"key": "xai.strength.strong_team", "values": {}})

    # 2. Runway Analysis
    if burn_rate > 0 and requested_amount > 0:
        runway = requested_amount / burn_rate
        if runway < 6:
            weaknesses.append({"key": "xai.weakness.runway_short", "values": {"val": int(runway)}})
        elif runway > 18:
            strengths.append({"key": "xai.strength.runway_long", "values": {"val": int(runway)}})
        else:
            strengths.append({"key": "xai.strength.positive_burn", "values": {}})
    
    # 3. Industry Analysis
    if industry in ['Software', 'Biotechnology']:
        strengths.append({"key": "xai.strength.industry_growth", "values": {"val": industry}})
    elif industry == 'E-Commerce':
        weaknesses.append({"key": "xai.weakness.industry_saturated", "values": {"val": industry}})

    # 4. Milestones
    if not milestones:
        weaknesses.append({"key": "xai.weakness.no_milestones", "values": {}})
    else:
        strengths.append({"key": "xai.strength.positive_milestones", "values": {}})

    # Fallbacks to prevent empty lists
    if not strengths:
        strengths.append({"key": "xai.strength.balanced_profile", "values": {}})
    if not weaknesses:
        weaknesses.append({"key": "xai.weakness.standard_risk", "values": {}})

    # Recommendation Logic
    if risk_score <= 30:
        rec_key = "recommendation.low_risk_desc"
        risk_level = "low"
    elif risk_score <= 60:
        rec_key = "recommendation.medium_risk_desc"
        risk_level = "medium"
    elif risk_score <= 85:
        rec_key = "recommendation.high_risk_desc"
        risk_level = "high"
    else:
        rec_key = "recommendation.very_high_risk_desc"
        risk_level = "very_high"

    return {
        "risk_score": risk_score,
        "success_probability": success_probability,
        "team_competency_score": min(100, int(team_exp * 10)),
        "market_sentiment_score": 0.75,
        "proposer_trust_score": 80, # Placeholder until security module is fully integrated
        
        "strengths": strengths,
        "weaknesses": weaknesses,
        
        "recommendation_text_key": rec_key, # کلید ترجمه توصیه
        "risk_level_key": f"risk_level.{risk_level}", # کلید ترجمه سطح ریسک
        
        "raw_data": input_features # For debugging
    }