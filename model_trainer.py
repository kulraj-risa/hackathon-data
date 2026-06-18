"""Train the XGBoost denial-prediction model on the real PA data.

Pipeline:
  data/training_data.parquet  ->  FeatureEngineer  ->  XGBoost  ->  metrics
                                                              \\->  app_data/denial_model.pkl

The slim model package is written to ``app_data/`` (no PHI) so it ships in the
serving container without touching the ignore files. Run locally:

    ./venv/bin/python model_trainer.py
"""

from __future__ import annotations

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from config import APP_DATA_DIR, MODELS_DIR, RANDOM_SEED, TEST_SIZE, XGBOOST_PARAMS
from feature_engineer import FeatureEngineer

MODEL_PATH = APP_DATA_DIR / "denial_model.pkl"


def main() -> None:
    print("📂 Loading training data...")
    df = pd.read_parquet("data/training_data.parquet")
    print(f"   {len(df):,} cases  ({(df['response_status'] == 'Denied').mean():.1%} denied)")

    fe = FeatureEngineer().fit(df)
    X = fe.transform(df)
    y = (df["response_status"] == "Denied").astype(int)
    print(f"⚙️  Features: {X.shape[1]}  ·  target denied rate: {y.mean():.1%}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    print("🚀 Training XGBoost...")
    model = XGBClassifier(**XGBOOST_PARAMS)
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "test_accuracy": accuracy_score(y_test, pred),
        "test_precision": precision_score(y_test, pred, zero_division=0),
        "test_recall": recall_score(y_test, pred, zero_division=0),
        "test_f1": f1_score(y_test, pred, zero_division=0),
        "test_roc_auc": roc_auc_score(y_test, proba),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "denied_rate": float(y.mean()),
    }

    cm = confusion_matrix(y_test, pred)
    importance = (
        pd.Series(model.feature_importances_, index=fe.feature_names)
        .sort_values(ascending=False)
    )

    print("\n" + "=" * 56)
    print("MODEL EVALUATION (held-out test set)")
    print("=" * 56)
    print(f"  Accuracy : {metrics['test_accuracy']:.3f}")
    print(f"  Precision: {metrics['test_precision']:.3f}")
    print(f"  Recall   : {metrics['test_recall']:.3f}")
    print(f"  F1       : {metrics['test_f1']:.3f}")
    print(f"  ROC AUC  : {metrics['test_roc_auc']:.3f}")
    print(f"\n  Confusion matrix [[TN FP][FN TP]]:\n{cm}")
    print("\n  Top 12 features by importance:")
    for name, imp in importance.head(12).items():
        print(f"    {name:42s} {imp:.4f}")

    package = {
        "model": model,
        "feature_names": fe.feature_names,
        "top_payers": fe.top_payers,
        "metrics": metrics,
        "feature_importance": importance.to_dict(),
    }
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(package, MODEL_PATH)
    print(f"\n💾 Saved model -> {MODEL_PATH}")

    # Also keep a copy in models/ for local reference (gitignored).
    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(package, MODELS_DIR / "denial_predictor_final.pkl")


if __name__ == "__main__":
    main()
