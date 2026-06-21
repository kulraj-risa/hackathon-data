"""Build enriched, de-identified INSIGHTS for the dashboard (offline, no PHI).

Unlike ``build_app_data.py`` this needs no BigQuery access -- it derives
everything from the local training sample (``data/training_data.parquet``) and
the trained model package (``app_data/denial_model.pkl``):

  - model performance metrics (AUC / precision / recall / F1)
  - denial rate vs. contradictory-fact count (the headline signal)
  - denial rate vs. supportive-fact count
  - denial rate vs. questionnaire completeness
  - the evidence phrases that most move denial risk up / down

Outputs are aggregate counts/rates only (safe to ship in the API image).

    ./venv/bin/python build_insights.py
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from denial_engine.core.config import APP_DATA_DIR
from denial_engine.ml.feature_engineer import FeatureEngineer, aggregates_from_questions

PARQUET = "data/training_data.parquet"
MODEL = APP_DATA_DIR / "denial_model.pkl"
MIN_SUPPORT = 120  # min cases for a term/bucket to be reported


def _rate(mask: pd.Series, denied: pd.Series) -> dict:
    n = int(mask.sum())
    return {
        "cases": n,
        "denials": int(denied[mask].sum()) if n else 0,
        "denial_rate": round(float(denied[mask].mean()) * 100, 1) if n else 0.0,
    }


def _bucketed(values: pd.Series, denied: pd.Series, edges, labels) -> list[dict]:
    out = []
    for lo, hi, label in zip(edges[:-1], edges[1:], labels):
        mask = (values >= lo) & (values < hi)
        row = _rate(mask, denied)
        row["bucket"] = label
        out.append(row)
    return out


def main() -> None:
    df = pd.read_parquet(PARQUET)
    denied = (df["response_status"] == "Denied").astype(int)
    n = len(df)

    # Per-case fact counts.
    counts = df["questions"].apply(aggregates_from_questions)
    sup = counts.apply(lambda d: d["supportive_facts"])
    con = counts.apply(lambda d: d["contradictory_facts"])
    total_q = df["total_questions"].fillna(0)
    answered = df["answered_questions"].fillna(0)
    completeness = np.where(total_q > 0, answered / total_q, np.nan)

    insights: dict = {}

    # --- Headline: denial rate vs contradictory facts -------------------------
    insights["denial_by_contradictions"] = _bucketed(
        con, denied,
        edges=[0, 1, 2, 3, 5, 9, 1e9],
        labels=["0", "1", "2", "3-4", "5-8", "9+"],
    )
    insights["denial_by_supportive"] = _bucketed(
        sup, denied,
        edges=[0, 1, 3, 6, 11, 1e9],
        labels=["0", "1-2", "3-5", "6-10", "11+"],
    )

    # --- Completeness (only cases with a questionnaire) -----------------------
    comp = pd.Series(completeness)
    comp_rows = []
    for lo, hi, label in [(0, 0.5, "<50%"), (0.5, 0.8, "50-80%"),
                          (0.8, 1.0, "80-99%"), (1.0, 1.01, "100%")]:
        mask = (comp >= lo) & (comp < hi)
        row = _rate(mask, denied)
        row["bucket"] = label
        comp_rows.append(row)
    insights["denial_by_completeness"] = comp_rows

    # --- Evidence phrases that move risk most (lift vs. base rate) ------------
    pkg = joblib.load(MODEL)
    fe = FeatureEngineer()
    fe.feature_names = pkg["feature_names"]
    fe.top_payers = pkg.get("top_payers", [])
    docs = [d.lower() for d in fe.fact_texts(df)]
    docs_series = pd.Series(docs)
    base = float(denied.mean())

    drivers = []
    for key in pkg.get("feature_importance", {}):
        if not key.startswith("fact::"):
            continue
        term = key[len("fact::"):].strip()
        if len(term) < 4 or any(ch.isdigit() for ch in term):
            continue  # skip numeric/code noise like "00 00", "e66", "fr 38"
        present = docs_series.str.contains(rf"\b{term}\b", regex=True, na=False)
        npres = int(present.sum())
        if npres < MIN_SUPPORT:
            continue
        rate = float(denied[present].mean())
        drivers.append({
            "term": term,
            "cases": npres,
            "denial_rate": round(rate * 100, 1),
            "lift": round((rate - base) * 100, 1),  # pp above/below base rate
        })

    drivers.sort(key=lambda d: d["lift"], reverse=True)
    insights["risk_up_terms"] = drivers[:10]
    insights["risk_down_terms"] = sorted(drivers, key=lambda d: d["lift"])[:8]
    insights["base_denial_rate"] = round(base * 100, 1)

    # --- Model performance card ----------------------------------------------
    m = pkg.get("metrics", {})
    vocab = len(pkg["vectorizer"].get_feature_names_out()) if pkg.get("vectorizer") else 0
    insights["model"] = {
        "roc_auc": round(float(m.get("test_roc_auc", 0)), 3),
        "accuracy": round(float(m.get("test_accuracy", 0)), 3),
        "precision": round(float(m.get("test_precision", 0)), 3),
        "recall": round(float(m.get("test_recall", 0)), 3),
        "f1": round(float(m.get("test_f1", 0)), 3),
        "n_train": int(m.get("n_train", 0)),
        "n_test": int(m.get("n_test", 0)),
        "numeric_features": len(pkg["feature_names"]),
        "vocab_size": vocab,
        "baseline_auc": 0.642,  # numeric-only model (see commit history)
    }

    (APP_DATA_DIR / "insights.json").write_text(json.dumps(insights, indent=2))
    print(f"💾 insights.json  ({n:,} cases analyzed)")
    print(f"   model AUC {insights['model']['roc_auc']}  ·  base denial {base:.1%}")
    print(f"   {len(drivers)} evidence terms scored; top risk driver: "
          f"{insights['risk_up_terms'][0]['term'] if insights['risk_up_terms'] else 'n/a'}")


if __name__ == "__main__":
    main()
