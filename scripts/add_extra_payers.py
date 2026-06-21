#!/usr/bin/env python3
"""Layer additional payer policies (Aetna / UnitedHealthcare / OptumRx ...) onto
the Criteria KB, on top of the existing Cigna + FDA + historical sources.

Reads data/payer_policies/extra_payers.json (shape produced by the extraction
agent):
    { "<Payer>": { "<Drug>": {policy_number|policy_id, source_url, pa_required,
                              covered_indications[], step_therapy, not_covered,
                              criteria:[{statement, critical}]} }, ...,
      "not_found": [...] }

Re-runnable: skips duplicate criterion statements.
"""
import datetime
import json
from pathlib import Path

KB = Path("app_data/criteria_kb_merged.json")
SRC = Path("data/payer_policies/extra_payers.json")


def _norm_drug(name: str) -> str:
    import re
    return re.split(r"[\s/0-9]", str(name).strip(), maxsplit=1)[0].title()


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"❌ {SRC} not found — run the extraction agent first.")
    data = json.loads(SRC.read_text())
    kb = json.loads(KB.read_text())
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    updated: list[str] = []

    for payer, drugs in data.items():
        if payer == "not_found" or not isinstance(drugs, dict):
            continue
        for drug_raw, p in drugs.items():
            if not isinstance(p, dict):
                continue
            drug = _norm_drug(drug_raw)
            entry = kb.get(drug)
            if entry is None:
                print(f"  ! {payer}/{drug_raw}: not in KB, skipping")
                continue
            policy_no = p.get("policy_number") or p.get("policy_id") or ""
            step = p.get("step_therapy", "")
            if isinstance(step, list):
                step = "; ".join(str(s) for s in step)
            not_cov = p.get("not_covered", "")
            if isinstance(not_cov, list):
                not_cov = "; ".join(str(s) for s in not_cov)
            existing = {c["statement"] for c in entry.get("criteria", [])}
            new = []
            for c in p.get("criteria", []) or []:
                stmt = c.get("statement") if isinstance(c, dict) else None
                if not stmt or stmt in existing:
                    continue
                new.append({
                    "statement": stmt,
                    "critical": bool(c.get("critical")) if isinstance(c, dict) else False,
                    "source": "payer_policy",
                    "payer": payer,
                    "policy": policy_no,
                    "evidences": {"positive": "", "negative": ""},
                })
            entry.setdefault("criteria", []).extend(new)
            entry.setdefault("sources", {})["payer_policy"] = True
            entry.setdefault("payer_policies", {})[payer] = {
                "policy_number": policy_no,
                "title": p.get("title", f"{payer} policy"),
                "source_url": p.get("source_url"),
                "pa_required": bool(p.get("pa_required", True)),
                "covered_indications": p.get("covered_indications", []) or [],
                "step_therapy": step,
                "not_covered": not_cov,
            }
            entry["criteria_count"] = len(entry["criteria"])
            entry["critical_count"] = sum(1 for c in entry["criteria"] if c.get("critical"))
            entry["updated_at"] = now
            updated.append(f"{payer}/{drug} (+{len(new)})")

    KB.write_text(json.dumps(kb, indent=2))
    payers_per_drug = {d: list((v.get("payer_policies") or {}).keys()) for d, v in kb.items()}
    multi = {d: ps for d, ps in payers_per_drug.items() if len(ps) > 1}
    print("Updated:", ", ".join(updated) or "(nothing)")
    print(f"Drugs with multi-payer coverage now: {len(multi)}")
    for d, ps in sorted(multi.items()):
        print(f"   {d}: {', '.join(ps)}")


if __name__ == "__main__":
    main()
