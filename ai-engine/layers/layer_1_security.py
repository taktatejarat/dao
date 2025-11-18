# ai-engine/layers/layer_1_security.py (نسخه نهایی)

import numpy as np

def analyze_user_behavior(user_transaction_history: list) -> dict:
    """
    تحلیل رفتار کاربر و محاسبه امتیاز اعتماد با خروجی‌های ساختاریافته برای i18n.
    """
    if not user_transaction_history or len(user_transaction_history) == 0:
        return {
            "trust_score": 50,
            "anomaly_detected": False,
            "report_key": "security_report.no_history" # ✅ کلید ترجمه
        }

    amounts = [tx.get('amount', 0) for tx in user_transaction_history]
    avg_amount = np.mean(amounts)
    
    trust_score = 50
    if avg_amount > 10000: trust_score += 20
    if len(user_transaction_history) > 10: trust_score += 15

    # در آینده، این بخش با خروجی مدل IsolationForest جایگزین می‌شود
    anomaly_detected = False
    report_key = "security_report.normal_behavior"

    return {
        "trust_score": min(trust_score, 95),
        "anomaly_detected": anomaly_detected,
        "report_key": report_key
    }