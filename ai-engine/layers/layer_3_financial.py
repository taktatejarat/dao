# ai-engine/layers/layer_3_financial.py (نسخه نهایی و کامل)

import pandas as pd
from typing import Dict, Any
import os
import joblib
import xgboost as xgb
import numpy as np

# --- بارگذاری مدل و Preprocessor ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "../models/financial_risk_model.json")
PREPROCESSOR_PATH = os.path.join(SCRIPT_DIR, "../models/preprocessor.joblib")

try:
    # ✅ FIX: بارگذاری مدل به عنوان XGBClassifier برای دسترسی به متدهای scikit-learn
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    print("[AI-LAYER-3] Financial risk model loaded successfully.")
except Exception as e:
    model = None
    preprocessor = None
    print(f"[AI-LAYER-3] WARNING: Could not load financial risk model. Error: {e}")

# --- دیکشنری امتیازدهی برای احساسات بازار ---
INDUSTRY_SENTIMENT_SCORES = {
    "AI": 0.85, "DeFi": 0.75, "Gaming": 0.70,
    "HealthTech": 0.65, "SaaS": 0.60, "Fintech": 0.55,
}

def generate_financial_report(proposal_features: Dict[str, Any]) -> dict:
    """
    یک گزارش کامل تحلیل ریسک مالی با خروجی‌های ساختاریافته برای i18n تولید می‌کند.
    """
    # --- استخراج و پاک‌سازی ویژگی‌ها ---
    team_experience = int(proposal_features.get('teamExperienceYears', '0'))
    industry = proposal_features.get('startupIndustry', 'Unknown')
    
    model_features = {
        'industry': industry,
        'requested_amount_usd': int(proposal_features.get('marketSize', '0')),
        'milestone_count': len(proposal_features.get('milestones', [])),
        'team_experience_years': team_experience,
    }

    # --- پیش‌بینی مدل ---
    success_probability = 0.5
    feature_importances = {}

    if model and preprocessor:
        try:
            input_df = pd.DataFrame([model_features])
            processed_df = preprocessor.transform(input_df)
            
            # دریافت احتمال موفقیت
            success_probability = model.predict_proba(processed_df)[0][1]
            
            # ✅✅✅ XAI: استخراج اهمیت ویژگی‌ها ✅✅✅
            # این بخش به ما می‌گوید کدام ویژگی بیشترین تأثیر را در تصمیم مدل داشته است.
            importances = model.feature_importances_
            feature_names = preprocessor.get_feature_names_out()
            feature_importances = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)

        except Exception as e:
            print(f"Error during model prediction: {e}")

    # --- محاسبه امتیازها ---
    risk_score = 1 - success_probability
    team_competency_score = min((team_experience * 3) + 10, 100)
    market_sentiment_score = INDUSTRY_SENTIMENT_SCORES.get(industry, 0.5)

    return {
        "risk_score": round(risk_score * 100),
        "success_probability": round(success_probability * 100),
        "team_competency_score": round(team_competency_score),
        "market_sentiment_score": market_sentiment_score,
        "xai_factors": [
            {"feature": name.replace("cat__industry_", ""), "importance": round(float(importance), 2)}
            for name, importance in feature_importances[:3] # سه فاکتور تأثیرگذار برتر
        ]
    }