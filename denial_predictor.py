"""Denial prediction engine: load the trained model and score a PA case.

Loads ``app_data/denial_model.pkl`` (produced by model_trainer.py), rebuilds the
feature vector for a single case via FeatureEngineer, returns a denial-risk %, a
risk band, and actionable recommendations derived from the *real* signals
(contradictory vs. supportive facts, completeness, questionnaire presence).
"""

from __future__ import annotations

import threading
from pathlib import Path
from typing import Any

import joblib

from config import (
    APP_DATA_DIR,
    DENIAL_RISK_THRESHOLD_HIGH,
    DENIAL_RISK_THRESHOLD_LOW,
)
from feature_engineer import FeatureEngineer, _num

MODEL_PATH = APP_DATA_DIR / "denial_model.pkl"

_lock = threading.Lock()
_predictor: "DenialPredictor | None" = None


class ModelNotTrained(RuntimeError):
    """Raised when no trained model artifact is available."""


class DenialPredictor:
    def __init__(self, model_path: Path = MODEL_PATH):
        if not model_path.exists():
            raise ModelNotTrained(
                f"No model at {model_path}. Run `python model_trainer.py` first."
            )
        pkg = joblib.load(model_path)
        self.model = pkg["model"]
        self.feature_names: list[str] = pkg["feature_names"]
        self.metrics: dict[str, Any] = pkg.get("metrics", {})
        self.fe = FeatureEngineer()
        self.fe.top_payers = pkg.get("top_payers", [])
        self.fe.feature_names = self.feature_names

    def predict(self, case: dict[str, Any]) -> dict[str, Any]:
        X = self.fe.features_from_case(case)
        prob = float(self.model.predict_proba(X)[0, 1])
        risk = round(prob * 100, 1)
        level = self._band(prob)
        return {
            "denial_risk": risk,
            "risk_level": level,
            "recommendations": self._recommend(case),
            "model": "xgboost",
            "model_auc": round(float(self.metrics.get("test_roc_auc", 0)), 3),
        }

    @staticmethod
    def _band(prob: float) -> str:
        if prob >= DENIAL_RISK_THRESHOLD_HIGH:
            return "HIGH"
        if prob < DENIAL_RISK_THRESHOLD_LOW:
            return "LOW"
        return "MEDIUM"

    @staticmethod
    def _recommend(case: dict[str, Any]) -> list[str]:
        nq = _num(case.get("total_questions"))
        answered = _num(case.get("answered_questions"))
        sup = _num(case.get("supportive_facts"))
        con = _num(case.get("contradictory_facts"))
        recs: list[str] = []

        if nq == 0:
            recs.append(
                "No questionnaire on file — generate and complete the CMM questionnaire before submitting."
            )
        if con > 0:
            recs.append(
                f"Resolve {int(con)} contradictory finding(s): reconcile records that conflict with the "
                "payer's criteria (top driver of denials in this data)."
            )
        if nq > 0 and sup == 0:
            recs.append(
                "No supporting facts found — attach clinical evidence (notes, labs) backing each answer."
            )
        elif nq > 0 and con > sup:
            recs.append(
                "Contradictory facts outweigh supporting ones — add documentation so support clearly exceeds conflicts."
            )
        if nq > 0 and answered < nq:
            recs.append(
                f"Complete {int(nq - answered)} unanswered question(s); incomplete forms are commonly rejected."
            )
        if not recs:
            recs.append("Documentation looks balanced — safe to submit, but spot-check high-impact answers.")
        return recs


def get_predictor() -> DenialPredictor:
    """Process-wide singleton (thread-safe lazy load)."""
    global _predictor
    if _predictor is None:
        with _lock:
            if _predictor is None:
                _predictor = DenialPredictor()
    return _predictor


if __name__ == "__main__":
    p = get_predictor()
    print(f"Loaded model (test AUC={p.metrics.get('test_roc_auc'):.3f})\n")
    for label, case in {
        "Clean case": {"total_questions": 10, "answered_questions": 10, "supportive_facts": 20, "contradictory_facts": 0, "medication_class": "Brand"},
        "Conflicted case": {"total_questions": 10, "answered_questions": 8, "supportive_facts": 3, "contradictory_facts": 12, "payer_name": "Fidelis Care"},
        "No questionnaire": {"total_questions": 0, "answered_questions": 0, "supportive_facts": 0, "contradictory_facts": 0},
    }.items():
        r = p.predict(case)
        print(f"{label}: {r['denial_risk']}% ({r['risk_level']})")
        for rec in r["recommendations"]:
            print(f"   - {rec}")
        print()
