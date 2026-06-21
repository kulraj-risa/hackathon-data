"""Push the Criteria KB (+ triage summary) to Firestore on rapids-platform.

Target: project `rapids-platform`, database `risa-denial-hackathon` (an isolated
Firestore DB — keeps experiments away from the prod `pharmacy` / `(default)` DBs).

Layout:
  criteria_kb/{drug}     ← one doc per drug (unified KB from build_criteria_kb.py)
  meta/kb_summary        ← counts + sources + build time
  meta/triage            ← addressable-denial summary from denial_triage.py

Auth: application-default credentials (you ran `gcloud auth`). 
Usage:
  ./venv/bin/python firestore_sync.py --dry-run     # preview, no writes
  ./venv/bin/python firestore_sync.py               # write to Firestore
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone

from google.cloud import firestore

from denial_engine.core.config import APP_DATA_DIR

PROJECT = "rapids-platform"
DATABASE = "risa-denial-hackathon"


def _load(name: str) -> dict:
    p = APP_DATA_DIR / name
    if not p.exists():
        raise SystemExit(f"⚠️  missing {p} — run the upstream script first.")
    return json.loads(p.read_text())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="preview without writing")
    args = ap.parse_args()

    kb = _load("criteria_kb_merged.json")
    triage = json.loads((APP_DATA_DIR / "triage.json").read_text()) \
        if (APP_DATA_DIR / "triage.json").exists() else None

    print(f"🎯 target: {PROJECT}/{DATABASE}")
    print(f"   criteria_kb: {len(kb)} drug docs"
          + (f" · meta/triage present" if triage else ""))

    if args.dry_run:
        print("\n(dry run — no writes) sample doc ids:",
              ", ".join(list(kb)[:8]), "...")
        return

    db = firestore.Client(project=PROJECT, database=DATABASE)

    # Criteria docs, batched (Firestore batch limit is 500).
    batch = db.batch()
    col = db.collection("criteria_kb")
    for i, (drug, doc) in enumerate(kb.items(), 1):
        batch.set(col.document(drug), doc)
        if i % 400 == 0:
            batch.commit()
            batch = db.batch()
    batch.commit()

    meta = db.collection("meta")
    meta.document("kb_summary").set({
        "drugs": len(kb),
        "criteria_total": sum(v["criteria_count"] for v in kb.values()),
        "fda_anchored": sum(1 for v in kb.values() if v["sources"]["fda_label"]),
        "sources": "A historical + B approved-evidence + D FDA label (C payer-policy pending)",
        "synced_at": datetime.now(timezone.utc).isoformat(),
    })
    if triage:
        meta.document("triage").set(triage)

    print(f"\n✅ wrote {len(kb)} docs to criteria_kb + meta summary.")
    print(f"   console: https://console.cloud.google.com/firestore/databases/"
          f"{DATABASE}/data/panel/criteria_kb?project={PROJECT}")


if __name__ == "__main__":
    main()
