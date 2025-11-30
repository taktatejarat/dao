# ai-engine/score_calculator.py

import math

def calculate_pop_score(user_profile: dict, governance_history: dict = None) -> int:
    """
    محاسبه امتیاز اثبات مشارکت (PoP) برای مکانیزم اجماع هیبریدی.
    این امتیاز (0 تا 50) به عنوان درصد به قدرت رأی dPoS اضافه می‌شود.
    
    فرمول: PoP = (وزن_فعالیت * امتیاز_فعالیت) + (وزن_حاکمیت * امتیاز_حاکمیت) + (وزن_زمان * امتیاز_زمان)
    """
    
    # 1. فاکتور اثبات فعالیت (PoA - Proof of Activity)
    # فعالیت در شبکه (تراکنش‌ها) نشان‌دهنده زنده بودن کاربر است.
    tx_count = user_profile.get('transaction_count', 0)
    
    # امتیاز فعالیت (لگاریتمی): کسی که 100 تراکنش دارد خیلی بهتر از 1 است، اما 1000 تفاوت زیادی با 100 ندارد.
    activity_score = 0
    if tx_count > 0:
        activity_score = min(20, 4 * math.log2(tx_count + 1))
    
    # 2. فاکتور اثبات مشارکت (PoP - Governance Participation)
    # آیا کاربر در پروپوزال‌های قبلی رأی داده است؟
    # (در حال حاضر این داده را نداریم، پس از یک متغیر simple استفاده می‌کنیم یا در آینده از گراف می‌خوانیم)
    votes_cast = governance_history.get('total_votes_cast', 0) if governance_history else 0
    vote_accuracy = governance_history.get('successful_votes', 0) if governance_history else 0
    
    governance_score = 0
    if votes_cast > 0:
        # پاداش برای تعداد آرا (حداکثر 15 امتیاز)
        quantity_points = min(15, votes_cast * 2)
        # پاداش برای رأی دادن به پروپوزال‌های موفق (کیفیت رأی)
        quality_ratio = vote_accuracy / votes_cast if votes_cast > 0 else 0
        quality_points = quality_ratio * 5
        
        governance_score = quantity_points + quality_points

    # 3. فاکتور وفاداری (Stake Duration / HODL Score)
    # این بخش مکمل dPoS است. dPoS به "مقدار" اهمیت می‌دهد، اینجا به "رفتار نگهداری" اهمیت می‌دهیم.
    # اگر کاربر موجودی خود را مدت طولانی نگه داشته (کم‌نوسان است).
    # فعلاً بر اساس موجودی Native ساده‌سازی می‌کنیم
    balance = user_profile.get('native_balance', 0)
    loyalty_score = min(10, balance * 0.5)

    # --- محاسبه نهایی ---
    # حداکثر امتیاز: 20 (فعالیت) + 20 (حاکمیت) + 10 (وفاداری) = 50
    # این عدد به عنوان درصد بوست (Boost) روی dPoS اعمال می‌شود.
    final_pop_score = int(activity_score + governance_score + loyalty_score)
    
    # سقف امتیاز 50 (یعنی حداکثر 50% افزایش قدرت رأی)
    return min(50, final_pop_score)