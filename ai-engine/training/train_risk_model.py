# ai-engine/training/train_risk_model.py

import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os # ✅ NEW: Import os

# ✅ FIX: تعریف مسیرها نسبت به مکان فعلی فایل
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "../data/training_data.csv")
MODEL_PATH = os.path.join(SCRIPT_DIR, "../models/risk_model.json")
PREPROCESSOR_PATH = os.path.join(SCRIPT_DIR, "../models/preprocessor.joblib")

def train_model():
    print("Loading training data...")
    df = pd.read_csv(DATA_PATH)

    # ۱. تفکیک ویژگی‌ها (X) و هدف (y)
    X = df.drop('is_successful', axis=1)
    y = df['is_successful']

    # ۲. تقسیم داده‌ها به مجموعه آموزش و تست
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # ۳. ساخت Preprocessor برای تبدیل ویژگی‌های دسته‌ای (industry)
    categorical_features = ['industry']
    numeric_features = ['requested_amount_usd', 'milestone_count', 'team_experience_years']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ],
        remainder='passthrough'
    )
    
    # ۴. ساخت و آموزش مدل XGBoost
    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss',
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5
    )

    # ایجاد Pipeline برای ترکیب preprocessor و مدل
    pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                               ('classifier', model)])

    pipeline.fit(X_train, y_train)

    # ۵. ارزیابی مدل
    print("\nEvaluating model performance...")
    y_pred = pipeline.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # ۶. ذخیره مدل و preprocessor
    print(f"Saving model to {MODEL_PATH} and preprocessor to {PREPROCESSOR_PATH}...")
    pipeline.named_steps['classifier'].save_model(MODEL_PATH)
    joblib.dump(pipeline.named_steps['preprocessor'], PREPROCESSOR_PATH)
    
    print("\nModel training complete!")

if __name__ == '__main__':
    train_model()