# scripts/generate_synthetic_data.py

import pandas as pd
import numpy as np
import os
import random

# تنظیم مسیر ذخیره‌سازی
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'ai-engine', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

def generate_financial_data(n_samples=500000):
    print(f"Prepairing {n_samples} financial records...")
    
    data = []
    industries = ['DeFi', 'AI', 'Gaming', 'SaaS', 'Infrastructure']
    
    for _ in range(n_samples):
        # تولید ویژگی‌های پایه
        industry = random.choice(industries)
        tam = int(np.random.lognormal(16, 2)) # بازه میلیونی تا میلیاردی
        burn_rate = int(np.random.lognormal(9, 1)) # حدود 3k تا 50k
        requested = int(burn_rate * np.random.randint(6, 36)) # runway بین 6 تا 36 ماه
        milestones = np.random.randint(1, 8)
        team_exp = int(np.random.normal(5, 3)) # میانگین 5 سال
        team_exp = max(0, team_exp)
        prev_funding = 1 if random.random() > 0.7 else 0
        
        # --- منطق تولید برچسب (Ground Truth Logic) ---
        # این منطقی است که AI باید "کشف" کند
        score = 0
        
        # 1. Runway Score
        runway = requested / burn_rate if burn_rate > 0 else 0
        if 12 <= runway <= 24: score += 30
        elif runway < 6: score -= 20
        
        # 2. Team Score
        score += team_exp * 3
        
        # 3. Market Score
        if tam > 500_000_000: score += 20
        
        # 4. Previous Funding
        if prev_funding: score += 15
        
        # اضافه کردن نویز تصادفی (واقعیت بازار)
        score += np.random.normal(0, 10)
        
        # تعیین برچسب نهایی (موفقیت یا شکست)
        is_successful = 1 if score > 50 else 0
        
        data.append([
            tam, burn_rate, requested, milestones, team_exp, 
            industry, prev_funding, is_successful
        ])
        
    df = pd.DataFrame(data, columns=[
        'tam', 'burn_rate', 'requested_amount', 'milestone_count', 
        'team_experience', 'industry', 'prev_funding', 'is_successful'
    ])
    
    output_path = os.path.join(DATA_DIR, 'financial_dataset.csv')
    df.to_csv(output_path, index=False)
    print(f"✅ Financial data prepaired & save to: {output_path}")

def generate_user_behavior_data(n_samples=500000):
    print(f"Pripairing {n_samples} user behavior records...")
    
    data = []
    
    for _ in range(n_samples):
        # سناریو 1: کاربر واقعی (Normal)
        if random.random() > 0.1: # 90% کاربران واقعی
            tx_count = int(np.random.exponential(50)) + 1
            wallet_age = int(np.random.uniform(30, 2000))
            balance = np.random.exponential(10)
            gas_used = tx_count * np.random.normal(50000, 10000)
            is_bot = 0
        
        # سناریو 2: ربات/سیبیل (Anomaly)
        else: # 10% ربات
            tx_count = int(np.random.normal(5, 2)) # تراکنش خیلی کم یا الگوی خاص
            wallet_age = int(np.random.uniform(0, 5)) # کیف پول تازه ساخت
            balance = np.random.uniform(0, 0.1) # موجودی نزدیک صفر
            gas_used = tx_count * 21000 # فقط انتقال ساده
            is_bot = 1
            
        data.append([
            max(0, tx_count), max(0, wallet_age), max(0, balance), 
            max(0, gas_used), is_bot
        ])
        
    df = pd.DataFrame(data, columns=[
        'transaction_count', 'wallet_age_days', 'balance_native', 
        'total_gas_used', 'is_bot'
    ])
    
    output_path = os.path.join(DATA_DIR, 'user_behavior_dataset.csv')
    df.to_csv(output_path, index=False)
    print(f"✅ User data prepaired & saved to: {output_path}")

if __name__ == "__main__":
    generate_financial_data()
    generate_user_behavior_data()