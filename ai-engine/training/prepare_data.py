# ai-engine/training/prepare_data.py

import pandas as pd
from datetime import datetime
import os # ✅ NEW: Import os

# ✅ FIX: تعریف مسیرها نسبت به مکان فعلی فایل
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DATA_PATH = os.path.join(SCRIPT_DIR, "../data/big_startup_secsees_dataset.csv")
OUTPUT_DATA_PATH = os.path.join(SCRIPT_DIR, "../data/training_data.csv")

def prepare_data():
    print("Loading raw dataset...")
    df = pd.read_csv(INPUT_DATA_PATH)

    # ۱. فیلتر کردن بر اساس وضعیت (status)
    print("Filtering for 'acquired', 'ipo', and 'closed' statuses...")
    df_filtered = df[df['status'].isin(['acquired', 'ipo', 'closed'])].copy()

    # ۲. ایجاد متغیر هدف (is_successful)
    df_filtered['is_successful'] = df_filtered['status'].apply(lambda x: 1 if x in ['acquired', 'ipo'] else 0)

    # ۳. پاک‌سازی و تطبیق ستون‌ها
    print("Cleaning and mapping columns...")

    # صنعت (Industry)
    df_filtered['industry'] = df_filtered['category_list'].str.split('|').str[0]

    # مبلغ درخواستی (Requested Amount)
    df_filtered['requested_amount_usd'] = pd.to_numeric(df_filtered['funding_total_usd'], errors='coerce').fillna(0)

    # تعداد Milestone
    df_filtered['milestone_count'] = df_filtered['funding_rounds']

    # تجربه تیم (تقریبی)
    df_filtered['founded_at'] = pd.to_datetime(df_filtered['founded_at'], errors='coerce')
    df_filtered['first_funding_at'] = pd.to_datetime(df_filtered['first_funding_at'], errors='coerce')
    df_filtered['team_experience_years'] = (df_filtered['first_funding_at'] - df_filtered['founded_at']).dt.days / 365.25
    df_filtered['team_experience_years'] = df_filtered['team_experience_years'].fillna(1).clip(lower=0) # حداقل 1 سال تجربه فرض می‌کنیم

    # ۴. انتخاب ستون‌های نهایی برای مدل
    final_columns = [
        'industry',
        'requested_amount_usd',
        'milestone_count',
        'team_experience_years',
        'is_successful'
    ]
    df_final = df_filtered[final_columns].dropna(subset=['industry'])

    # ۵. ذخیره دیتاست نهایی
    print(f"Saving {len(df_final)} cleaned records to {OUTPUT_DATA_PATH}...")
    df_final.to_csv(OUTPUT_DATA_PATH, index=False)
    
    print("\nData preparation complete!")
    print("\nSample of the final training data:")
    print(df_final.head())
    print("\nSuccess/Failure distribution:")
    print(df_final['is_successful'].value_counts(normalize=True))

if __name__ == '__main__':
    prepare_data()