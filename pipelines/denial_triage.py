"""Phase 1a — Denial triage: split denials into addressable vs. not.

Business logic (see docs/ROADMAP.md):
  - NOT_COVERED      -> formulary/benefit exclusion. NOT fixable with docs;
                        must re-initiate via a different form / alternative agent.
  - STEP_THERAPY     -> must document prior trial & failure of preferred agents.
  - MEDICAL_NECESSITY-> must supply clinical evidence meeting criteria.
  - OTHER            -> couldn't confidently classify.

NOTE: the data has no explicit denial-reason field, so the category is **inferred
from the contradictory-fact language** RISA already extracts. This is an
approximation meant to size the opportunity (addressable %), not a billing code.

Run:  ./venv/bin/python denial_triage.py
"""

from __future__ import annotations

import json

import pandas as pd

from denial_engine.core.config import APP_DATA_DIR
from denial_engine.ml.feature_engineer import answers_from_questions, fact_strings_from_questions

# Explicit coverage-exclusion phrases -> a hard NOT_COVERED signal.
NOT_COVERED = [
    "not covered", "non-formulary", "not on formulary", "not on the formulary",
    "formulary exclusion", "excluded from", "not a covered", "plan does not cover",
    "coverage is not", "benefit exclusion", "not a benefit", "plan exclusion",
]
STEP_THERAPY = [
    "step therapy", "step-therapy", "preferred agent", "preferred drug",
    "tried and failed", "trial and failure", "prior therapy", "prior use",
    "first-line", "first line", "same-class", "same class", "prior trial",
    "no record of prior", "discontinued for", "failed", "preferred",
]
MEDICAL_NECESSITY = [
    "medical necess", "medically necessary", "criteria", "no documentation",
    "not documented", "no record", "documentation", "diagnosis", "indication",
    "necessity", "no follow-up", "follow-up", "insufficient", "not mentioned",
    "not provided", "not established", "no evidence", "outdated", "lab",
]

CATEGORIES = ("NOT_COVERED", "STEP_THERAPY", "MEDICAL_NECESSITY", "OTHER", "NO_EVIDENCE")
ADDRESSABLE = {"STEP_THERAPY", "MEDICAL_NECESSITY"}


def _hits(text: str, phrases: list[str]) -> int:
    t = text.lower()
    return sum(1 for p in phrases if p in t)


def classify_case(questions) -> tuple[str, dict[str, int]]:
    """Return (primary_category, per-category hit counts) for one case."""
    _, con = fact_strings_from_questions(questions)
    if not con:
        # RISA extracted no contradictory evidence — we can't infer the driver.
        return "NO_EVIDENCE", {"NOT_COVERED": 0, "STEP_THERAPY": 0, "MEDICAL_NECESSITY": 0}
    blob = " ".join(con + answers_from_questions(questions))
    scores = {
        "NOT_COVERED": _hits(blob, NOT_COVERED),
        "STEP_THERAPY": _hits(blob, STEP_THERAPY),
        "MEDICAL_NECESSITY": _hits(blob, MEDICAL_NECESSITY),
    }
    # A coverage exclusion is a hard blocker — it dominates if present.
    if scores["NOT_COVERED"] > 0:
        return "NOT_COVERED", scores
    if scores["STEP_THERAPY"] == 0 and scores["MEDICAL_NECESSITY"] == 0:
        return "OTHER", scores
    primary = "STEP_THERAPY" if scores["STEP_THERAPY"] >= scores["MEDICAL_NECESSITY"] else "MEDICAL_NECESSITY"
    return primary, scores


def main() -> None:
    df = pd.read_parquet("data/training_data.parquet")
    denied = df[df["response_status"] == "Denied"]
    print(f"📂 {len(df):,} cases · {len(denied):,} denied ({len(denied)/len(df):.0%})\n")

    counts = {c: 0 for c in CATEGORIES}
    for q in denied["questions"]:
        cat, _ = classify_case(q)
        counts[cat] += 1

    n = len(denied) or 1
    addressable = sum(counts[c] for c in ADDRESSABLE)
    tags = {
        "STEP_THERAPY": "addressable ✅", "MEDICAL_NECESSITY": "addressable ✅",
        "NOT_COVERED": "not addressable ❌", "OTHER": "unclear ❔",
        "NO_EVIDENCE": "no reason captured ⚠️",
    }
    print("Inferred denial mix (from contradictory-fact language):")
    for c in CATEGORIES:
        print(f"  {c:18s}: {counts[c]:5d}  ({counts[c]/n*100:5.1f}%)   {tags[c]}")
    print("-" * 56)
    print(f"  ADDRESSABLE (ST + MN): {addressable:,} of {n:,}  = {addressable/n*100:.1f}% of denials")
    overall_denial = len(denied) / len(df) * 100
    print(f"  → of the {overall_denial:.0f}% denial rate, ~{overall_denial*addressable/n:.0f} pts are winnable with better clinicals/docs")

    out = APP_DATA_DIR / "triage.json"
    out.write_text(json.dumps({
        "denied": int(len(denied)),
        "total": int(len(df)),
        "counts": counts,
        "addressable": int(addressable),
        "addressable_pct": round(addressable / n * 100, 1),
        "note": "Categories inferred from contradictory-fact text; no explicit denial-reason field exists.",
    }, indent=2))
    print(f"\n💾 Wrote {out}")


if __name__ == "__main__":
    main()
