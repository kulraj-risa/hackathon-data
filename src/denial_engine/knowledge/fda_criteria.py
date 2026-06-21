"""Phase 1 — Source D: FDA drug-label criteria (public, no PHI).

Pulls FDA-approved indication / dosing / contraindication / warning text from
openFDA (api.fda.gov, already whitelisted in the pharmacy app CSP) for the drugs
that came out of `criteria_miner.py`. This is the authoritative, public anchor
for the indication & dosing criteria — it needs no patient data.

Run:  ./venv/bin/python fda_criteria.py
"""

from __future__ import annotations

import json
import time

import requests

from denial_engine.core.config import APP_DATA_DIR

OPENFDA = "https://api.fda.gov/drug/label.json"
FIELDS = {
    "indications": "indications_and_usage",
    "dosing": "dosage_and_administration",
    "contraindications": "contraindications",
    "boxed_warning": "boxed_warning",
}
MAX_CHARS = 1500  # keep label text compact for the KB


def _first(label: dict, key: str) -> str:
    val = label.get(key)
    if isinstance(val, list) and val:
        return " ".join(str(v) for v in val).strip()[:MAX_CHARS]
    return ""


def fetch_label(drug: str) -> dict | None:
    """Try brand, then generic, then substance name; return the first label hit."""
    for field in ("openfda.brand_name", "openfda.generic_name", "openfda.substance_name"):
        try:
            r = requests.get(
                OPENFDA,
                params={"search": f'{field}:"{drug}"', "limit": 1},
                timeout=20,
            )
        except requests.RequestException:
            continue
        if r.status_code != 200:
            continue
        results = r.json().get("results") or []
        if not results:
            continue
        label = results[0]
        ofda = label.get("openfda", {})
        return {
            "matched_on": field,
            "brand_name": (ofda.get("brand_name") or [drug])[0],
            "generic_name": (ofda.get("generic_name") or [""])[0],
            "route": (ofda.get("route") or [""])[0],
            **{out: _first(label, src) for out, src in FIELDS.items()},
        }
    return None


def main() -> None:
    kb_path = APP_DATA_DIR / "criteria_kb.json"
    drugs = sorted(json.loads(kb_path.read_text()).keys()) if kb_path.exists() else []
    if not drugs:
        print("⚠️  app_data/criteria_kb.json not found — run criteria_miner.py first.")
        return
    print(f"🔎 Fetching FDA labels for {len(drugs)} drugs from openFDA...\n")

    out: dict[str, dict] = {}
    for d in drugs:
        label = fetch_label(d)
        if label:
            out[d] = label
            ind = (label["indications"][:70] + "…") if label["indications"] else "(no indication text)"
            print(f"  ✅ {d:14s} [{label['matched_on'].split('.')[-1]}]  {ind}")
        else:
            print(f"  ❌ {d:14s} no FDA label found")
        time.sleep(0.3)  # be polite to the public API

    dst = APP_DATA_DIR / "fda_criteria.json"
    dst.write_text(json.dumps(out, indent=2))
    print(f"\n💾 Wrote {dst}  ({len(out)}/{len(drugs)} drugs matched)")


if __name__ == "__main__":
    main()
