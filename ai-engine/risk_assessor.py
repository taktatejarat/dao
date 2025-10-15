# ai-engine/risk_assessor.py - اصلاح شده برای بارگذاری مدل XGBoost

import xgboost as xgb
import pandas as pd
from typing import Dict, Any, Tuple
import joblib # برای بارگذاری مدل و preprocessor
import os # ✅ NEW: Import os

# ✅ FIX: تعریف مسیرها نسبت به مکان فعلی فایل
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "models/risk_model.json")
PREPROCESSOR_PATH = os.path.join(SCRIPT_DIR, "models/preprocessor.joblib")

# بارگذاری مدل و preprocessor در زمان شروع
try:
    model = xgb.Booster()
    model.load_model(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    print("[AI-ENGINE] Risk assessment model loaded successfully.")
except Exception as e:
    model = None
    preprocessor = None
    print(f"[AI-ENGINE] WARNING: Could not load risk model. Predictions will fail. Error: {e}")

def analyze_risk(ai_features: Dict[str, Any]) -> Tuple[int, int]:
    """
    با استفاده از مدل آموزش‌دیده XGBoost، ریسک پروژه را تحلیل می‌کند.
    """
    if not model or not preprocessor:
        # در صورتی که مدل بارگذاری نشده باشد، یک مقدار پیش‌فرض برمی‌گرداند
        return 99, 10 # ریسک بالا، اطمینان پایین

    # ۱. تبدیل داده‌های ورودی به DataFrame پاندا
    input_data = pd.DataFrame([ai_features])
    
    # ۲. پیش‌پردازش داده‌ها با استفاده از preprocessor ذخیره شده
    processed_data = preprocessor.transform(input_data)
    
    # ۳. پیش‌بینی با مدل XGBoost
    # خروجی مدل معمولاً یک احتمال بین 0 و 1 است
    prediction_proba = model.predict(processed_data)[0]
    
    # ۴. تبدیل احتمال به نمره ریسک 0-100
    risk_score = int(prediction_proba * 100)
    
    # Confidence Score (در این مرحله ساده است)
    confidence_score = 90 # فرض می‌کنیم مدل با اطمینان بالا پیش‌بینی می‌کند
    
    return risk_score, confidence_score