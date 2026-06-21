"""Phase 1 — Source E: combine A/B (historical) + D (FDA) into one Criteria KB.

Output is a per-drug record shaped to RISA's `Checklist` model (statement +
evidences{positive,negative} + critical/score), so it can flow into the
Evidence Intelligence engine later. Source C (payer policy) is left as a
placeholder slot to be filled when policy docs arrive.

  A/B  ← app_data/criteria_kb.json   (criteria_miner.py)
  D    ← app_data/fda_criteria.json  (fda_criteria.py)
  →    → app_data/criteria_kb_merged.json   (the unified KB)

Run:  ./venv/bin/python build_criteria_kb.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from denial_engine.core.config import APP_DATA_DIR

CRITICAL_FREQ = 0.50  # a question seen in >=50% of cases is treated as Critical


def _load(name: str) -> dict:
    p = APP_DATA_DIR / name
    return json.loads(p.read_text()) if p.exists() else {}


def _short(text: str, n: int = 240) -> str:
    text = " ".join(text.split())
    return text[:n] + ("…" if len(text) > n else "")


def build_drug(drug: str, mined: dict, fda: dict) -> dict:
    criteria: list[dict] = []

    # FDA-anchored indication + dosing criteria (authoritative, Critical).
    if fda:
        if fda.get("indications"):
            criteria.append({
                "statement": f"Diagnosis matches an FDA-approved indication for {drug}.",
                "critical": True,
                "source": "fda_label",
                "evidences": {"positive": _short(fda["indications"]), "negative": ""},
            })
        if fda.get("dosing"):
            criteria.append({
                "statement": f"Requested dose/route is consistent with the FDA label for {drug}.",
                "critical": True,
                "source": "fda_label",
                "evidences": {"positive": _short(fda["dosing"]), "negative": ""},
            })

    # Historical questionnaire criteria (data-driven, A).
    for c in mined.get("criteria_checklist", []):
        criteria.append({
            "statement": c["question"],
            "critical": c["frequency"] >= CRITICAL_FREQ,
            "source": "historical_questionnaire",
            "frequency": c["frequency"],
            "evidences": {"positive": "", "negative": ""},
        })

    # Approved/denied evidence patterns (B) attach as example evidence.
    won = mined.get("winning_evidence_examples", [])
    gaps = mined.get("common_denial_gaps", [])
    for i, item in enumerate(criteria):
        if item["source"] == "historical_questionnaire" and not item["evidences"]["positive"]:
            if i < len(won):
                item["evidences"]["positive"] = _short(won[i])
            if i < len(gaps):
                item["evidences"]["negative"] = _short(gaps[i])

    n_crit = sum(1 for c in criteria if c["critical"])
    return {
        "drug": drug,
        "n_cases": mined.get("n_cases", 0),
        "approval_rate": mined.get("approval_rate"),
        "sources": {
            "historical": bool(mined),
            "fda_label": bool(fda),
            "payer_policy": False,  # Source C — fill when policy docs arrive
        },
        "fda": {k: fda.get(k, "") for k in
                ("generic_name", "route", "indications", "dosing",
                 "contraindications", "boxed_warning")} if fda else None,
        "criteria": criteria,
        "criteria_count": len(criteria),
        "critical_count": n_crit,
        "minimumRequired": n_crit,            # mirrors Checklist.minimumRequired
        "winning_evidence_examples": won[:5],
        "common_denial_gaps": gaps[:5],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    mined = _load("criteria_kb.json")
    fda = _load("fda_criteria.json")
    if not mined:
        print("⚠️  run criteria_miner.py first (need app_data/criteria_kb.json).")
        return

    drugs = sorted(set(mined) | set(fda))
    kb = {d: build_drug(d, mined.get(d, {}), fda.get(d, {})) for d in drugs}

    dst = APP_DATA_DIR / "criteria_kb_merged.json"
    dst.write_text(json.dumps(kb, indent=2))

    with_fda = sum(1 for v in kb.values() if v["sources"]["fda_label"])
    total_crit = sum(v["criteria_count"] for v in kb.values())
    print(f"📚 Unified Criteria KB: {len(kb)} drugs · {total_crit} criteria total "
          f"· {with_fda} FDA-anchored")
    top = max(kb.values(), key=lambda v: v["criteria_count"])
    print(f"\n── Example: {top['drug']} ({top['criteria_count']} criteria, "
          f"{top['critical_count']} critical) ──")
    for c in top["criteria"][:6]:
        flag = "‼️ CRITICAL" if c["critical"] else "  supporting"
        print(f"  {flag} [{c['source']}] {c['statement'][:80]}")
    print(f"\n💾 Wrote {dst}")


if __name__ == "__main__":
    main()
