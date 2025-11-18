# ai-engine/layers/layer_3_financial.py

import pandas as pd
from typing import Dict, Any, Tuple
import os
import joblib
import xgboost as xgb

# تعریف مسیرها نسبت به مکان فعلی فایل
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "../models/risk_model.json")
PREPROCESSOR_PATH = os.path.join(SCRIPT_DIR, "../models/preprocessor.joblib")

# بارگذاری مدل و preprocessor
try:
    model = xgb.Booster()
    model.load_model(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    print("[AI-LAYER-3] Financial risk model loaded successfully.")
except Exception as e:
    model = None
    preprocessor = None
    print(f"[AI-LAYER-3] WARNING: Could not load financial risk model. Error: {e}")

def generate_financial_report(proposal_features: Dict[str, Any]) -> dict:
    """
    یک گزارش کامل تحلیل ریسک مالی برای داشبورد تولید می‌کند.
    """
    # ویژگی‌های مورد نیاز مدل را از داده‌های کامل پروپوزال استخراج می‌کنیم
    model_features = {
        'industry': proposal_features.get('startupIndustry', 'Unknown'),
        'requested_amount_usd': int(proposal_features.get('marketSize', '0')), # فرض می‌کنیم marketSize همان مبلغ درخواستی است
        'milestone_count': len(proposal_features.get('milestones', [])),
        'team_experience_years': int(proposal_features.get('teamExperienceYears', '1')),
    }

    success_probability = 0.5 # مقدار پیش‌فرض

    if model and preprocessor:
        try:
            input_data = pd.DataFrame([model_features])
            processed_data = preprocessor.transform(input_data)
            # استفاده از predict_proba برای گرفتن احتمال
            # [:, 1] احتمال کلاس 1 (موفق) را برمی‌گرداند
            prediction_proba = model.predict_proba(processed_data)[:, 1]
            success_probability = prediction_proba[0]
        except Exception as e:
            print(f"Error during model prediction: {e}")

    risk_score = 1 - success_probability

    summary = f"The model predicts a {success_probability:.0%} probability of success, resulting in a risk score of {risk_score:.0%}."

    return {
        "risk_score": round(risk_score * 100),
        "success_probability": round(success_probability * 100),
        "summary": summary
    }