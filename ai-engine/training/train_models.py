# ai-engine/training/train_models.py

import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import joblib

# مسیرها
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
MODEL_DIR = os.path.join(BASE_DIR, '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

# =======================
# Financial Risk Model
# =======================
def train_financial_model():
    print("\n🚀 Training Financial Risk Model (XGBoost)...")
    csv_path = os.path.join(DATA_DIR, 'financial_dataset.csv')
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} not found. Run data generator first.")
        return

    df = pd.read_csv(csv_path)
    
    # انتخاب ویژگی‌ها
    numeric_features = ['tam', 'burn_rate', 'requested_amount', 'milestone_count', 'team_experience']
    categorical_features = []  # اگر ستون دسته‌ای دارید اینجا اضافه کنید
    
    X = df[numeric_features + categorical_features]
    y = df['is_successful']
    
    # تقسیم داده‌ها
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )
    
    # مدل XGBoost
    model = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        eval_metric='logloss'
    )
    
    # Pipeline کامل
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', model)
    ])
    
    # آموزش مدل
    pipeline.fit(X_train, y_train)
    
    # ارزیابی
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"✅ Financial Model Accuracy: {acc:.2f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # ذخیره pipeline کامل
    pipeline_path = os.path.join(MODEL_DIR, 'risk_pipeline.joblib')
    joblib.dump(pipeline, pipeline_path)
    print(f"✅ Financial Pipeline Saved: {pipeline_path}")


# =======================
# Security Anomaly Model
# =======================
def train_security_model():
    print("\n🛡️ Training Security Anomaly Model (Isolation Forest)...")
    csv_path = os.path.join(DATA_DIR, 'user_behavior_dataset.csv')
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    
    features = ['transaction_count', 'balance_native', 'total_gas_used']
    
    # آموزش فقط روی کاربران نرمال (is_bot = 0)
    normal_users = df[df['is_bot'] == 0][features]
    
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(normal_users)
    
    model_path = os.path.join(MODEL_DIR, 'security_model.joblib')
    joblib.dump(model, model_path)
    print(f"✅ Security Model Saved: {model_path}")


# =======================
# Main
# =======================
if __name__ == "__main__":
    train_financial_model()
    train_security_model()
