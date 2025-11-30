# ai-engine/layers/layer_1_security.py - FINAL DYNAMIC VERSION

import numpy as np
import math

def analyze_user_behavior(user_data: any) -> dict:
    """
    تحلیل رفتار کاربر با حساسیت بالا به داده‌های بلاکچین.
    ورودی می‌تواند لیست (فرمت قدیمی) یا دیکشنری (فرمت جدید) باشد.
    """
    # 1. استانداردسازی ورودی (حل مشکل لیست/دیکشنری)
    if isinstance(user_data, list):
        # اگر لیست است، اولین آیتم را بردار (چون فعلا تحلیل تک کاربره است)
        profile = user_data[0] if len(user_data) > 0 else {}
    else:
        profile = user_data

    # 2. استخراج داده‌ها با مقدار پیش‌فرض 0
    tx_count = int(profile.get('transaction_count', 0))
    balance = float(profile.get('native_balance', 0)) # موجودی متیک
    # اگر gas_used در دسترس نبود، تخمینی بر اساس تراکنش محاسبه می‌کنیم
    gas_used = profile.get('gas_used', tx_count * 21000) 
    dao_score = int(profile.get('dao_participation_score', 0))

    # 3. محاسبه امتیاز (Dynamic Scoring Algorithm)
    
    # امتیاز پایه
    base_score = 50 

    # الف) امتیاز فعالیت (Transaction Activity) - حداکثر 25 امتیاز
    # از تابع log استفاده می‌کنیم تا تفاوت بین 1 و 10 زیاد باشد، اما 100 و 110 کم
    # فرمول: 5 * log2(tx_count + 1)
    if tx_count > 0:
        activity_score = min(25, 5 * math.log2(tx_count + 1))
    else:
        activity_score = -10 # جریمه برای کاربر بدون تراکنش (روح)

    # ب) امتیاز ثروت (Wallet Balance) - حداکثر 15 امتیاز
    # فرض: هر 1 متیک = 0.5 امتیاز (تا سقف 30 متیک)
    # این باعث می‌شود حتی مقادیر کم هم امتیاز را تغییر دهند
    wealth_score = min(15, balance * 0.5)

    # ج) امتیاز پیچیدگی (Gas Usage) - حداکثر 10 امتیاز
    # کاربرانی که با قراردادها تعامل دارند (Gas بیشتر) معتبرترند
    complexity_score = min(10, (gas_used / 100000)) 

    # محاسبه نهایی
    raw_score = base_score + activity_score + wealth_score + dao_score
    
    # نرمال‌سازی بین 0 تا 100
    final_score = int(max(0, min(100, raw_score)))

    # 4. تحلیل کیفی (تولید پیام)
    anomaly_detected = False
    report_key = "security_report.normal_behavior"

    if tx_count == 0 and balance > 0:
        # پول دارد اما تراکنش ندارد (کیف پول تازه شارژ شده)
        report_key = "security_report.new_wallet"
    elif tx_count > 0 and final_score < 40:
        report_key = "security_report.low_activity"
        anomaly_detected = True # مشکوک به ربات کم‌کار
    elif final_score > 80:
        report_key = "security_report.trusted_user"

    return {
        "trust_score": final_score,
        "anomaly_detected": anomaly_detected,
        "report_key": report_key,
        # بازگرداندن جزئیات برای دیباگ در فرانت
        "breakdown": {
            "base": 50,
            "activity_points": round(activity_score, 1),
            "wealth_points": round(wealth_score, 1),
            "tx_count": tx_count,
            "balance": balance
        }
    }