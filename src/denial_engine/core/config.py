"""Configuration for RISA Hackathon - Denial Prediction Engine"""

import os
from pathlib import Path

# Project paths. This module lives at <root>/src/denial_engine/core/config.py,
# so the repo root is parents[3]. All paths can be overridden via env vars so the
# container (where the package is pip-installed) can point at /app/app_data, etc.
PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", Path(__file__).resolve().parents[3]))
DATA_DIR = Path(os.environ.get("DATA_DIR", PROJECT_ROOT / "data"))
MODELS_DIR = Path(os.environ.get("MODELS_DIR", PROJECT_ROOT / "models"))
# De-identified artifacts baked into the image (no PHI).
APP_DATA_DIR = Path(os.environ.get("APP_DATA_DIR", PROJECT_ROOT / "app_data"))

# Create writable dirs if they don't exist (app_data is read-only/baked).
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

# BigQuery configuration
BIGQUERY_PROJECT = os.getenv("BIGQUERY_PROJECT", "prior--backen-prod-svc-u4g8")
DATASET_PHARMACY = "pharmacy_pa_requests"
DATASET_ONCOEMR = "oncoemr"
TABLE_PA_ENTRIES = "pa_request_entries"
TABLE_QUESTIONNAIRES = "questionnaire_data"

# Model parameters
RANDOM_SEED = 42
TEST_SIZE = 0.2
# Risk bands calibrated to the trained model's probability range
# (base denial rate is ~40%; the model rarely exceeds ~0.7).
DENIAL_RISK_THRESHOLD_HIGH = 0.55  # >=55% -> HIGH
DENIAL_RISK_THRESHOLD_LOW = 0.35   # <35%  -> LOW

# Touchless auto-submit cutoff, set EMPIRICALLY: historically, cases scoring
# below this had a ~2% denial rate while covering ~36% of all PAs. A case must
# also be complete and contradiction-free to qualify (see DenialPredictor._decide).
TOUCHLESS_THRESHOLD = 0.25

# Training parameters
XGBOOST_PARAMS = {
    "n_estimators": 200,
    "learning_rate": 0.1,
    "max_depth": 6,
    "min_child_weight": 3,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "gamma": 0.1,
    "reg_alpha": 0.01,
    "reg_lambda": 1.0,
    "random_state": RANDOM_SEED,
    "eval_metric": "logloss",
}

# TF-IDF over evidence facts (the dominant denial signal: AUC 0.64 -> 0.83).
# min_df>=5 keeps only terms seen in >=5 cases, which also filters out any
# patient-specific tokens (names/MRNs) from the persisted vocabulary.
TFIDF_PARAMS = {
    "max_features": 3000,
    "ngram_range": (1, 2),
    "min_df": 5,
    "sublinear_tf": True,
}

# Feature engineering
TOP_MEDICATIONS = 20  # Top N medications to encode
TOP_PAYERS = 10       # Top N payers to encode

# Business metrics
CURRENT_APPROVAL_RATE = 0.60
TARGET_APPROVAL_RATE = 0.95
ANNUAL_PA_VOLUME = 10000
AVG_PA_TIME_MINUTES = 20
STAFF_HOURLY_RATE = 50
AVG_REWORK_TIME_MINUTES = 45
REVENUE_PER_APPROVAL = 500
AVG_DELAY_DAYS = 7
