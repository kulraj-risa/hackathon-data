"""Criteria Gap Recovery Framework.

When a patient does NOT meet a coverage criterion, scoring alone is a dead end.
This module turns each unmet criterion into an actionable recovery plan: how
important the criterion is, whether it can be bypassed, the reviewer's intent,
and the clinically-accepted alternative pathways / contraindication / safety /
appeal arguments that can still carry the case to approval.

Example (Injectafer · "Failed oral iron"):
  - importance: Critical · type: Step Therapy Requirement · bypass: Sometimes
  - alternative pathways: oral iron intolerance, malabsorption, bariatric
    surgery, active GI disease, ongoing blood loss
  - recovery strategy: demonstrate oral iron is clinically *inappropriate*,
    not merely *ineffective*.

LLM-powered when ANTHROPIC_API_KEY is set; otherwise a KB-grounded deterministic
fallback keeps it fully demoable offline. Every record matches the agreed schema
so the UI and downstream automation can consume it directly.

Compliance: this is an *argument-surfacing* tool. It proposes clinically and
policy-recognized pathways and the evidence that would support them — it never
fabricates that the patient has a condition. Recovery arguments are explicitly
framed as "document if present."
"""
from __future__ import annotations

import json
import os
from typing import Any

from denial_engine.core import llm

# Haiku keeps gap-recovery within the interactive pipeline's latency budget
# (it runs concurrently with the other staged LLM calls). Override for batch.
MODEL = os.environ.get("NECESSITY_MODEL_FAST", "claude-haiku-4-5-20251001")

GAP_RECOVERY_SYSTEM = (
    "You are a Prior Authorization Criteria Gap & Recovery strategist with deep payer "
    "medical-policy and clinical expertise. For each coverage criterion the patient "
    "does NOT clearly meet, you analyze how to still legitimately secure approval. "
    "You know step-therapy exceptions, contraindications, drug-drug and drug-disease "
    "interactions, intolerance vs. ineffectiveness distinctions, safety arguments, "
    "medical-necessity arguments, and appeal strategy. STRICT RULES: (1) Never assert "
    "the patient HAS any condition or finding — frame every pathway as evidence to "
    "'document if present/applicable'. (2) Be specific and clinically accurate; cite "
    "the reviewer's underlying intent. (3) Distinguish non-bypassable hard requirements "
    "(usually deny) from potentially-bypassable and frequently-appealed criteria."
)

# Importance heuristics + criterion typing for the deterministic fallback.
_STEP_HINTS = ("trial", "step therapy", "failed", "tried", "prior therapy", "first-line", "first line")
_THRESHOLD_HINTS = ("bmi", "hba1c", "a1c", "ldl", "ferritin", "tsat", "egfr", "≥", ">=", "<=", "mg/dl", "ng/ml", "level", "score")
_DOC_HINTS = ("document", "chart note", "submit", "records", "attestation", "signed", "form")
_UM_HINTS = ("quantity", "site of care", "dose", "duration", "frequency", "reauthorization", "renewal")


def _criterion_type(statement: str) -> str:
    s = (statement or "").lower()
    if any(h in s for h in _STEP_HINTS):
        return "Step Therapy Requirement"
    if any(h in s for h in _THRESHOLD_HINTS):
        return "Clinical Threshold"
    if any(h in s for h in _UM_HINTS):
        return "Utilization Management Requirement"
    if any(h in s for h in _DOC_HINTS):
        return "Documentation Requirement"
    return "Medical Necessity Requirement"


