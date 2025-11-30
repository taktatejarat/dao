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


def generate_financial_report(proposal_data: dict) -> dict:
    # 1. استخراج داده‌های جدید
    market = proposal_data.get('marketStats', {})
    financials = proposal_data.get('financialStats', {})
    
    tam = float(market.get('tam', 0))
    som = float(market.get('som', 0))
    burn_rate = float(financials.get('burnRate', 0))
    revenue = float(financials.get('revenueProj', 0))
    requested = float(proposal_data.get('amount', 0)) # RYC converted to USD approx

    xai_factors = []
    risk_score = 50 # Base

    # 2. تحلیل VC-Grade (قوانین خبره)
    
    # قانون 1: اندازه بازار (Market Size)
    if tam > 1_000_000_000: # بازار 1 میلیاردی
        risk_score -= 10
        xai_factors.append({"key": "xai.financial.huge_tam", "values": {"value": f"${tam/1e9}B"}})
    elif tam < 10_000_000:
        risk_score += 20
        xai_factors.append({"key": "xai.financial.small_market", "importance": -1})

    # قانون 2: سهم بازار (SOM)
    if som > 0 and (som / tam) > 0.10: # ادعای سهم بازار غیرواقعی (بیش از 10 درصد کل بازار)
        risk_score += 15
        xai_factors.append({"key": "xai.financial.unrealistic_som", "importance": -1})

    # قانون 3: پایداری مالی (Runway)
    # اگر سرمایه درخواستی فقط کفاف 3 ماه را بدهد (Runway < 6 months خطرناک است)
    if burn_rate > 0:
        runway_months = requested / burn_rate
        if runway_months < 6:
            risk_score += 25
            xai_factors.append({"key": "xai.financial.short_runway", "values": {"value": int(runway_months)}})
        elif runway_months > 24:
             xai_factors.append({"key": "xai.financial.stable_runway", "values": {"value": int(runway_months)}})

    # نرمال‌سازی
    risk_score = max(0, min(100, risk_score))
    
    return {
        "risk_score": risk_score,
        "success_probability": 100 - risk_score,
        "team_competency_score": 75, # Placeholder for now
        "market_sentiment_score": 0.65,
        "xai_factors": xai_factors # ✅ لیست فاکتورهای توضیح‌پذیر
    }