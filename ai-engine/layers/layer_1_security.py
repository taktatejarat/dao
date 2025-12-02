# ai-engine/layers/layer_1_security.py

import os
import numpy as np
import joblib
from logger_config import logger

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'security_model.joblib')

class SecurityAI:
    def __init__(self):
        self.model = None
        self.load_models()

    def load_models(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                logger.info("✅ Security AI Model Loaded.")
            except Exception as e:
                logger.error(f"Failed to load Security model: {e}")
        else:
            logger.warning("⚠️ Security model not found.")

    def analyze(self, profile: dict):
        # Fallback اگر مدل نبود
        if not self.model:
            return {"trust_score": 50, "anomaly_detected": False, "report_key": "security_report.no_model"}

        try:
            # ویژگی‌های دقیقاً مشابه train_models.py
            # features = ['transaction_count', 'balance_native', 'total_gas_used']
            
            tx_count = float(profile.get('transaction_count', 0))
            balance = float(profile.get('amount', 0)) # در blockchain_reader نامش amount است
            gas_used = float(profile.get('gas_used', 0))

            features = [[tx_count, balance, gas_used]]
            
            # 1 = Normal, -1 = Anomaly
            prediction = self.model.predict(features)[0]
            
            # امتیاز ناهنجاری (هرچه منفی‌تر، ناهنجارتر)
            score_raw = self.model.score_samples(features)[0]
            
            # تبدیل به امتیاز اعتماد (0 تا 100)
            # معمولا score بین -0.8 تا 0 است.
            # فرمول تقریبی: (score + 1) * 100
            trust_score = int(np.clip((score_raw + 0.8) * 200, 0, 100))
            
            is_anomaly = (prediction == -1)
            
            report_key = "security_report.trusted_user"
            if is_anomaly:
                report_key = "security_report.anomaly_detected"
                trust_score = min(trust_score, 40) # جریمه برای ناهنجاری

            return {
                "trust_score": trust_score,
                "anomaly_detected": bool(is_anomaly),
                "report_key": report_key
            }

        except Exception as e:
            logger.error(f"Security Analysis Error: {e}")
            return {"trust_score": 50, "anomaly_detected": False, "report_key": "security_report.error"}

security_engine = SecurityAI()

def analyze_user_behavior(user_profile: dict) -> dict:
    if isinstance(user_profile, list):
        user_profile = user_profile[0] if user_profile else {}
    return security_engine.analyze(user_profile)