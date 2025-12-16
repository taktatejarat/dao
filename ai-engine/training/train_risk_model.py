import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "../data/training_data.csv")
PIPELINE_PATH = os.path.join(SCRIPT_DIR, "../models/risk_pipeline.joblib")  # 🔹 ذخیره کل pipeline

def train_model():
    print("Loading training data...")
    df = pd.read_csv(DATA_PATH)

    X = df.drop('is_successful', axis=1)
    y = df['is_successful']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    categorical_features = ['industry']
    numeric_features = ['requested_amount_usd', 'milestone_count', 'team_experience_years']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ],
        remainder='passthrough'
    )

    model = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss',
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5
    )

    pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                               ('classifier', model)])

    pipeline.fit(X_train, y_train)

    print("\nEvaluating model performance...")
    y_pred = pipeline.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred))

    # 🔹 ذخیره کل pipeline با joblib
    print(f"\nSaving complete pipeline to {PIPELINE_PATH} ...")
    joblib.dump(pipeline, PIPELINE_PATH)

    print("\nModel training complete!")

if __name__ == '__main__':
    train_model()