# A small curated recovery library for common specialty/step-therapy patterns.
# Keyed by substrings found in the criterion statement. Used by the deterministic
# fallback so the framework is rich even with no LLM key.
_RECOVERY_LIBRARY: list[dict[str, Any]] = [
    {
        "match": ("oral iron", "iron"),
        "alternative_pathways": [
            "Documented oral iron intolerance (GI side effects: nausea, constipation, abdominal pain)",
            "Malabsorption syndrome (celiac, IBD, prior GI resection)",
            "Post–bariatric surgery anatomy limiting absorption",
            "Active GI disease / inflammatory bowel disease",
            "Ongoing blood loss exceeding oral repletion capacity",
            "Need for rapid repletion (pre-op, symptomatic anemia, CKD on ESA)",
        ],
        "contraindication_based_bypass": [
            "Active IBD where oral iron worsens GI inflammation",
        ],
        "safety_based_bypass": [
            "Symptomatic anemia requiring repletion faster than oral iron achieves",
        ],
        "strategy": "Demonstrate oral iron is clinically INAPPROPRIATE (intolerance/malabsorption), not merely ineffective.",
    },
    {
        "match": ("statin", "maximally tolerated"),
        "alternative_pathways": [
            "Documented statin intolerance with rechallenge (myalgia, CK elevation)",
            "Two-statin trial with intolerance to both",
            "Contraindication to statins (active liver disease, pregnancy)",
        ],
        "contraindication_based_bypass": ["Active hepatic disease contraindicating statins"],
        "safety_based_bypass": ["Statin-associated rhabdomyolysis history"],
        "strategy": "Establish documented intolerance/contraindication to maximally tolerated statin, then justify add-on therapy by residual LDL-C risk.",
    },
    {
        "match": ("metformin", "first-line", "first line"),
        "alternative_pathways": [
            "Metformin intolerance (GI) despite extended-release trial",
            "Contraindication: eGFR < 30, lactic-acidosis risk",
            "Comorbidity favoring GLP-1 first (established ASCVD, CKD, HF)",
        ],
        "contraindication_based_bypass": ["eGFR < 30 contraindicating metformin"],
        "safety_based_bypass": ["History of metformin-associated lactic acidosis"],
        "strategy": "Show metformin is contraindicated/not tolerated, or that guidelines support incretin first given comorbidity.",
    },
    {
        "match": ("bmi", "weight"),
        "alternative_pathways": [
            "BMI ≥ 27 with a weight-related comorbidity (HTN, dyslipidemia, OSA, T2DM)",
            "Prior documented weight history meeting threshold",
            "Comorbidity-based necessity even near threshold",
        ],
        "contraindication_based_bypass": [],
        "safety_based_bypass": [],
        "strategy": "If BMI is borderline, anchor on a qualifying weight-related comorbidity and documented weight history.",
    },
]


def _library_for(statement: str) -> dict[str, Any] | None:
    s = (statement or "").lower()
    for entry in _RECOVERY_LIBRARY:
        if any(m in s for m in entry["match"]):
            return entry
    return None


def _fallback_record(c: dict[str, Any]) -> dict[str, Any]:
    statement = c.get("statement") or c.get("requirement") or ""
    critical = bool(c.get("critical"))
    ctype = _criterion_type(statement)
    lib = _library_for(statement)
    importance = "Critical" if critical else ("Major" if ctype in ("Step Therapy Requirement", "Clinical Threshold") else "Minor")
    bypass = "No" if (critical and ctype == "Hard Requirement") else ("Sometimes" if critical else "Yes")
    alt = (lib or {}).get("alternative_pathways", [])
    return {
        "criterion": statement,
        "importance": importance,
        "criterion_type": ctype,
        "bypass_possible": bypass,
        "reviewer_intent": (
            "Confirm the therapy is medically necessary and that lower-cost / guideline-preferred "
            "options were appropriately addressed before approving."
        ),
        "alternative_pathways": alt,
        "medical_necessity_arguments": (
            [(lib or {}).get("strategy")] if lib and lib.get("strategy") else
            ["Document the clinical rationale tying the requested drug to the diagnosis and failed/again inappropriate alternatives."]
        ),
        "contraindication_based_bypass": (lib or {}).get("contraindication_based_bypass", []),
        "safety_based_bypass": (lib or {}).get("safety_based_bypass", []),
        "alternative_clinical_evidence": (
            ["Equivalent labs/imaging or specialist attestation that satisfies the reviewer's intent."]
        ),
        "appeal_strength": "Strong" if alt else ("Moderate" if not critical else "Weak"),
        "appeal_arguments": (
            [f"Peer-to-peer: {(lib or {}).get('strategy')}"] if lib and lib.get("strategy") else
            ["Peer-to-peer review citing guideline support and the documented clinical context."]
        ),
        "_source": "kb",
    }


