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
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer
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

from denial_engine.core.config import (
    APP_DATA_DIR,
    MODELS_DIR,
    RANDOM_SEED,
    TEST_SIZE,
    TFIDF_PARAMS,
    XGBOOST_PARAMS,
)
from denial_engine.ml.feature_engineer import FeatureEngineer

MODEL_PATH = APP_DATA_DIR / "denial_model.pkl"


def main() -> None:
    print("📂 Loading training data...")
    df = pd.read_parquet("data/training_data.parquet")
    print(f"   {len(df):,} cases  ({(df['response_status'] == 'Denied').mean():.1%} denied)")

    fe = FeatureEngineer().fit(df)
    Xnum = fe.transform(df)
    docs = fe.fact_texts(df)
    n_with_text = sum(1 for d in docs if d)
    y = (df["response_status"] == "Denied").astype(int)
    print(
        f"⚙️  Numeric features: {Xnum.shape[1]}  ·  cases with fact text: "
        f"{n_with_text:,}/{len(df):,}  ·  denied rate: {y.mean():.1%}"
    )

    idx = np.arange(len(df))
    tr, te = train_test_split(
        idx, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )

    print("🚀 Fitting TF-IDF on evidence facts + training XGBoost...")
    vectorizer = TfidfVectorizer(**TFIDF_PARAMS)
    Xtxt_tr = vectorizer.fit_transform([docs[i] for i in tr])
    Xtxt_te = vectorizer.transform([docs[i] for i in te])

    Xnum_arr = Xnum.values
    X_train = hstack([csr_matrix(Xnum_arr[tr]), Xtxt_tr]).tocsr()
    X_test = hstack([csr_matrix(Xnum_arr[te]), Xtxt_te]).tocsr()
    y_train, y_test = y.iloc[tr], y.iloc[te]

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
        "n_train": int(X_train.shape[0]),
        "n_test": int(X_test.shape[0]),
        "denied_rate": float(y.mean()),
    }

    cm = confusion_matrix(y_test, pred)
    # Combined feature space = numeric features, then TF-IDF vocabulary terms.
    combined_names = list(fe.feature_names) + [
        f"fact::{t}" for t in vectorizer.get_feature_names_out()
    ]
    importance = (
        pd.Series(model.feature_importances_, index=combined_names)
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
    print("\n  Top 15 features by importance (fact:: = evidence-text term):")
    for name, imp in importance.head(15).items():
        print(f"    {name:46s} {imp:.4f}")

    package = {
        "model": model,
        "feature_names": fe.feature_names,
        "vectorizer": vectorizer,
        "top_payers": fe.top_payers,
        "metrics": metrics,
        "feature_importance": {k: float(v) for k, v in importance.head(40).items()},
    }
    MODEL_PATH.parent.mkdir(exist_ok=True)
    joblib.dump(package, MODEL_PATH)
    print(f"\n💾 Saved model -> {MODEL_PATH}")

    # Also keep a copy in models/ for local reference (gitignored).
    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(package, MODELS_DIR / "denial_predictor_final.pkl")


if __name__ == "__main__":
    main()
