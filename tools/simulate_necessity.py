#!/usr/bin/env python
"""Simulate the Medical Necessity Engine on real historical PA cases.

Loads labeled cases from data/training_data.parquet (10k outcomes), reconstructs
each case's evidence from the per-question supportive/contradictory facts, runs
the full multi-agent pipeline, and scores the engine's prediction against the
actual payer outcome.

Usage:
    python simulate_necessity.py                # fast, deterministic, n=40 balanced
    python simulate_necessity.py --n 200        # larger deterministic run
    python simulate_necessity.py --llm --n 12   # full agentic LLM run (slower)
    python simulate_necessity.py --trace        # print a full staged trace
"""
from __future__ import annotations

import argparse
import json
import random
from typing import Any

import numpy as np
import pandas as pd

from denial_engine.agents import necessity_engine as ne
from denial_engine.knowledge.criteria_kb import get_drug, normalize_drug

PARQUET = "data/training_data.parquet"


def _to_list(x: Any) -> list[str]:
    if x is None:
        return []
    if isinstance(x, np.ndarray):
        x = x.tolist()
    if isinstance(x, (list, tuple)):
        return [str(i) for i in x if i is not None and str(i).strip()]
    return [str(x)] if str(x).strip() else []


def case_evidence(row: pd.Series) -> tuple[list[str], list[str], list[dict]]:
    """Reconstruct supportive/contradictory evidence + question list from a row."""
    sup: list[str] = []
    con: list[str] = []
    questions: list[dict] = []
    qs = row.get("questions")
    if isinstance(qs, np.ndarray):
        qs = qs.tolist()
    for q in qs or []:
        if not isinstance(q, dict):
            continue
        questions.append({"question": q.get("question")})
        facts = (q.get("api_response") or {}).get("facts") or {}
        sup += _to_list(facts.get("supportive_facts"))
        con += _to_list(facts.get("contradictory_facts"))
    # de-dup, keep order
    sup = list(dict.fromkeys(sup))
    con = list(dict.fromkeys(con))
    return sup, con, questions


def sample_cases(df: pd.DataFrame, n: int, balanced: bool) -> pd.DataFrame:
    # only cases whose drug is in our KB and that have evidence
    df = df.copy()
    df = df[df["medication_name"].notna()]
    df["drug_norm"] = df["medication_name"].apply(
        lambda m: normalize_drug(m) if isinstance(m, str) else None
    )
    df = df[df["drug_norm"].apply(lambda d: bool(d and get_drug(d)))]
    df = df[df["questions"].apply(lambda q: q is not None and len(q) > 0)]
    if balanced:
        ap = df[df["response_status"] == "Approved"]
        de = df[df["response_status"] == "Denied"]
        k = min(n // 2, len(ap), len(de))
        return pd.concat([ap.sample(k, random_state=7), de.sample(k, random_state=7)]).sample(
            frac=1, random_state=7
        )
    return df.sample(min(n, len(df)), random_state=7)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=40)
    ap.add_argument("--llm", action="store_true", help="use the LLM agents (slower)")
    ap.add_argument("--trace", action="store_true", help="print a full staged trace")
    ap.add_argument("--unbalanced", action="store_true")
    args = ap.parse_args()

    if not args.llm:
        # force the deterministic, KB-grounded path everywhere: stub the whole
        # LLM surface so every agent falls back (even those that call
        # complete_json directly).
        ne.llm.available = lambda: False  # type: ignore[assignment]
        ne.llm.complete_json = lambda *a, **k: None  # type: ignore[assignment]
        ne.llm.complete = lambda *a, **k: None  # type: ignore[assignment]

    print(f"Loading {PARQUET} …")
    df = pd.read_parquet(PARQUET)
    cases = sample_cases(df, args.n, balanced=not args.unbalanced)
    print(f"Running {len(cases)} cases · mode={'LLM agents' if args.llm else 'deterministic'}\n")

    rows: list[dict] = []
    for i, (_, row) in enumerate(cases.iterrows()):
        drug = row["drug_norm"]
        payer = row.get("payer_name") if isinstance(row.get("payer_name"), str) else None
        sup, con, questions = case_evidence(row)
        result = ne.run_medical_necessity(
            drug=drug, payer=payer,
            supportive_texts=sup, contradictory_texts=con,
            questions=questions,
        )
        actual = row["response_status"]  # Approved | Denied
        prob = result["scores"]["overall_approval_probability"] or 50
        pred = result["final_prediction"]  # APPROVE | PEND | DENY
        # classifier from probability (threshold tuned to the 60% base rate)
        prob_pred = "Approved" if prob >= 55 else "Denied"
        rows.append({
            "drug": drug, "payer": payer, "actual": actual,
            "prob": prob, "prob_pred": prob_pred, "final": pred,
            "path": result["recommended_path"],
        })
        if args.trace and i == 0:
            print("── SAMPLE STAGED TRACE ───────────────────────────────────")
            print(f"drug={drug} payer={payer} actual={actual}")
            for t in result["agents"]:
                print(f"  • {t['agent']}  [{t['mode']}]")
            print("scores:", json.dumps(result["scores"]))
            print("final:", json.dumps(result["final"], default=str)[:600])
            print("──────────────────────────────────────────────────────────\n")

    res = pd.DataFrame(rows)
    # Probability-classifier accuracy
    correct = (res["prob_pred"] == res["actual"]).sum()
    acc = correct / len(res) * 100
    # Confusion
    tp = len(res[(res.actual == "Approved") & (res.prob_pred == "Approved")])
    tn = len(res[(res.actual == "Denied") & (res.prob_pred == "Denied")])
    fp = len(res[(res.actual == "Denied") & (res.prob_pred == "Approved")])
    fn = len(res[(res.actual == "Approved") & (res.prob_pred == "Denied")])
    prec = tp / (tp + fp) * 100 if (tp + fp) else 0
    rec = tp / (tp + fn) * 100 if (tp + fn) else 0

    print("══════════════ RESULTS ══════════════")
    print(f"Cases: {len(res)}  ({(res.actual=='Approved').sum()} approved / {(res.actual=='Denied').sum()} denied)")
    print(f"Probability-classifier accuracy : {acc:.1f}%  ({correct}/{len(res)})")
    print(f"  Precision (approve) : {prec:.1f}%   Recall (approve) : {rec:.1f}%")
    print(f"  Confusion  TP={tp} TN={tn} FP={fp} FN={fn}")
    print(f"Avg approval probability        : {res['prob'].mean():.1f}%")
    print(f"  on actually-approved : {res[res.actual=='Approved']['prob'].mean():.1f}%")
    print(f"  on actually-denied   : {res[res.actual=='Denied']['prob'].mean():.1f}%")
    sep = res[res.actual == "Approved"]["prob"].mean() - res[res.actual == "Denied"]["prob"].mean()
    print(f"  separation (approved − denied) : {sep:+.1f} pts")
    print("Recommended-path distribution   :", res["path"].value_counts().to_dict())
    if args.llm:
        print("Final-prediction distribution    :", res["final"].value_counts().to_dict())


if __name__ == "__main__":
    main()
