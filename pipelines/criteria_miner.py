"""Phase 1b — Criteria miner: learn the per-drug approval checklist.

For each drug (normalized to its brand/first token) we mine, from historical
PA questionnaires, the recurring questions = the de-facto coverage criteria, and
contrast Approved vs Denied evidence to surface what *wins*.

NOTE: drug name is only populated on ~9% of cases, so we mine the drugs that
have enough volume (Zepbound, Injectafer, Venofer, ...). Questions are the real
criteria; supportive facts on approved cases are example "winning evidence".

Run:  ./venv/bin/python criteria_miner.py
"""

from __future__ import annotations

import json
import re
from collections import Counter

import pandas as pd

from denial_engine.core.config import APP_DATA_DIR
from denial_engine.ml.feature_engineer import fact_strings_from_questions

MIN_CASES = 8          # don't mine a drug with too little history
MIN_QUESTION_FREQ = 0.30  # a question must appear in >=30% of a drug's cases to be "criteria"


def brand(name: str) -> str:
    """'Zepbound 2.5MG/0.5ML pen-injectors' -> 'Zepbound'."""
    return re.split(r"[\s/0-9]", str(name).strip(), maxsplit=1)[0].title()


def core_question(q: dict) -> str | None:
    """Reduce a questionnaire item to its essential prompt (text up to the '?')."""
    txt = (q.get("question") or "").strip()
    if not txt:
        return None
    txt = re.sub(r"\s+", " ", txt)
    head = txt.split("?")[0].strip()
    return (head[:120] + "?") if head else None


def mine_drug(group: pd.DataFrame) -> dict:
    n = len(group)
    approvals = (group["response_status"] == "Approved").sum()

    q_counter: Counter[str] = Counter()
    for qs in group["questions"]:
        seen = set()
        for q in (qs if qs is not None else []):
            if isinstance(q, dict):
                cq = core_question(q)
                if cq:
                    seen.add(cq)
        q_counter.update(seen)

    criteria = [
        {"question": cq, "frequency": round(c / n, 2), "appears_in": c}
        for cq, c in q_counter.most_common()
        if c / n >= MIN_QUESTION_FREQ
    ]

    won = group[group["response_status"] == "Approved"]
    lost = group[group["response_status"] == "Denied"]
    winning = []
    for qs in won["questions"]:
        winning += fact_strings_from_questions(qs)[0]
    gaps = []
    for qs in lost["questions"]:
        gaps += fact_strings_from_questions(qs)[1]

    return {
        "n_cases": int(n),
        "approval_rate": round(approvals / n, 2),
        "criteria_checklist": criteria,
        "winning_evidence_examples": winning[:5],
        "common_denial_gaps": gaps[:5],
    }


def main() -> None:
    df = pd.read_parquet("data/training_data.parquet")
    df = df[df["medication_name"].notna()].copy()
    df["brand"] = df["medication_name"].map(brand)
    print(f"📂 {len(df):,} cases with a known drug · {df['brand'].nunique()} brands\n")

    kb: dict[str, dict] = {}
    for name, grp in df.groupby("brand"):
        if len(grp) >= MIN_CASES:
            kb[name] = mine_drug(grp)

    print(f"Mined criteria for {len(kb)} drugs (>= {MIN_CASES} cases each):\n")
    for name, info in sorted(kb.items(), key=lambda x: -x[1]["n_cases"]):
        print(f"  {name:14s}  n={info['n_cases']:3d}  approval={info['approval_rate']:.0%}  "
              f"criteria={len(info['criteria_checklist'])}")

    # Show one full example so the filing team can sanity-check the output.
    if kb:
        ex = max(kb, key=lambda k: kb[k]["n_cases"])
        print(f"\n── Example checklist: {ex} ──")
        for c in kb[ex]["criteria_checklist"][:6]:
            print(f"  [{c['frequency']:.0%}] {c['question']}")

    out = APP_DATA_DIR / "criteria_kb.json"
    out.write_text(json.dumps(kb, indent=2))
    print(f"\n💾 Wrote {out}  ({len(kb)} drugs)")


if __name__ == "__main__":
    main()
