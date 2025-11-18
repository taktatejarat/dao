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

# ✅✅✅ NEW: دیکشنری برای نگاشت نام‌های فنی به کلیدهای i18n ✅✅✅
FEATURE_NAME_MAP = {
    "cat__industry": "xai.feature.industry",
    "remainder__requested_amount_usd": "xai.feature.requested_amount",
    "remainder__milestone_count": "xai.feature.milestone_count",
    "remainder__team_experience_years": "xai.feature.team_experience",
}


def clean_feature_name(name: str) -> str:
    """_summary_

    Args:
        name (str): _description_

    Returns:
        str: _description_
    """
    # ✅✅✅ FIX: حذف پیشوندهای اضافی به صورت کامل ✅✅✅
    return name.replace("cat__industry_", "").replace("remainder__", "")

def generate_financial_report(proposal_features: Dict[str, Any]) -> dict:
    """
    یک گزارش کامل تحلیل ریسک مالی با خروجی‌های ساختاریافته برای i18n تولید می‌کند.
    """
    # --- استخراج و پاک‌سازی ویژگی‌ها ---
    team_experience = int(proposal_features.get('teamExperienceYears', '0'))
    industry = proposal_features.get('startupIndustry', 'Unknown')
   # ✅✅✅ FIX: خواندن مقدار صحیح اندازه بازار از داده‌های پروپوزال ✅✅✅
    # ما همچنین مبلغ درخواستی را به عنوان یک ویژگی جداگانه در نظر می‌گیریم
    total_requested = sum(int(m.get('amount', '0')) for m in proposal_features.get('milestones', []))
    
    model_features = {
        'industry': proposal_features.get('startupIndustry', 'Unknown'),
        # این همان مبلغی است که مدل ما با آن آموزش دیده است
        'requested_amount_usd': total_requested, 
        'milestone_count': len(proposal_features.get('milestones', [])),
        'team_experience_years': int(proposal_features.get('teamExperienceYears', '1')),
        # ✅ NEW: افزودن اندازه بازار به عنوان یک ویژگی بالقوه برای آینده
        'market_size': int(proposal_features.get('marketSize', '0')),
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

    xai_factors_list = []
    if isinstance(feature_importances, list) and feature_importances:
        for name, importance in feature_importances[:3]:
            # ✅✅✅ FIX: استفاده از تابع تمیزکننده و نگاشت به کلید i18n ✅✅✅
            cleaned_name = clean_feature_name(name)
            feature_key = FEATURE_NAME_MAP.get(name, f"xai.feature.{cleaned_name}") # ایجاد کلید داینامیک
            
            feature_value = ""
            if "industry" in cleaned_name:
                # مقدار واقعی صنعت را استخراج می‌کنیم
                feature_value = proposal_features.get('startupIndustry', '')
            
            xai_factors_list.append({
                "key": feature_key,
                "values": { "value": feature_value } if feature_value else {},
                "importance": round(float(importance), 2)
            })

    return {
        "risk_score": round(risk_score * 100),
        "success_probability": round(success_probability * 100),
        "team_competency_score": round(team_competency_score),
        "market_sentiment_score": market_sentiment_score,
        "xai_factors": xai_factors_list,
    }