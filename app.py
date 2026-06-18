"""RISA Denial Prevention Engine - FastAPI app (no Streamlit).

Serves a small JSON API + a static single-page frontend. Runs entirely on
precomputed, de-identified data baked into the container (app_data/), so the
hosted service never touches live PHI or the prod BigQuery project.

Inference (the Predict endpoint) is a placeholder until the trained model
(models/denial_predictor_final.pkl) is wired in. Model TRAINING happens
offline/locally, not in this serving container -- see DEPLOY.md.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from storage import get_store

BASE_DIR = Path(__file__).parent
APP_DATA = BASE_DIR / "app_data"
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="RISA Denial Prevention Engine",
    description="Predict pharmacy PA denials before submission (60% -> 95% approval).",
    version="1.0.0",
)


# --------------------------------------------------------------------------- #
# Cached data loaders (read precomputed de-identified artifacts once)
# --------------------------------------------------------------------------- #
def _read_json(name: str, default: Any) -> Any:
    p = APP_DATA / name
    return json.loads(p.read_text()) if p.exists() else default


def _load_summary() -> dict:
    return _read_json("summary.json", {})


def _load_samples() -> list[dict]:
    return _read_json("sample_cases.json", [])


def _load_denial_stats() -> list[dict]:
    p = APP_DATA / "denial_stats.csv"
    if not p.exists():
        return []
    df = pd.read_csv(p)
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")


# --------------------------------------------------------------------------- #
# API models
# --------------------------------------------------------------------------- #
class PredictRequest(BaseModel):
    medication_class: str = "Brand"
    payer_name: str = "Aetna Commercial"
    case_id: str = "demo"


# --------------------------------------------------------------------------- #
# API routes
# --------------------------------------------------------------------------- #
@app.get("/healthz")
def healthz() -> dict:
    """Liveness probe for Cloud Run."""
    return {"status": "ok"}


@app.get("/api/summary")
def api_summary() -> dict:
    return _load_summary()


@app.get("/api/denial-stats")
def api_denial_stats() -> list[dict]:
    return _load_denial_stats()


@app.get("/api/samples")
def api_samples() -> list[dict]:
    return _load_samples()


@app.get("/api/audit")
def api_audit(limit: int = 100) -> list[dict]:
    return get_store().list_predictions(limit=limit)


@app.post("/api/predict")
def api_predict(req: PredictRequest) -> dict:
    """Placeholder risk scorer.

    Returns a fixed high-risk result and logs a de-identified audit record.
    Swap the body for a real call into denial_predictor.py once the model
    artifact exists.
    """
    risk = 85.0
    result = {
        "case_id": req.case_id,
        "medication_class": req.medication_class,
        "payer_name": req.payer_name,
        "denial_risk": risk,
        "risk_level": "HIGH",
        "recommendations": [
            "Document trial & failure dates",
            "Attach progress note",
        ],
        "event": "predict_placeholder",
    }
    rid = get_store().log_prediction(result)
    return {**result, "record_id": rid, "model": "placeholder"}


# --------------------------------------------------------------------------- #
# Frontend (static SPA). Mounted last so it doesn't shadow /api routes.
# --------------------------------------------------------------------------- #
@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
