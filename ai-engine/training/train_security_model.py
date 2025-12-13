# ai-engine/training/train_security_model.py

import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

# تنظیم مسیرها
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# فرض می‌کنیم این دیتاست اکنون یک فایل ثابت است (مانند دیتای استارتاپ‌ها)
DATA_PATH = os.path.join(SCRIPT_DIR, "../data/user_behavior_dataset.csv") 
MODEL_PATH = os.path.join(SCRIPT_DIR, "../models/security_model.joblib")

def train_security_model():
    print("--- [Security AI] Training Anomaly Detection Model ---")
    
    if not os.path.exists(DATA_PATH):
        print(f"❌ Error: Dataset not found at {DATA_PATH}")
        # اگر فایل نبود، یک خطای مدیریت شده برمی‌گردانیم تا پایپ‌لاین قطع نشود
        return False

    try:
        print("Loading user behavior data...")
        df = pd.read_csv(DATA_PATH)

        # ویژگی‌های مورد نظر برای تشخیص ناهنجاری
        # باید دقیقاً با layer_1_security.py هماهنگ باشد
        features = ['transaction_count', 'balance_native', 'total_gas_used']
        
        # اطمینان از وجود ستون‌ها
        missing_cols = [col for col in features if col not in df.columns]
        if missing_cols:
            # فال‌بک برای حالتی که نام ستون‌ها در CSV متفاوت باشد
            # نگاشت نام‌های احتمالی دیتاست قدیمی به جدید
            column_map = {
                'tx_count': 'transaction_count',
                'amount': 'balance_native',
                'gas': 'total_gas_used'
            }
            df.rename(columns=column_map, inplace=True)
        
        # فیلتر کردن داده‌های آموزشی (فقط کاربرانی که ربات نیستند را یاد می‌گیریم)
        # اگر ستون is_bot وجود نداشت، همه را نرمال فرض می‌کنیم
        if 'is_bot' in df.columns:
            print("Filtering out known bots for training...")
            X_train = df[df['is_bot'] == 0][features]
        else:
            X_train = df[features]

        # پر کردن مقادیر خالی احتمالی
        X_train = X_train.fillna(0)

        print(f"Training Isolation Forest on {len(X_train)} records...")
        
        # آموزش مدل
        # contamination=0.01 یعنی فرض می‌کنیم 1% داده‌های جدید ممکن است ناهنجار باشند
        model = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
        model.fit(X_train)

        # ذخیره مدل
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        print(f"✅ Security Model saved to {MODEL_PATH}")
        return True

    except Exception as e:
        print(f"❌ Security training failed: {e}")
        return False

if __name__ == '__main__':
    train_security_model()