# ai-engine/layers/layer_3_financial.py

import os
import math
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
        try: return float(str(v).replace(',', '')) if v not in [None, ''] else 0.0
        except: return 0.0

    input_features = {
        'tam': safe_float(market.get('tam')),
        'burn_rate': safe_float(financials.get('burnRate')),
        'requested_amount': sum([safe_float(m.get('amount')) for m in milestones]),
        'milestone_count': len(milestones),
        'team_experience': safe_float(proposal_data.get('teamExperienceYears')),
        'revenue_proj': safe_float(financials.get('revenueProj')),
        'runway': safe_float(financials.get('runway')),
        'net_profit': safe_float(financials.get('netProfit')),
        'valuation': safe_float(financials.get('valuation')),
        'ebitda': safe_float(financials.get('ebitda')),
        'payback_user': safe_float(financials.get('paybackMonths')),
    }

    # محاسبات تکمیلی
    monthly_revenue = input_features['revenue_proj'] / 12 if input_features['revenue_proj'] else 0
    monthly_profit = monthly_revenue - input_features['burn_rate']
    payback_est = None
    if monthly_profit > 0:
        # برآورد بازگشت سرمایه بر اساس جبران 12 ماه هزینه جاری
        payback_est = math.ceil((input_features['burn_rate'] * 12) / monthly_profit)
    payback_gap = None
    if payback_est is not None and input_features['payback_user'] > 0:
        payback_gap = payback_est - input_features['payback_user']

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

    # فاکتورهای دستی بر اساس مقایسه مالی
    strengths = []
    weaknesses = []

    if payback_gap is not None:
        if payback_gap <= 2:
            strengths.append({"label": "Payback alignment", "detail": f"User: {input_features['payback_user']} mo, Est: {payback_est} mo"})
        else:
            weaknesses.append({"label": "Payback mismatch", "detail": f"User: {input_features['payback_user']} mo vs Est: {payback_est} mo"})

    if input_features['runway'] > 12:
        strengths.append({"label": "Healthy runway", "detail": f"{input_features['runway']} months runway"})
    elif input_features['runway'] > 0:
        weaknesses.append({"label": "Short runway", "detail": f"{input_features['runway']} months runway"})

    if input_features['net_profit'] > 0 and monthly_revenue > 0:
        strengths.append({"label": "Positive net profit", "detail": f"${input_features['net_profit']}"})
    elif monthly_revenue > 0 and monthly_profit <= 0:
        weaknesses.append({"label": "Negative cashflow", "detail": f"Monthly burn {input_features['burn_rate']} exceeds revenue {round(monthly_revenue,2)}"})

    # داده‌های تکمیلی (محاسباتی ساده برای نمایش)
    market_sentiment = 0.5 + (0.1 if input_features['tam'] > 1e9 else 0)
    team_competency = min(100, int(input_features['team_experience'] * 10))

    validations = {
        "payback_user_months": input_features['payback_user'] or None,
        "payback_estimated_months": payback_est,
        "payback_gap_months": payback_gap,
        "runway_months": input_features['runway'] or None,
        "monthly_revenue": monthly_revenue or None,
        "monthly_profit": monthly_profit if monthly_profit != 0 else None,
        "notes": weaknesses + strengths
    }

    return {
        "risk_score": risk_score,
        "success_probability": success_probability,
        "team_competency_score": team_competency,
        "market_sentiment_score": round(market_sentiment, 2),
        "xai_factors": xai_factors,
        "financial_validations": validations,
        "strengths": strengths,
        "weaknesses": weaknesses
    }