"""DB-agnostic storage for prediction results and the fix/revalidate audit trail.

The backend is pluggable so we can defer the Firestore-vs-BigQuery decision:

    STORAGE_BACKEND=local      -> JSON-lines file (default, no cloud needed)
    STORAGE_BACKEND=firestore  -> Firestore on rapids-platform (stub: needs deps)
    STORAGE_BACKEND=bigquery   -> BigQuery table (stub: needs deps)

IMPORTANT: only de-identified prediction metadata is persisted here
(case_id is a truncated UUID). Never write patient PHI through this layer.
"""

from __future__ import annotations

import json
import os
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import PROJECT_ROOT

# Fields a prediction record is allowed to contain (allow-list = PHI guard).
ALLOWED_FIELDS = {
    "record_id", "case_id", "medication_class", "payer_name",
    "denial_risk", "risk_level", "recommendations", "resolved_actions",
    "event", "created_at",
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sanitize(record: dict[str, Any]) -> dict[str, Any]:
    """Drop anything outside the allow-list to keep PHI out of storage."""
    return {k: v for k, v in record.items() if k in ALLOWED_FIELDS}


class PredictionStore(ABC):
    """Interface for persisting prediction / audit events."""

    @abstractmethod
    def log_prediction(self, record: dict[str, Any]) -> str:
        """Persist a (sanitized) prediction record; returns its record_id."""

    @abstractmethod
    def list_predictions(self, limit: int = 100) -> list[dict[str, Any]]:
        """Return recent prediction records, newest first."""


class LocalJSONStore(PredictionStore):
    """Append-only JSON-lines store. Zero dependencies; good for dev/demo."""

    def __init__(self, path: Path | None = None):
        self.path = path or (PROJECT_ROOT / "data" / "predictions.jsonl")
        self.path.parent.mkdir(exist_ok=True)

    def log_prediction(self, record: dict[str, Any]) -> str:
        rec = _sanitize(record)
        rec.setdefault("record_id", uuid.uuid4().hex)
        rec.setdefault("created_at", _utc_now())
        with self.path.open("a") as f:
            f.write(json.dumps(rec) + "\n")
        return rec["record_id"]

    def list_predictions(self, limit: int = 100) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        rows = [json.loads(line) for line in self.path.read_text().splitlines() if line]
        return list(reversed(rows))[:limit]


class FirestoreStore(PredictionStore):
    """Firestore backend on rapids-platform.

    Stub: enable by `pip install google-cloud-firestore` and setting
    STORAGE_BACKEND=firestore + FIRESTORE_PROJECT=rapids-platform.
    """

    COLLECTION = "pa_predictions"

    def __init__(self, project: str | None = None):
        from google.cloud import firestore  # lazy import

        self.client = firestore.Client(
            project=project or os.getenv("FIRESTORE_PROJECT", "rapids-platform")
        )

    def log_prediction(self, record: dict[str, Any]) -> str:
        rec = _sanitize(record)
        rec.setdefault("record_id", uuid.uuid4().hex)
        rec.setdefault("created_at", _utc_now())
        self.client.collection(self.COLLECTION).document(rec["record_id"]).set(rec)
        return rec["record_id"]

    def list_predictions(self, limit: int = 100) -> list[dict[str, Any]]:
        docs = (
            self.client.collection(self.COLLECTION)
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
            .stream()
        )
        return [d.to_dict() for d in docs]


class BigQueryStore(PredictionStore):
    """BigQuery backend.

    Stub: set STORAGE_BACKEND=bigquery + BQ_PREDICTIONS_TABLE=
    `project.dataset.table`. Table must exist with a matching schema.
    """

    def __init__(self, table: str | None = None):
        from google.cloud import bigquery  # lazy import

        self.table = table or os.getenv("BQ_PREDICTIONS_TABLE")
        if not self.table:
            raise ValueError("BQ_PREDICTIONS_TABLE env var is required")
        self.client = bigquery.Client()

    def log_prediction(self, record: dict[str, Any]) -> str:
        rec = _sanitize(record)
        rec.setdefault("record_id", uuid.uuid4().hex)
        rec.setdefault("created_at", _utc_now())
        errors = self.client.insert_rows_json(self.table, [rec])
        if errors:
            raise RuntimeError(f"BigQuery insert failed: {errors}")
        return rec["record_id"]

    def list_predictions(self, limit: int = 100) -> list[dict[str, Any]]:
        q = f"SELECT * FROM `{self.table}` ORDER BY created_at DESC LIMIT {limit}"
        return [dict(r) for r in self.client.query(q).result()]


def get_store() -> PredictionStore:
    """Factory: pick backend from STORAGE_BACKEND env (default: local)."""
    backend = os.getenv("STORAGE_BACKEND", "local").lower()
    if backend == "firestore":
        return FirestoreStore()
    if backend == "bigquery":
        return BigQueryStore()
    return LocalJSONStore()


if __name__ == "__main__":
    store = get_store()
    rid = store.log_prediction({
        "case_id": "demo1234",
        "medication_class": "Brand",
        "payer_name": "Aetna Commercial",
        "denial_risk": 85.3,
        "risk_level": "HIGH",
        "recommendations": ["Document trial & failure dates"],
        "event": "predict",
    })
    print(f"logged record_id={rid}")
    print("recent:", store.list_predictions(limit=3))
