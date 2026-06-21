"""Build de-identified data artifacts for the hosted dashboard.

Run LOCALLY (where Application Default Credentials can reach the prod
BigQuery project). Produces only aggregated / de-identified outputs that are
safe to bake into the Cloud Run container -- NO patient PHI.

Outputs (written to app_data/):
  - denial_stats.csv        : denial rate by drug class + payer (Query 3)
  - summary.json            : headline dataset metrics
  - sample_cases.json       : a few de-identified sample cases for the demo
"""

import json
from pathlib import Path

import pandas as pd

from denial_engine.core.config import PROJECT_ROOT
from pipelines.data_loader import DataLoader

APP_DATA_DIR = PROJECT_ROOT / "app_data"
APP_DATA_DIR.mkdir(exist_ok=True)

# Fields that must never be exported to the hosted app.
PHI_FIELDS = {
    "patient_name", "patient_first_name", "patient_last_name",
    "dob", "patient_dob", "patient_mrn", "patient_member_id",
    "patient_phone_number", "patient_address_street1", "patient_address_street2",
}


def _deidentify_case(row: pd.Series) -> dict:
    """Keep only non-PHI, model-relevant fields from a case."""
    return {
        "case_id": str(row.get("identifier", ""))[:8],  # truncated UUID, not PHI
        "medication_name": row.get("medication_name"),
        "medication_class": row.get("medication_class"),
        "payer_name": row.get("payer_name"),
        "response_status": row.get("response_status"),
        "total_questions": int(row.get("total_questions") or 0),
        "answered_questions": int(row.get("answered_questions") or 0),
    }


def main() -> None:
    loader = DataLoader()
    if not loader.test_connection():
        raise SystemExit("BigQuery connection failed; cannot build app data.")

    # Query 3 -> denial stats (already aggregated, no PHI)
    stats = loader.get_denial_statistics(limit=50, min_cases=10)
    stats.to_csv(APP_DATA_DIR / "denial_stats.csv", index=False)
    print(f"💾 denial_stats.csv ({len(stats)} rows)")

    # Headline metrics from the saved training sample (built earlier)
    df = loader.load_from_disk("training_data.parquet")
    assert not (PHI_FIELDS & set(df.columns)), "PHI column leaked into dataset!"

    with_q = df["total_questions"].fillna(0).gt(0)
    summary = {
        "total_cases": int(len(df)),
        "approved": int((df["response_status"] == "Approved").sum()),
        "denied": int((df["response_status"] == "Denied").sum()),
        "approval_rate_pct": round(
            (df["response_status"] == "Approved").mean() * 100, 1
        ),
        "cases_with_questionnaire": int(with_q.sum()),
        "avg_questions": round(
            float(df.loc[with_q, "total_questions"].mean() or 0), 1
        ),
        "top_denial_segments": stats.head(5).to_dict(orient="records"),
    }
    (APP_DATA_DIR / "summary.json").write_text(json.dumps(summary, indent=2))
    print(f"💾 summary.json")

    # A few de-identified sample cases (one approved, one denied if available)
    samples = []
    for status in ("Denied", "Approved"):
        subset = df[(df["response_status"] == status) & with_q]
        if len(subset):
            samples.append(_deidentify_case(subset.iloc[0]))
    (APP_DATA_DIR / "sample_cases.json").write_text(json.dumps(samples, indent=2))
    print(f"💾 sample_cases.json ({len(samples)} cases)")

    print("\n✅ App data built (de-identified, safe to deploy).")


if __name__ == "__main__":
    main()