def _unmet(match: dict | None) -> list[dict[str, Any]]:
    if not match:
        return []
    return [c for c in match.get("criteria", []) if (c.get("status") or "").upper() != "MET"]


def criteria_gap_recovery(
    drug: str | None,
    payer: str | None,
    match: dict | None,
    db2: dict | None = None,
    use_llm: bool = True,
) -> dict[str, Any]:
    """Return recovery plans for every unmet coverage criterion.

    {"gaps": [<schema record>, ...], "n_unmet": int, "_mode": "llm"|"deterministic"}

    Set use_llm=False to force the instant deterministic path — used inside the
    multi-agent pipeline so the rich LLM analysis is fetched separately, on
    demand, without contending with the pipeline's other concurrent LLM calls.
    """
    all_unmet = _unmet(match)
    if not all_unmet:
        return {"gaps": [], "n_unmet": 0, "_mode": "deterministic"}

    # Prioritize critical criteria, then cap so the LLM returns complete, valid
    # JSON within the token budget (and the UI stays focused on what matters).
    n_total = len(all_unmet)
    unmet = sorted(all_unmet, key=lambda c: (not c.get("critical"),))[:8]

    # Deterministic baseline (always available).
    det = [_fallback_record(c) for c in unmet]

    if not use_llm or not llm.available():
        return {"gaps": det, "n_unmet": n_total, "_mode": "deterministic"}

    crit_lines = "\n".join(
        f'{i}. [{c.get("source","")}{"/critical" if c.get("critical") else ""}] '
        f'(status={c.get("status")}) {c.get("statement")}'
        for i, c in enumerate(unmet)
    )
    drivers = ""
    if db2:
        drivers = (
            f"\nApproval drivers: {json.dumps(db2.get('approval_drivers', []), default=str)[:600]}"
            f"\nDenial drivers: {json.dumps(db2.get('denial_drivers', []), default=str)[:600]}"
            f"\nStep therapy: {json.dumps(db2.get('step_therapy'), default=str)[:300]}"
        )
    user = f"""DRUG: {drug or 'unspecified'}    PAYER: {payer or 'unspecified'}{drivers}

UNMET / AT-RISK COVERAGE CRITERIA (analyze each):
{crit_lines}

For EACH criterion above, perform a criteria gap & recovery analysis. Identify
importance (Critical/Major/Minor), criterion_type (one of: Hard Requirement,
Step Therapy Requirement, Clinical Threshold, Documentation Requirement,
Medical Necessity Requirement, Utilization Management Requirement),
whether it can be bypassed (Yes/No/Sometimes), the reviewer's intent, all
clinically-accepted alternative pathways, medical-necessity arguments,
contraindication-based and safety-based bypass options, alternative clinical
evidence that satisfies the reviewer's intent, appeal_strength
(Strong/Moderate/Weak), and the strongest evidence-based appeal_arguments.
Frame pathways as evidence to document if present — never assert the patient has
a condition. Output JSON of EXACTLY this form:
{{"gaps":[{{"criterion":"","importance":"","criterion_type":"","bypass_possible":"",
"reviewer_intent":"","alternative_pathways":[],"medical_necessity_arguments":[],
"contraindication_based_bypass":[],"safety_based_bypass":[],
"alternative_clinical_evidence":[],"appeal_strength":"","appeal_arguments":[]}}]}}"""

    out = llm.complete_json(GAP_RECOVERY_SYSTEM, user, max_tokens=4096, model=MODEL, timeout=60.0)
    if isinstance(out, dict) and isinstance(out.get("gaps"), list) and out["gaps"]:
        gaps = []
        for i, g in enumerate(out["gaps"]):
            if not isinstance(g, dict):
                continue
            base = det[i] if i < len(det) else {}
            # Merge: prefer LLM fields, fall back to deterministic for any missing.
            rec = {**base, **{k: v for k, v in g.items() if v not in (None, "", [])}}
            rec["_source"] = "llm"
            gaps.append(rec)
        if gaps:
            return {"gaps": gaps, "n_unmet": n_total, "_mode": "llm"}

    return {"gaps": det, "n_unmet": n_total, "_mode": "deterministic"}
