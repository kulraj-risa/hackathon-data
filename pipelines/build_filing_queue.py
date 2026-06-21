"""Build a dummy PA filing worklist for the "Filing" demo tab.

Mirrors the pharmacy dashboard worklist (Patient / DOB / Medication / Insurance /
CoverMyMeds ID / Status) but with **synthetic, clearly-fake patient identities**
(no PHI) attached to **real extracted evidence** from training_data, chosen to
span the full routing spectrum: touchless AUTO_SUBMIT, human REVIEW, and BLOCK.

This is what powers the "watch it file the easy ones with no human touch" demo.

Run:  ./venv/bin/python build_filing_queue.py
"""

from __future__ import annotations

import hashlib
import json

import pandas as pd

from denial_engine.core.config import APP_DATA_DIR
from denial_engine.knowledge.criteria_kb import list_drugs, normalize_drug
from denial_engine.ml.denial_predictor import get_predictor
from denial_engine.ml.feature_engineer import fact_strings_from_questions

# Synthetic identities — obviously fake, generated locally, never real patients.
FIRST = ["Jordan", "Avery", "Riley", "Casey", "Morgan", "Quinn", "Reese", "Skyler",
         "Harper", "Rowan", "Sawyer", "Emerson"]
LAST = ["Bennett", "Carver", "Donovan", "Ellison", "Fontaine", "Granger", "Holloway",
        "Ingram", "Larsen", "Maddox", "Nolan", "Prescott"]
PLANS = ["Aetna Commercial", "UnitedHealthcare", "Cigna", "BCBS Federal", "Fidelis Care", "Humana"]

# Target spread so the demo shows all three lanes.
WANT = {"AUTO_SUBMIT": 4, "REVIEW": 3, "BLOCK": 4}


def _identity(seed: str) -> dict:
    """Deterministic fake identity from a hash so the queue is stable."""
    h = int(hashlib.sha1(seed.encode()).hexdigest(), 16)
    first = FIRST[h % len(FIRST)]
    last = LAST[(h // 7) % len(LAST)]
    yr = 1948 + (h % 60)
    mo = 1 + (h // 13) % 12
    day = 1 + (h // 29) % 28
    member = f"MBR-{(h % 9_000_000) + 1_000_000}"
    cmm = f"CMM{(h % 900_000) + 100_000}"
    return {
        "patient": f"{first} {last}",
        "dob": f"{yr}-{mo:02d}-{day:02d}",
        "member_id": member,
        "cmm_id": cmm,
    }


def main() -> None:
    kb_drugs = {d["drug"] for d in list_drugs()}
    df = pd.read_parquet("data/training_data.parquet")
    df = df[df["medication_name"].notna()].copy()
    df["brand"] = df["medication_name"].map(normalize_drug)
    df = df[df["brand"].isin(kb_drugs)]  # keep KB drugs so criteria match shows
    df = df.sample(frac=1, random_state=7)  # shuffle for variety, deterministic
    predictor = get_predictor()

    buckets: dict[str, list] = {k: [] for k in WANT}
    for idx, r in df.iterrows():
        if all(len(buckets[k]) >= WANT[k] for k in WANT):
            break
        sup, con = fact_strings_from_questions(r["questions"])
        if len(sup) + len(con) < 2:
            continue
        # The data's payer_name is actually a long form title; use a clean,
        # deterministic plan name for both scoring and the worklist display.
        clean_payer = PLANS[int(hashlib.sha1(str(idx).encode()).hexdigest(), 16) % len(PLANS)]
        case = {
            "drug": r["brand"],
            "medication_class": r.get("medication_class") or "Brand",
            "payer_name": clean_payer,
            "total_questions": int(r.get("total_questions") or len(sup) + len(con)),
            "answered_questions": int(r.get("answered_questions") or len(sup) + len(con)),
            "supportive_texts": sup[:5],
            "contradictory_texts": con[:5],
        }
        scored = predictor.predict(case)
        decision = scored.get("decision", "REVIEW")
        if len(buckets[decision]) >= WANT[decision]:
            continue
        ident = _identity(f"{r.get('identifier', idx)}-{idx}")
        buckets[decision].append({
            **ident,
            "drug": r["brand"],
            "medication": str(r["medication_name"]),
            "medication_class": case["medication_class"],
            "payer_name": case["payer_name"],
            "total_questions": case["total_questions"],
            "answered_questions": case["answered_questions"],
            "supportive_texts": case["supportive_texts"],
            "contradictory_texts": case["contradictory_texts"],
            "expected_decision": decision,
            "expected_risk": scored["denial_risk"],
        })

    # Interleave the lanes so the worklist looks like a realistic mixed queue.
    queue: list = []
    for k in ("AUTO_SUBMIT", "REVIEW", "BLOCK"):
        queue += buckets[k]
    queue.sort(key=lambda c: c["cmm_id"])

    dst = APP_DATA_DIR / "filing_queue.json"
    dst.write_text(json.dumps(queue, indent=2))
    counts = {k: len(v) for k, v in buckets.items()}
    print(f"🗂️  Filing queue: {len(queue)} dummy patients · {counts}")
    for c in queue:
        print(f"  {c['patient']:18s} {c['drug']:11s} {c['payer_name']:18s} "
              f"→ {c['expected_decision']:11s} ({c['expected_risk']:.0f}%)")
    print(f"\n💾 Wrote {dst}")


if __name__ == "__main__":
    main()
