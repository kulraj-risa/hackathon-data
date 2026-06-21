"""Closed-loop evaluation against human-verified ground truth.

RISA's medical-necessity QA pipeline stores, for every coverage criterion on
every order, both the model's decision (`tech_result`) and a clinician's
verified decision (`human_result`) in the `criteria_validations` collection of
the `medical-necessity-qa` Firestore DB. That is a real closed loop: expert
reviewers grade each AI judgment, and the disagreements are the training signal.

This script reads that collection (read-only, via the gcloud user token — no
ADC needed) and computes how well the AI agrees with the clinicians:
  - overall agreement + Cohen's kappa
  - confusion matrix (AI vs human, treating human as ground truth)
  - precision / recall / F1 for the "criterion MET" decision
  - per-order and per-drug rollups, and the top disagreement reasons

It writes a PHI-safe snapshot (decisions + counts only, no patient text) to
app_data/groundtruth_eval.json so the engine API / Agent Studio can surface the
number without ever touching live PHI or prod Firestore.

Usage:
  python groundtruth_eval.py            # fetch + compute + write snapshot
  python groundtruth_eval.py --print    # also dump a readable summary
"""
from __future__ import annotations

import argparse
import json
import subprocess
import urllib.request
import urllib.error
from collections import Counter, defaultdict
from datetime import datetime, timezone
from math import sqrt

from denial_engine.core.config import APP_DATA_DIR

PROJECT = "rapids-platform"
DB = "medical-necessity-qa"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DB}/documents"


def _token() -> str:
    return subprocess.check_output(
        ["gcloud", "auth", "print-access-token"], text=True
    ).strip()


def _headers() -> dict:
    return {"Authorization": f"Bearer {_token()}", "X-Goog-User-Project": PROJECT}


def _decode(field: dict):
    """Firestore REST value -> python."""
    t = next(iter(field))
    v = field[t]
    if t == "mapValue":
        return {k: _decode(x) for k, x in v.get("fields", {}).items()}
    if t == "arrayValue":
        return [_decode(x) for x in v.get("values", [])]
    if t == "integerValue":
        return int(v)
    if t == "doubleValue":
        return float(v)
    if t == "booleanValue":
        return bool(v)
    if t == "nullValue":
        return None
    return v


def _fetch_all(collection: str, headers: dict) -> list[dict]:
    """Page through a whole collection, returning decoded field dicts."""
    docs: list[dict] = []
    page_token = None
    while True:
        url = f"{BASE}/{collection}?pageSize=300"
        if page_token:
            url += f"&pageToken={page_token}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=60) as resp:
            out = json.loads(resp.read())
        for d in out.get("documents", []):
            row = {k: _decode(x) for k, x in d.get("fields", {}).items()}
            row["_id"] = d["name"].split("/")[-1]
            docs.append(row)
        page_token = out.get("nextPageToken")
        if not page_token:
            break
    return docs


def _as_bool(v) -> bool | None:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("true", "yes", "met", "1"):
            return True
        if s in ("false", "no", "not_met", "0"):
            return False
    return None


def _kappa(tp: int, fp: int, tn: int, fn: int) -> float:
    """Cohen's kappa for two binary raters (AI vs human)."""
    n = tp + fp + tn + fn
    if n == 0:
        return 0.0
    po = (tp + tn) / n
    p_yes = ((tp + fp) / n) * ((tp + fn) / n)
    p_no = ((tn + fn) / n) * ((tn + fp) / n)
    pe = p_yes + p_no
    return 0.0 if pe >= 1.0 else round((po - pe) / (1 - pe), 4)


def evaluate() -> dict:
    headers = _headers()
    validations = _fetch_all("criteria_validations", headers)
    orders = {o["_id"]: o for o in _fetch_all("orders", headers)}

    tp = fp = tn = fn = 0          # human-as-truth; "positive" = criterion MET
    agree = total = 0
    thumbs = Counter()
    disagreements: list[dict] = []
    disagree_reasons = Counter()
    per_drug = defaultdict(lambda: {"agree": 0, "total": 0})

    for v in validations:
        hr = _as_bool(v.get("human_result"))
        tr = _as_bool(v.get("tech_result"))
        if hr is None or tr is None:
            continue
        total += 1
        if v.get("thumbs"):
            thumbs[str(v["thumbs"])] += 1

        oid = v.get("order_id")
        drug = (orders.get(oid, {}) or {}).get("drug_name") or "Unknown"
        per_drug[drug]["total"] += 1

        if hr == tr:
            agree += 1
            per_drug[drug]["agree"] += 1
            if hr:
                tp += 1
            else:
                tn += 1
        else:
            if tr and not hr:
                fp += 1          # AI said MET, human said not
            else:
                fn += 1          # AI said not, human said MET
            reason = v.get("disagree_reason") or "(no reason given)"
            disagree_reasons[str(reason)] += 1
            disagreements.append(
                {
                    "order_ref": str(oid)[:8] if oid else None,  # opaque short ref
                    "drug": drug,
                    "criterion_id": v.get("criterion_id"),
                    "ai_said": tr,
                    "human_said": hr,
                    "reason": str(reason)[:200],
                    "reviewer": "clinician",  # PII-safe: role, not email
                }
            )

    precision = round(tp / (tp + fp), 4) if (tp + fp) else None
    recall = round(tp / (tp + fn), 4) if (tp + fn) else None
    f1 = (
        round(2 * precision * recall / (precision + recall), 4)
        if precision and recall and (precision + recall)
        else None
    )

    # Case-level: human_verdict pass/fail across orders.
    verdicts = Counter(
        str(o.get("human_verdict")) for o in orders.values() if o.get("human_verdict")
    )

    per_drug_out = sorted(
        (
            {
                "drug": d,
                "criteria": s["total"],
                "agreement_pct": round(100 * s["agree"] / s["total"], 1),
            }
            for d, s in per_drug.items()
            if s["total"] >= 5
        ),
        key=lambda r: -r["criteria"],
    )[:15]

    return {
        "source": f"{PROJECT}/{DB} · criteria_validations + orders",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "n_orders": len(orders),
        "n_criteria_graded": total,
        "agreement_pct": round(100 * agree / total, 1) if total else None,
        "cohens_kappa": _kappa(tp, fp, tn, fn),
        "confusion_matrix": {
            "true_positive": tp,
            "false_positive": fp,
            "true_negative": tn,
            "false_negative": fn,
        },
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "thumbs": dict(thumbs),
        "case_human_verdict": dict(verdicts),
        "top_disagreement_reasons": disagree_reasons.most_common(8),
        "per_drug_agreement": per_drug_out,
        "n_disagreements": len(disagreements),
        "sample_disagreements": disagreements[:12],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--print", dest="show", action="store_true")
    args = ap.parse_args()

    report = evaluate()
    out_path = APP_DATA_DIR / "groundtruth_eval.json"
    out_path.write_text(json.dumps(report, indent=2))

    print(
        f"✅ {report['n_criteria_graded']} criteria graded across "
        f"{report['n_orders']} orders · agreement {report['agreement_pct']}% · "
        f"kappa {report['cohens_kappa']} · "
        f"precision {report['precision']} · recall {report['recall']} · F1 {report['f1']}"
    )
    print(f"   snapshot -> {out_path}")
    if args.show:
        print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
