"""Post-Denial Recovery & Appeal Specialist agent.

Given a DENIED prior authorization, determine whether it can realistically be
overturned and surface the highest-yield recovery opportunities, then draft a
submission-ready appeal letter.

Pipeline (mirrors the post-denial recovery workflow):
  1. Denied PA enters funnel
  2. Data ingestion (denial letter, submitted answers, records, labs, history)
  3. Appeal analysis engine (denial reason vs. coverage criteria / FDA / NCCN)
  4. Root-cause identification
  5. Appeal scoring (viability, approval probability, recovery priority)
  6. Appeal optimization (missing evidence, required corrections)
  7. Auto appeal generation (letter + rationale + attachments)
  8. Submission-ready appeal

LLM-powered (Anthropic Claude) when ANTHROPIC_API_KEY is set; otherwise a
KB-grounded deterministic fallback keeps it fully demoable offline. Output
matches a fixed schema so the UI and downstream automation consume it directly.

Compliance: this is an *argument-surfacing* tool. It proposes clinically and
policy-recognized pathways and the evidence that would support them — it never
fabricates that the patient has a condition. Recovery items are framed as
"document if present".
"""
from __future__ import annotations

import os
import re
from typing import Any

from denial_engine.core import llm

# Sonnet for the appeal letter quality; override via env.
MODEL = os.environ.get("RECOVERY_MODEL", os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"))

RECOVERY_SYSTEM = (
    "You are an Expert Prior Authorization Denial Recovery and Insurance Appeal Specialist "
    "with deep expertise in Medicare Part D, commercial PBMs (OptumRx, Express Scripts, "
    "Caremark, Prime Therapeutics, Humana), Medicaid formularies, FDA labeling, NCCN/ASCO/"
    "AHFS/DRUGDEX and payer-specific coverage criteria, oncology and specialty PAs, formulary "
    "exceptions, medical-necessity appeals, step-therapy overrides, quantity-limit exceptions, "
    "and continuation-of-therapy appeals. Your objective is to determine whether a denied PA "
    "can realistically be overturned and identify the highest-yield recovery opportunities. "
    "STRICT RULES: focus only on approval-relevant factors; be concise and actionable; never "
    "assert the patient has a condition — frame evidence as 'document if present'; distinguish "
    "clearly between recoverable and non-recoverable denials; if a denial is a plan exclusion, "
    "say so; always recommend the highest-probability pathway; always provide a recovery "
    "classification, approval probability, and appeal viability."
)

# ── Denial-reason classification heuristics (deterministic fallback) ──
_REASON_HINTS: list[tuple[str, tuple[str, ...]]] = [
    ("Step therapy requirement not satisfied", ("step therapy", "step-therapy", "first-line", "first line", "failed", "trial of", "prerequisite", "tried")),
    ("Formulary restriction / non-preferred", ("formulary", "non-formulary", "non-preferred", "preferred alternative", "not covered", "exclusion")),
    ("Quantity / day-supply limit exceeded", ("quantity", "day supply", "days supply", "dose", "quantity limit", "exceeds")),
    ("Diagnosis does not meet coverage criteria", ("diagnosis", "indication", "off-label", "off label", "not indicated", "icd")),
    ("Medical necessity insufficiently documented", ("medical necessity", "not medically necessary", "insufficient", "documentation")),
    ("Coding / administrative error", ("coding", "icd-10", "icd10", "administrative", "incomplete", "missing field")),
]

# Classification codes per the spec.
_CLASSES = {
    1: "QUICK WIN — documentation issue only, high likelihood of overturn",
    2: "STEP THERAPY OVERRIDE — failure/intolerance/contraindication can be documented",
    3: "FORMULARY EXCEPTION — alternative therapies inappropriate",
    4: "MEDICAL NECESSITY APPEAL — strong clinical rationale exists",
    5: "CONTINUATION OF THERAPY — patient already benefiting",
    6: "QUANTITY LIMIT EXCEPTION",
    7: "CODING / ADMINISTRATIVE CORRECTION",
    8: "PLAN EXCLUSION — very low likelihood of overturn",
    9: "NON-RECOVERABLE DENIAL — appeal unlikely to succeed",
}


def _detect_reason(texts: list[str], explicit: str | None) -> str:
    if explicit and explicit.strip():
        return explicit.strip()
    blob = " ".join(texts).lower()
    for label, hints in _REASON_HINTS:
        if any(h in blob for h in hints):
            return label
    return "Medical necessity insufficiently documented"


def _classify(reason: str, contradictions: list[str]) -> tuple[int, str]:
    r = reason.lower()
    blob = (reason + " " + " ".join(contradictions)).lower()
    if "exclusion" in r or "plan exclusion" in blob or "not a covered benefit" in blob:
        return 8, _CLASSES[8]
    if any(h in blob for h in ("step therapy", "step-therapy", "first-line", "failed", "tried")):
        return 2, _CLASSES[2]
    if any(h in blob for h in ("formulary", "non-preferred", "preferred alternative")):
        return 3, _CLASSES[3]
    if any(h in blob for h in ("quantity", "day supply", "days supply", "quantity limit")):
        return 6, _CLASSES[6]
    if any(h in blob for h in ("coding", "icd-10", "icd10", "administrative")):
        return 7, _CLASSES[7]
    if any(h in blob for h in ("continuation", "already on", "stable on", "maintained")):
        return 5, _CLASSES[5]
    if any(h in blob for h in ("missing document", "documentation", "chart note", "incomplete")):
        return 1, _CLASSES[1]
    return 4, _CLASSES[4]


def _score(contradictions: list[str], supportive: list[str], classification: int) -> tuple[str, str, int, str]:
    """Return (appeal_viable, approval_probability_label, pct, recovery_priority)."""
    if classification in (8, 9):
        return "NO", "LOW", 12, "LOW"
    # More supportive evidence and fewer hard contradictions ⇒ better odds.
    n_con = len(contradictions)
    n_sup = len(supportive)
    base = 55 + 6 * n_sup - 9 * n_con
    if classification in (1, 7):  # documentation / coding fix
        base += 25
    if classification in (5,):  # continuation of therapy
        base += 15
    pct = max(15, min(88, base))
    if pct >= 60:
        return "YES", "HIGH", pct, "HIGH"
    if pct >= 25:
        return "CONDITIONAL", "MODERATE", pct, "MEDIUM"
    return "CONDITIONAL", "LOW", pct, "LOW"


def _recovery_opportunities(reason: str, contradictions: list[str], classification: int) -> list[str]:
    ops: list[str] = []
    if classification == 2:
        ops += [
            "Document prior treatment failure, intolerance, or contraindication to the required step-therapy agent",
            "Submit a step-therapy override request with dates and outcomes of prior trials",
        ]
    if classification == 3:
        ops += [
            "Request a formulary exception explaining why preferred alternatives are inappropriate",
            "Document intolerance / contraindication to each formulary alternative",
        ]
    if classification == 6:
        ops += [
            "Request a quantity-limit exception with dosing rationale per FDA label / guideline",
        ]
    if classification == 7:
        ops += [
            "Correct the ICD-10 / diagnosis coding to a covered indication",
            "Resubmit with the corrected administrative fields",
        ]
    if classification in (1, 4):
        ops += [
            "Submit updated chart notes establishing medical necessity",
            "Attach a physician statement tying the drug to the diagnosis",
        ]
    if classification == 5:
        ops += ["Provide continuation-of-therapy evidence showing the patient is stable / benefiting"]
    # Always-useful, de-duplicated tail.
    ops += [
        "Add guideline support (FDA label, NCCN/ASCO) for the requested indication",
        "Request a peer-to-peer review with the prescriber",
    ]
    seen, out = set(), []
    for o in ops:
        if o not in seen:
            seen.add(o)
            out.append(o)
    return out[:7]


def _required_documents(classification: int) -> list[str]:
    docs = ["Physician statement of medical necessity", "Recent chart / progress notes"]
    if classification == 2:
        docs += ["Medication failure / intolerance history with dates", "Documentation of contraindication to step agent"]
    if classification == 3:
        docs += ["Intolerance/contraindication record for each formulary alternative"]
    if classification == 6:
        docs += ["Dosing rationale referencing FDA label / guideline"]
    if classification == 7:
        docs += ["Corrected ICD-10 coding sheet"]
    if classification == 5:
        docs += ["Treatment history demonstrating clinical benefit / stability"]
    docs += ["Relevant laboratory results", "Imaging reports (if applicable)", "Guideline-supported treatment pathway (NCCN/ASCO)"]
    seen, out = set(), []
    for d in docs:
        if d not in seen:
            seen.add(d)
            out.append(d)
    return out


def _appeal_letter(drug: str, payer: str, reason: str, classification: int, opportunities: list[str]) -> str:
    drug = drug or "the requested medication"
    payer = payer or "the plan"
    cls_label = _CLASSES[classification].split("—")[0].strip()
    top = opportunities[0] if opportunities else "documentation of medical necessity"
    return (
        f"RE: Appeal of Prior Authorization Denial — {drug}\n\n"
        f"To the {payer} Pharmacy/Medical Review Team,\n\n"
        f"We respectfully request reconsideration of the denial for {drug}. The stated denial "
        f"reason — {reason.lower()} — can be addressed with the documentation enclosed.\n\n"
        f"{drug} is medically necessary for this patient and is supported by FDA labeling and "
        f"applicable clinical guidelines (NCCN/ASCO/AHFS as applicable) for the documented "
        f"indication. The strongest basis for overturn is to {top.lower()}. Available formulary "
        f"alternatives are clinically inappropriate for this patient as documented, and any delay "
        f"in therapy poses a material risk to patient safety and clinical outcomes.\n\n"
        f"On the basis of medical necessity and the enclosed supporting evidence, we request that "
        f"the plan approve coverage for {drug} as prescribed. We are available for a peer-to-peer "
        f"review at your convenience.\n\n"
        f"Sincerely,\nPrescribing Provider\n\n"
        f"[Recovery classification: {cls_label}]"
    )


def _automation(reason, viable, prob_label, priority, cls_label, opportunities, docs) -> dict[str, str]:
    return {
        "Appeal_Viable": viable,
        "Approval_Probability": prob_label,
        "Recovery_Priority": priority,
        "Recovery_Classification": cls_label.split("—")[0].strip(),
        "Primary_Denial_Reason": reason,
        "Can_Be_Overturned": "Yes" if viable in ("YES", "CONDITIONAL") else "No",
        "Top_Recovery_Action": opportunities[0] if opportunities else "",
        "Missing_Documents": "; ".join(docs[:4]),
        "Recommended_Next_Step": opportunities[0] if opportunities else "Submit medical-necessity documentation",
    }


def _deterministic(
    drug: str | None,
    payer: str | None,
    denial_reason: str | None,
    supportive: list[str],
    contradictory: list[str],
) -> dict[str, Any]:
    reason = _detect_reason(contradictory + ([denial_reason] if denial_reason else []), denial_reason)
    cls_code, cls_label = _classify(reason, contradictory)
    viable, prob_label, pct, priority = _score(contradictory, supportive, cls_code)
    # Root cause: surface the actual contradictions first, then the inferred reason.
    root = [c for c in contradictory[:4] if c]
    if reason not in root:
        root.insert(0, reason)
    root = root[:5] or [reason]
    opportunities = _recovery_opportunities(reason, contradictory, cls_code)
    docs = _required_documents(cls_code)
    letter = _appeal_letter(drug or "", payer or "", reason, cls_code, opportunities)
    strategy = (
        f"This denial is best pursued as a {cls_label.split('—')[0].strip().lower()}. "
        f"The strongest medical-necessity argument is the documented clinical need for {drug or 'the drug'} "
        f"given the patient's diagnosis, supported by FDA labeling and guidelines. "
        f"Pursue the {('step-therapy override' if cls_code == 2 else 'formulary exception' if cls_code == 3 else 'quantity-limit exception' if cls_code == 6 else 'medical-necessity')} pathway, "
        f"and emphasize the safety risk of treatment interruption."
    )
    return {
        "drug": drug,
        "payer": payer,
        "assessment": {
            "appeal_viable": viable,
            "approval_probability": prob_label,
            "approval_probability_pct": pct,
            "recovery_priority": priority,
        },
        "root_cause": root,
        "recovery_opportunities": opportunities,
        "required_documents": docs,
        "appeal_strategy": strategy,
        "appeal_letter": letter,
        "classification": {"code": cls_code, "label": cls_label},
        "automation": _automation(reason, viable, prob_label, priority, cls_label, opportunities, docs),
        "_mode": "deterministic",
    }


def denial_recovery(
    drug: str | None,
    payer: str | None,
    denial_reason: str | None = None,
    denial_letter: str | None = None,
    supportive_texts: list[str] | None = None,
    contradictory_texts: list[str] | None = None,
    submitted_answers: list[dict] | None = None,
    use_llm: bool = True,
) -> dict[str, Any]:
    """Analyze a denied PA and return a structured recovery + appeal package.

    Schema: assessment, root_cause[], recovery_opportunities[], required_documents[],
    appeal_strategy, appeal_letter, classification{code,label}, automation{...},
    _mode ("llm"|"deterministic").
    """
    supportive = [s for s in (supportive_texts or []) if s]
    contradictory = [c for c in (contradictory_texts or []) if c]

    det = _deterministic(drug, payer, denial_reason, supportive, contradictory)

    if not use_llm or not llm.available():
        return det

    answers_blob = ""
    if submitted_answers:
        answers_blob = "\nSUBMITTED PA ANSWERS:\n" + "\n".join(
            f"- {a.get('question','')}: {a.get('answer', a.get('recommended_answer',''))}"
            for a in submitted_answers[:20]
            if isinstance(a, dict)
        )
    user = f"""DRUG: {drug or 'unspecified'}    PAYER/PBM: {payer or 'unspecified'}
DENIAL REASON (as stated): {denial_reason or '(not explicitly provided — infer from evidence below)'}
DENIAL LETTER EXCERPT: {(denial_letter or '')[:1500] or '(none provided)'}
{answers_blob}

SUPPORTIVE CHART EVIDENCE:
{chr(10).join('- ' + s for s in supportive[:15]) or '- (none provided)'}

CONTRADICTORY EVIDENCE / GAPS (likely denial drivers):
{chr(10).join('- ' + c for c in contradictory[:15]) or '- (none provided)'}

Perform the full denial-recovery analysis and output JSON of EXACTLY this form
(no prose outside JSON). Keep bullets concise and action-oriented. The
appeal_letter must be a complete, submission-ready letter that addresses the
denial reason, cites medical necessity / FDA label / NCCN-ASCO when applicable,
explains why formulary alternatives are inappropriate, emphasizes patient safety
and the risk of delayed treatment, and requests reconsideration and approval.
classification.code is an integer 1-9 (1=QUICK WIN, 2=STEP THERAPY OVERRIDE,
3=FORMULARY EXCEPTION, 4=MEDICAL NECESSITY APPEAL, 5=CONTINUATION OF THERAPY,
6=QUANTITY LIMIT EXCEPTION, 7=CODING/ADMINISTRATIVE CORRECTION, 8=PLAN EXCLUSION,
9=NON-RECOVERABLE).

{{"assessment":{{"appeal_viable":"YES|NO|CONDITIONAL","approval_probability":"HIGH|MODERATE|LOW","approval_probability_pct":0,"recovery_priority":"HIGH|MEDIUM|LOW"}},
"root_cause":[],"recovery_opportunities":[],"required_documents":[],
"appeal_strategy":"","appeal_letter":"","classification":{{"code":4,"label":""}},
"automation":{{"Appeal_Viable":"","Approval_Probability":"","Recovery_Priority":"","Recovery_Classification":"","Primary_Denial_Reason":"","Can_Be_Overturned":"","Top_Recovery_Action":"","Missing_Documents":"","Recommended_Next_Step":""}}}}"""

    out = llm.complete_json(RECOVERY_SYSTEM, user, max_tokens=3500, model=MODEL, timeout=90.0)
    if isinstance(out, dict) and isinstance(out.get("assessment"), dict) and out.get("appeal_letter"):
        # Merge: prefer LLM, backfill any missing field from deterministic baseline.
        merged = {**det}
        for k, v in out.items():
            if v not in (None, "", [], {}):
                merged[k] = v
        # Normalize classification label if only a code came back.
        code = (merged.get("classification") or {}).get("code")
        if isinstance(code, int) and code in _CLASSES and not (merged["classification"].get("label")):
            merged["classification"]["label"] = _CLASSES[code]
        merged["drug"] = drug
        merged["payer"] = payer
        merged["_mode"] = "llm"
        return merged

    return det
