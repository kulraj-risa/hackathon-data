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
from scipy.sparse import csr_matrix, hstack

from config import (
    APP_DATA_DIR,
    DENIAL_RISK_THRESHOLD_HIGH,
    DENIAL_RISK_THRESHOLD_LOW,
)
from feature_engineer import FeatureEngineer, _num, case_fact_strings

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
        self.vectorizer = pkg.get("vectorizer")
        self.metrics: dict[str, Any] = pkg.get("metrics", {})
        self.fe = FeatureEngineer()
        self.fe.top_payers = pkg.get("top_payers", [])
        self.fe.feature_names = self.feature_names

    def predict(self, case: dict[str, Any]) -> dict[str, Any]:
        Xnum = self.fe.features_from_case(case)
        if self.vectorizer is not None:
            doc = self.fe.fact_text_from_case(case)
            Xtxt = self.vectorizer.transform([doc])
            X = hstack([csr_matrix(Xnum.values), Xtxt]).tocsr()
        else:  # legacy numeric-only artifact
            X = Xnum
        prob = float(self.model.predict_proba(X)[0, 1])
        risk = round(prob * 100, 1)
        level = self._band(prob)
        return {
            "denial_risk": risk,
            "risk_level": level,
            "recommendations": self._recommend(case),
            "model": "xgboost+tfidf" if self.vectorizer is not None else "xgboost",
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
        sup_texts, con_texts, _ = case_fact_strings(case)
        sup = _num(case.get("supportive_facts")) or float(len(sup_texts))
        con = _num(case.get("contradictory_facts")) or float(len(con_texts))
        recs: list[str] = []

        if nq == 0:
            recs.append(
                "No questionnaire evaluated — every criterion is effectively Undetermined. "
                "Generate and complete the CMM questionnaire before submitting."
            )

        # Contradictory facts: per RISA evidence-evaluation, these undermine the
        # leaf verdict. Classify them into authentic failure modes when we have
        # the fact text, otherwise fall back to a count-based recommendation.
        if con_texts:
            for mode, example in _classify_contradictions(con_texts).items():
                recs.append(f"{FAILURE_MODES[mode]} (e.g. \u201c{_clip(example)}\u201d)")
        elif con > 0:
            recs.append(
                f"Resolve {int(con)} contradictory finding(s): each is a False/contradicted "
                "criterion and the top denial driver in this data."
            )

        if nq > 0 and sup == 0:
            recs.append(
                "No supportive facts cited — leaves will resolve to Undetermined rather than True. "
                "Attach clinical evidence (notes, labs) that supports each answer."
            )
        elif nq > 0 and con > sup:
            recs.append(
                "Contradictory facts outweigh supportive ones — strengthen documentation so "
                "supporting evidence clearly exceeds conflicts before the AND-rollup."
            )

        if nq > 0 and answered < nq:
            recs.append(
                f"Complete {int(nq - answered)} unanswered question(s); unevaluated leaves roll "
                "up to Undetermined and are commonly rejected."
            )
        if not recs:
            recs.append(
                "Evidence looks balanced (supportive facts present, no contradictions) — "
                "safe to submit, but spot-check high-impact answers."
            )
        return recs


# Failure-mode taxonomy for contradictory facts, framed in RISA's
# evidence-evaluation vocabulary (Stage 3: per-criterion True/False/Undetermined
# with supportive & contradictory facts). Each key maps a set of trigger terms
# to a remediation message.
_FAILURE_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("step_therapy", ("step therapy", "prior therapy", "first-line", "first line",
                       "previously tried", "tried and failed", "step edit", "preferred agent")),
    ("diagnosis", ("diagnosis", "indication", "not indicated", "off-label", "off label",
                   "icd", "approved use", "fda-approved")),
    ("dosing", ("dose", "dosing", "quantity", "frequency", "days supply", "mg ",
                "max dose", "exceeds", "qty", "units")),
    ("labs", ("lab", "biomarker", "egfr", "her2", "pd-l1", "stage ", "test result",
              "lab value", "level", "mutation", "ecog")),
    ("documentation", ("not documented", "no documentation", "missing", "lacks",
                       "no evidence", "unable to", "not found", "absent", "not provided",
                       "no record")),
    ("criteria", ("criteria not met", "does not meet", "not met", "requirement",
                  "fails to", "not satisfy", "ineligible", "not eligible")),
]

FAILURE_MODES: dict[str, str] = {
    "step_therapy": "Step-therapy / prior-treatment criterion contradicted — document the "
                    "required prior therapies or attach a documented exception",
    "diagnosis": "Diagnosis / indication conflict — confirm the ICD aligns with the drug's "
                 "approved indication, or add medical-necessity justification",
    "dosing": "Dose / quantity criterion contradicted — reconcile the requested dose, "
              "quantity, or days-supply against plan limits",
    "labs": "Required lab / biomarker evidence contradicted or missing — attach the "
            "supporting test results (stage, biomarker, ECOG, etc.)",
    "documentation": "Missing-evidence contradiction — the clinical record does not back "
                     "this criterion; attach the supporting note before submission",
    "criteria": "Coverage criterion explicitly not met — address the unmet requirement or "
                "pursue an alternative covered agent",
    "other": "Contradictory finding conflicts with payer criteria — reconcile the record "
             "before submitting",
}


def _classify_contradictions(con_texts: list[str]) -> dict[str, str]:
    """Map each contradictory fact to a failure mode; keep one example per mode."""
    found: dict[str, str] = {}
    for text in con_texts:
        low = text.lower()
        mode = "other"
        for name, terms in _FAILURE_RULES:
            if any(t in low for t in terms):
                mode = name
                break
        found.setdefault(mode, text)
    return found


def _clip(text: str, n: int = 90) -> str:
    text = " ".join(str(text).split())
    return text if len(text) <= n else text[: n - 1] + "\u2026"


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
        "Conflicted (text facts)": {
            "total_questions": 10, "answered_questions": 8,
            "supportive_texts": ["Patient diagnosis matches FDA-approved indication."],
            "contradictory_texts": [
                "No documentation of prior step-therapy with a preferred agent.",
                "Requested quantity exceeds the plan's max days-supply limit.",
                "Required PD-L1 biomarker test result not found in the record.",
            ],
            "payer_name": "Fidelis Care",
        },
        "No questionnaire": {"total_questions": 0, "answered_questions": 0, "supportive_facts": 0, "contradictory_facts": 0},
    }.items():
        r = p.predict(case)
        print(f"{label}: {r['denial_risk']}% ({r['risk_level']})")
        for rec in r["recommendations"]:
            print(f"   - {rec}")
        print()
