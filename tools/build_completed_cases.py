"""Curate a set of previously-completed PAs (with full questionnaire + the
actual submitted answer + outcome) into app_data/completed_cases.json.

These are the cases the "Case QA Review" tab replays through our medical-necessity
engine so a judge can compare the bot's questionnaire answering + decision to what
was actually submitted and how the payer actually ruled.

Source: data/training_data.parquet (local only — never shipped to the container).
Output: app_data/completed_cases.json (PHI-safe: synthetic-free historical Q&A).

Run:  PYTHONPATH=src python tools/build_completed_cases.py [--n 60]
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pandas as pd

DATA = Path("data/training_data.parquet")
OUT = Path("app_data/completed_cases.json")
_QUOTED = re.compile(r"'([^']*)'|\"([^\"]*)\"")


def _facts(blob) -> list[str]:
    if blob is None:
        return []
    out = [a or b for a, b in _QUOTED.findall(str(blob))]
    return [f.strip() for f in out if f and f.strip() and f.strip() != "[]"]


def _opts(options) -> list[str]:
    if options is None:
        return []
    try:
        seq = list(options)
    except TypeError:
        return []
    return [str(o).strip() for o in seq if str(o).strip()][:8]


def build_case(row) -> dict | None:
    questions = row["questions"]
    if questions is None or len(questions) == 0:
        return None
    sup: list[str] = []
    con: list[str] = []
    qlist: list[dict] = []
    for q in list(questions):
        if not isinstance(q, dict):
            continue
        api = q.get("api_response") or {}
        facts = api.get("facts") or {}
        sup += _facts(facts.get("supportive_facts"))
        con += _facts(facts.get("contradictory_facts"))
        qtext = str(q.get("question") or "").strip()
        if not qtext:
            continue
        qlist.append(
            {
                "question": qtext[:400],
                "question_name": str(q.get("question_name") or "")[:120] or None,
                "options": _opts(q.get("options")),
                "actual_answer": str(q.get("answer") or "").strip()[:200] or None,
                "type": str(q.get("type") or "")[:40] or None,
            }
        )
    if len(qlist) < 3:
        return None
    # de-dupe evidence, keep it tight
    sup = list(dict.fromkeys(s[:240] for s in sup))[:12]
    con = list(dict.fromkeys(c[:240] for c in con))[:12]
    return {
        "case_id": str(row["identifier"])[:8],
        "drug": str(row["medication_name"]),
        "medication_class": (
            str(row["medication_class"])
            if str(row["medication_class"]) not in ("nan", "None", "")
            else "Brand"
        ),
        "payer_name": str(row["payer_name"]),
        "actual_outcome": str(row["response_status"]),
        "total_questions": int(row["total_questions"]) if pd.notna(row["total_questions"]) else len(qlist),
        "answered_questions": int(row["answered_questions"]) if pd.notna(row["answered_questions"]) else len(qlist),
        "supportive_texts": sup,
        "contradictory_texts": con,
        "questions": qlist[:25],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=160, help="total cases sampled (balanced approved/denied; some drop if <3 questions)")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    df = pd.read_parquet(DATA)
    named = df[
        df.medication_name.notna()
        & (df.medication_name.astype(str) != "nan")
        & df.payer_name.notna()
        & (df.payer_name.astype(str) != "nan")
        & df.response_status.isin(["Approved", "Denied"])
    ]
    half = args.n // 2
    appr = named[named.response_status == "Approved"].sample(
        min(half, (named.response_status == "Approved").sum()), random_state=args.seed
    )
    deny = named[named.response_status == "Denied"].sample(
        min(args.n - half, (named.response_status == "Denied").sum()), random_state=args.seed
    )
    sample = pd.concat([appr, deny]).sample(frac=1, random_state=args.seed)

    cases = []
    for _, row in sample.iterrows():
        c = build_case(row)
        if c:
            cases.append(c)

    OUT.write_text(json.dumps(cases, indent=2))
    n_appr = sum(1 for c in cases if c["actual_outcome"] == "Approved")
    print(f"wrote {len(cases)} completed cases -> {OUT}")
    print(f"  approved={n_appr}  denied={len(cases) - n_appr}")
    print(f"  avg questions/case = {sum(len(c['questions']) for c in cases) / (len(cases) or 1):.1f}")
    print(f"  drugs: {sorted({c['drug'] for c in cases})[:8]} ...")


if __name__ == "__main__":
    main()
