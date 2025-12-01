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
    #  FIX: بارگذاری مدل به عنوان XGBClassifier برای دسترسی به متدهای scikit-learn
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

# NEW: دیکشنری برای نگاشت نام‌های فنی به کلیدهای i18n 
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
    #  FIX: حذف پیشوندهای اضافی به صورت کامل 
    return name.replace("cat__industry_", "").replace("remainder__", "")


def generate_financial_report(proposal_data: dict) -> dict:
    # 1. استخراج داده‌های جدید (با مقدار پیش‌فرض ایمن)
    market = proposal_data.get('marketStats', {})
    financials = proposal_data.get('financialStats', {})
    
    # تبدیل مقادیر به float و مدیریت رشته‌های خالی
    def safe_float(val):
        try:
            return float(val) if val else 0.0
        except:
            return 0.0

    tam = safe_float(market.get('tam'))
    som = safe_float(market.get('som'))
    burn_rate = safe_float(financials.get('burnRate'))
    requested = safe_float(proposal_data.get('amount')) # این فیلد از محاسبه مایل‌ستون‌ها می‌آید

    xai_factors = []
    risk_score = 50 # امتیاز پایه

    # 2. تحلیل VC-Grade (قوانین خبره)
    
    # قانون 1: اندازه بازار (Market Size)
    if tam > 1_000_000_000: # بازار بزرگ
        risk_score -= 10
        xai_factors.append({"key": "xai.financial.huge_tam", "values": {"value": f"${tam/1e9}B"}, "importance": 1})
    elif tam > 0 and tam < 10_000_000: # بازار کوچک
        risk_score += 20
        xai_factors.append({"key": "xai.financial.small_market", "importance": -1})

    # قانون 2: سهم بازار (SOM)
    if tam > 0 and som > 0 and (som / tam) > 0.10: 
        risk_score += 15
        xai_factors.append({"key": "xai.financial.unrealistic_som", "importance": -1})

    # قانون 3: پایداری مالی (Runway)
    if burn_rate > 0 and requested > 0:
        runway_months = requested / burn_rate
        if runway_months < 6:
            risk_score += 25
            xai_factors.append({"key": "xai.financial.short_runway", "values": {"value": int(runway_months)}, "importance": -1})
        elif runway_months > 18:
             xai_factors.append({"key": "xai.financial.stable_runway", "values": {"value": int(runway_months)}, "importance": 1})

    # نرمال‌سازی نهایی
    risk_score = max(0, min(100, risk_score))
    
    # محاسبه احتمال موفقیت (معکوس ریسک)
    success_prob = 100 - risk_score

    return {
        "risk_score": int(risk_score),
        "success_probability": int(success_prob),
        "team_competency_score": 75, # Placeholder until Team AI layer is upgraded
        "market_sentiment_score": 0.65, # Default
        "xai_factors": xai_factors
    }