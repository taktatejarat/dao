# ai-engine/layers/layer_3_financial.py

import os
import numpy as np
import xgboost as xgb
import pandas as pd
from logger_config import logger

# مسیر مدل
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'risk_model.json')

class FinancialModelHandler:
    def __init__(self):
        self.model = None
        self.load_models()

    def load_models(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = xgb.Booster()
                self.model.load_model(MODEL_PATH)
                logger.info("✅ Financial AI Model Loaded.")
            except Exception as e:
                logger.error(f"Failed to load XGBoost model: {e}")
        else:
            logger.warning("⚠️ Risk model not found. Waiting for training pipeline.")

    def predict(self, features: dict):
        if not self.model:
            return 0.5, [] # Default if model missing

        try:
            # ترتیب ستون‌ها باید دقیقاً مثل train_models.py باشد
            # features = ['tam', 'burn_rate', 'requested_amount', 'milestone_count', 'team_experience']
            data_vector = [
                features.get('tam', 0),
                features.get('burn_rate', 0),
                features.get('requested_amount', 0),
                features.get('milestone_count', 0),
                features.get('team_experience', 0)
            ]
            
            # تبدیل به DMatrix
            dmatrix = xgb.DMatrix(np.array([data_vector]), feature_names=['tam', 'burn_rate', 'requested_amount', 'milestone_count', 'team_experience'])
            
            # پیش‌بینی احتمال موفقیت
            probability = float(self.model.predict(dmatrix)[0])
            
            # محاسبه اهمیت ویژگی‌ها (SHAP values approximated)
            contribs = self.model.predict(dmatrix, pred_contribs=True)[0][:-1]
            
            return probability, contribs
        except Exception as e:
            logger.error(f"Prediction Error: {e}")
            return 0.5, []

# Singleton
ai_engine = FinancialModelHandler()

def generate_financial_report(proposal_data: dict) -> dict:
    """
    دریافت داده از پلتفرم و تحلیل با هوش مصنوعی
    """
    # 1. تبدیل داده‌های ورودی به اعداد تمیز
    market = proposal_data.get('marketStats', {})
    financials = proposal_data.get('financialStats', {})
    milestones = proposal_data.get('milestones', [])

    def safe_float(v):
        try: return float(str(v).replace(',', '')) if v else 0.0
        except: return 0.0

    input_features = {
        'tam': safe_float(market.get('tam')),
        'burn_rate': safe_float(financials.get('burnRate')),
        'requested_amount': sum([safe_float(m.get('amount')) for m in milestones]),
        'milestone_count': len(milestones),
        'team_experience': safe_float(proposal_data.get('teamExperienceYears'))
    }

    # 2. اجرای مدل هوش مصنوعی
    success_prob_raw, contributions = ai_engine.predict(input_features)
    
    # 3. تبدیل خروجی به فرمت گزارش
    success_probability = int(success_prob_raw * 100)
    risk_score = 100 - success_probability # ریسک برعکس موفقیت است

    # 4. تولید فاکتورهای توضیح‌پذیر (xAI)
    xai_factors = []
    feature_names = ['tam', 'burn_rate', 'requested_amount', 'milestone_count', 'team_experience']
    
    for i, impact in enumerate(contributions):
        if i >= len(feature_names): break
        fname = feature_names[i]
        val = input_features[fname]
        
        # اگر تاثیر مثبت یا منفی چشمگیر بود
        if abs(impact) > 0.05: 
            xai_factors.append({
                "key": f"xai.feature.{fname}", # کلید ترجمه
                "values": {"value": val},
                "type": "strength" if impact > 0 else "weakness",
                "importance": float(impact)
            })

    # داده‌های تکمیلی (محاسباتی ساده برای نمایش)
    market_sentiment = 0.5 + (0.1 if input_features['tam'] > 1e9 else 0)
    team_competency = min(100, int(input_features['team_experience'] * 10))

    return {
        "risk_score": risk_score,
        "success_probability": success_probability,
        "team_competency_score": team_competency,
        "market_sentiment_score": round(market_sentiment, 2),
        "xai_factors": xai_factors
    }