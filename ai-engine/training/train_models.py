# ai-engine/training/train_models.py

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

# مسیرها
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
MODEL_DIR = os.path.join(BASE_DIR, '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

def train_financial_model():
    print("\n🚀 Training Financial Risk Model (XGBoost)...")
    csv_path = os.path.join(DATA_DIR, 'financial_dataset.csv')
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} not found. Run data generator first.")
        return

    df = pd.read_csv(csv_path)
    
    # انتخاب دقیق ویژگی‌های عددی (هماهنگ با layer_3_financial.py)
    features = ['tam', 'burn_rate', 'requested_amount', 'milestone_count', 'team_experience']
    X = df[features]
    y = df['is_successful']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, eval_metric='logloss')
    model.fit(X_train, y_train)
    
    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"✅ Financial Model Accuracy: {acc:.2f}")
    
    model.save_model(os.path.join(MODEL_DIR, 'risk_model.json'))

def train_security_model():
    print("\n🛡️ Training Security Anomaly Model (Isolation Forest)...")
    csv_path = os.path.join(DATA_DIR, 'user_behavior_dataset.csv')
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    
    # انتخاب دقیق ویژگی‌های عددی (هماهنگ با layer_1_security.py)
    features = ['transaction_count', 'balance_native', 'total_gas_used']
    
    # آموزش فقط روی کاربران نرمال (is_bot = 0)
    normal_users = df[df['is_bot'] == 0][features]
    
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(normal_users)
    
    joblib.dump(model, os.path.join(MODEL_DIR, 'security_model.joblib'))
    print("✅ Security Model Saved.")

if __name__ == "__main__":
    train_financial_model()
    train_security_model()