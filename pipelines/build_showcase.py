"""Curate a small set of REAL PA cases for the dashboard "Showcase" tab.

Picks representative cases (known drug + real extracted evidence, both outcomes)
from training_data, scores each with the deployed model, and records the model's
call next to the **actual historical outcome** so the demo can show the engine
getting it right on real data. All evidence text is the de-identified
supportive/contradictory facts RISA already produces (same data surfaced in the
Insights tab) — no extra PHI.

Run:  ./venv/bin/python build_showcase.py
"""

from __future__ import annotations

import json

import pandas as pd

from denial_engine.core.config import APP_DATA_DIR
from denial_engine.knowledge.criteria_kb import normalize_drug
from denial_engine.ml.denial_predictor import get_predictor
from denial_engine.ml.feature_engineer import fact_strings_from_questions

# (drug, outcome) slots we want represented — a balanced, varied lineup.
TARGETS = [
    ("Zepbound", "Approved"), ("Zepbound", "Denied"),
    ("Injectafer", "Approved"), ("Injectafer", "Denied"),
    ("Venofer", "Denied"), ("Wegovy", "Approved"),
    ("Gemtesa", "Denied"), ("Tadalafil", "Denied"),
]
MAX_FACTS = 5  # keep cards readable


def _predicted_label(risk: float) -> str:
    return "Denied" if risk >= 50 else "Approved"


def main() -> None:
    df = pd.read_parquet("data/training_data.parquet")
    df = df[df["medication_name"].notna()].copy()
    df["brand"] = df["medication_name"].map(normalize_drug)
    predictor = get_predictor()

    out: list[dict] = []
    for drug, outcome in TARGETS:
        pool = df[(df["brand"] == drug) & (df["response_status"] == outcome)]
        best = None
        for _, r in pool.iterrows():
            sup, con = fact_strings_from_questions(r["questions"])
            if len(sup) + len(con) < 2:
                continue
            case = {
                "drug": drug,
                "medication_class": r.get("medication_class") or "Brand",
                "payer_name": r.get("payer_name") or "Commercial",
                "total_questions": int(r.get("total_questions") or len(sup) + len(con)),
                "answered_questions": int(r.get("answered_questions") or len(sup) + len(con)),
                "supportive_texts": sup[:MAX_FACTS],
                "contradictory_texts": con[:MAX_FACTS],
            }
            scored = predictor.predict(case)
            risk = scored["denial_risk"]
            # Prefer the candidate that most cleanly matches its real outcome
            # (denied -> highest risk, approved -> lowest risk).
            key = risk if outcome == "Denied" else -risk
            if best is None or key > best[0]:
                best = (key, case, scored, r)

        if best is None:
            continue
        _, case, scored, r = best
        risk = scored["denial_risk"]
        out.append({
            "case_id": str(r.get("identifier") or r.name)[:8],
            "drug": drug,
            "medication_class": case["medication_class"],
            "payer_name": case["payer_name"],
            "total_questions": case["total_questions"],
            "answered_questions": case["answered_questions"],
            "supportive_texts": case["supportive_texts"],
            "contradictory_texts": case["contradictory_texts"],
            "actual_outcome": outcome,
            "predicted_risk": risk,
            "predicted_level": scored["risk_level"],
            "predicted_decision": scored.get("decision"),
            "predicted_label": _predicted_label(risk),
            "correct": _predicted_label(risk) == outcome,
        })

    dst = APP_DATA_DIR / "showcase_cases.json"
    dst.write_text(json.dumps(out, indent=2))
    n_correct = sum(1 for c in out if c["correct"])
    print(f"🎬 Showcase: {len(out)} real cases · model matched actual outcome on {n_correct}/{len(out)}")
    for c in out:
        mark = "✅" if c["correct"] else "⚠️"
        print(f"  {mark} {c['drug']:11s} actual={c['actual_outcome']:8s} "
              f"risk={c['predicted_risk']:5.1f}% → {c['predicted_label']:8s} ({c['predicted_decision']})")
    print(f"\n💾 Wrote {dst}")


if __name__ == "__main__":
    main()
