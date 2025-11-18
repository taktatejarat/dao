# ai-engine/layers/layer_1_security.py - نسخه اولیه برای رفع خطا

import numpy as np

def analyze_user_behavior(user_transaction_history: list) -> dict:
    """
    تحلیل رفتار کاربر برای تشخیص ناهنجاری و محاسبه امتیاز اعتماد (نسخه اولیه).
    """
    if not user_transaction_history:
        return {"trust_score": 50, "anomaly_detected": False, "reason": "No history"}

    amounts = [tx.get('amount', 0) for tx in user_transaction_history]
    avg_amount = np.mean(amounts) if amounts else 0

    trust_score = 50  # امتیاز پایه
    if avg_amount > 10000:  # کاربر فعال
        trust_score += 20
    if len(user_transaction_history) > 10:  # کاربر با سابقه
        trust_score += 15

    return {
        "trust_score": min(trust_score, 95),
        "anomaly_detected": False,  # در این نسخه، همیشه False است
        "reason": "User behavior seems normal (basic check)."
    }