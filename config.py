"""Configuration for RISA Hackathon - Denial Prediction Engine"""

import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

# BigQuery configuration
BIGQUERY_PROJECT = os.getenv("BIGQUERY_PROJECT", "prior--backen-prod-svc-u4g8")
DATASET_PHARMACY = "pharmacy_pa_requests"
DATASET_ONCOEMR = "oncoemr"
TABLE_PA_ENTRIES = "pa_request_entries"
TABLE_QUESTIONNAIRES = "questionnaire_data"

# Model parameters
RANDOM_SEED = 42
TEST_SIZE = 0.2
DENIAL_RISK_THRESHOLD_HIGH = 0.70  # 70%+
DENIAL_RISK_THRESHOLD_LOW = 0.30   # <30%

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
