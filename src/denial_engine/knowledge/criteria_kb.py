"""Serving-side Criteria Knowledge Base + evidence→criteria matcher.

Reads the de-identified, precomputed `app_data/criteria_kb_merged.json` (built by
build_criteria_kb.py, also synced to Firestore `risa-denial-hackathon`). For a
scored PA it lines the case's evidence up against the drug's criteria checklist
and returns each criterion as MET / AT_RISK / UNVERIFIED — the bridge from the
denial-risk score toward the Evidence Intelligence engine.

The matcher is deliberately lightweight (content-word overlap, no model) so it
runs in the serving container with zero extra deps; it's a transparent heuristic,
clearly labelled as such in the UI.
"""

from __future__ import annotations

import json
import re
import threading
from typing import Any

from denial_engine.core.config import APP_DATA_DIR

_KB_PATH = APP_DATA_DIR / "criteria_kb_merged.json"
_TRIAGE_PATH = APP_DATA_DIR / "triage.json"

_lock = threading.Lock()
_kb: dict[str, Any] | None = None

_STOP = {
    "the", "and", "for", "with", "that", "this", "are", "has", "have", "was", "will",
    "drug", "patient", "requested", "request", "least", "used", "use", "been", "from",
    "any", "all", "not", "does", "did", "per", "via", "into", "your", "their", "its",
    "been", "this", "than", "when", "what", "which", "would", "could", "should", "must",
    "each", "such", "also", "more", "most", "some", "other", "being", "they", "them",
}
_MATCH_MIN = 2  # shared content words to count a criterion as touched by a fact


def _load() -> dict[str, Any]:
    global _kb
    if _kb is None:
        with _lock:
            if _kb is None:
                _kb = json.loads(_KB_PATH.read_text()) if _KB_PATH.exists() else {}
    return _kb


def normalize_drug(name: str) -> str:
    """'Zepbound 2.5MG/0.5ML pen' -> 'Zepbound' (matches criteria_miner.brand)."""
    return re.split(r"[\s/0-9]", str(name).strip(), maxsplit=1)[0].title()


def _keywords(text: str) -> set[str]:
    toks = re.findall(r"[a-z]{4,}", str(text).lower())
    return {t for t in toks if t not in _STOP}


def _overlap(a: set[str], facts: list[str]) -> tuple[int, str]:
    """Best content-word overlap between a criterion and a list of facts."""
    best_n, best_fact = 0, ""
    for f in facts:
        n = len(a & _keywords(f))
        if n > best_n:
            best_n, best_fact = n, f
    return best_n, best_fact


def list_drugs() -> list[dict[str, Any]]:
    """Compact per-drug index for the dashboard Criteria tab."""
    kb = _load()
    out = [
        {
            "drug": d,
            "n_cases": v.get("n_cases", 0),
            "approval_rate": v.get("approval_rate"),
            "criteria_count": v.get("criteria_count", 0),
            "critical_count": v.get("critical_count", 0),
            "sources": v.get("sources", {}),
        }
        for d, v in kb.items()
    ]
    return sorted(out, key=lambda x: (-(x["n_cases"] or 0), x["drug"]))


def get_drug(drug: str) -> dict[str, Any] | None:
    return _load().get(normalize_drug(drug))


def triage_summary() -> dict[str, Any]:
    return json.loads(_TRIAGE_PATH.read_text()) if _TRIAGE_PATH.exists() else {}


def match_case(
    drug: str | None,
    supportive_texts: list[str] | None,
    contradictory_texts: list[str] | None,
) -> dict[str, Any] | None:
    """Score a case's evidence against the drug's criteria checklist.

    Returns None when no drug is given or the drug isn't in the KB, so the API
    can simply omit the panel for free-text-only cases.
    """
    if not drug:
        return None
    entry = get_drug(drug)
    if not entry:
        return None

    sup = supportive_texts or []
    con = contradictory_texts or []
    items: list[dict[str, Any]] = []
    met = at_risk = 0
    for c in entry.get("criteria", []):
        kws = _keywords(c["statement"])
        sup_n, sup_fact = _overlap(kws, sup)
        con_n, con_fact = _overlap(kws, con)
        if con_n >= _MATCH_MIN and con_n >= sup_n:
            status, evidence = "AT_RISK", con_fact
            at_risk += 1
        elif sup_n >= _MATCH_MIN:
            status, evidence = "MET", sup_fact
            met += 1
        else:
            status, evidence = "UNVERIFIED", ""
        items.append({
            "statement": c["statement"],
            "critical": c.get("critical", False),
            "source": c.get("source"),
            "status": status,
            "evidence": evidence,
        })

    total = len(items) or 1
    critical_unmet = sum(1 for i in items if i["critical"] and i["status"] != "MET")
    return {
        "drug": entry["drug"],
        "approval_rate": entry.get("approval_rate"),
        "readiness_pct": round(met / total * 100),
        "met": met,
        "at_risk": at_risk,
        "unverified": total - met - at_risk,
        "total": total,
        "critical_unmet": critical_unmet,
        "fda_indication": (entry.get("fda") or {}).get("indications", "")[:300] if entry.get("fda") else "",
        "criteria": items,
        "note": "Heuristic evidence↔criteria match (content-word overlap); criteria mined from history + FDA label.",
    }
