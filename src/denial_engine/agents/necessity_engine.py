"""Medical Necessity Engine — multi-agent PA approval orchestration.

This is the v2 reasoning brain. It implements the staged design:

    DB1  Patient Document Intelligence   (extract evidence from EMR docs)
    DB2  Drug Criteria Intelligence      (FDA + payer + PBM + guidelines)
    DB3  Historical Approval Intelligence (10k labeled outcomes → patterns)
            │
            ▼
    Deciding Factor Agent (Core Brain)   weighted scoring + recommended path
            │
            ▼
    Evidence Coverage Validator          per-requirement coverage matrix
            │
       ┌────┴─────────────────────┐
       ▼                          ▼
    HIGH_APPROVAL            REQUIRES_REVIEW / missing
    (light re-check)         Approval-Friendly Re-Evaluation (governed)
       └────┬─────────────────────┘
            ▼
    Clinical Answering Agent             answer questionnaire (pharmacy benefits)
            ▼
    Final Justification Agent            prediction + confidence + next steps

Every agent is LLM-powered when ANTHROPIC_API_KEY is set, with a deterministic,
KB-grounded fallback so the pipeline always runs (and runs offline). All stage
outputs + a trace are returned so the orchestration is fully inspectable.

Compliance note: the Approval-Friendly Re-Evaluation agent is a *compliant*
optimizer — it reframes existing evidence in payer-favorable language and finds
legitimately-optional requirements. It is explicitly forbidden from inventing
clinical facts. See APPROVAL_FRIENDLY_SYSTEM.
"""
from __future__ import annotations

import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from denial_engine.core import llm
from denial_engine.agents.criteria_gap_recovery import criteria_gap_recovery
from denial_engine.knowledge.criteria_kb import get_drug, match_case, normalize_drug

# Models. Default to Haiku for interactive latency (≈8 staged calls/case);
# override NECESSITY_MODEL_SMART=claude-sonnet-4-6 for higher-quality reasoning
# in batch/offline runs.
MODEL_SMART = os.environ.get("NECESSITY_MODEL_SMART", "claude-haiku-4-5-20251001")
MODEL_FAST = os.environ.get("NECESSITY_MODEL_FAST", "claude-haiku-4-5-20251001")

# Deciding-Factor scoring weights (from the design).
W_CLINICAL = 0.40
W_CRITERIA = 0.30
W_HISTORICAL = 0.20
W_DOCUMENTATION = 0.10


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _docs_to_text(documents: Any) -> str:
    """Accept a list[str] | list[dict] | str of patient documents -> one blob."""
    if documents is None:
        return "(no documents provided)"
    if isinstance(documents, str):
        return documents
    out: list[str] = []
    for d in documents:
        if isinstance(d, dict):
            title = d.get("title") or d.get("type") or "Document"
            date = d.get("date") or ""
            text = d.get("text") or d.get("content") or json.dumps(d, default=str)
            out.append(f"## {title} {date}\n{text}")
        else:
            out.append(str(d))
    return "\n\n".join(out) or "(no documents provided)"


def _pct(x: float) -> int:
    return max(0, min(100, round(x)))


# --------------------------------------------------------------------------- #
# DB1 — Patient Document Intelligence Engine
# --------------------------------------------------------------------------- #
DB1_SYSTEM = (
    "You are a Prior Authorization Clinical Evidence Extraction Engine. You "
    "analyze patient documents and extract ONLY clinically relevant evidence for "
    "the requested medication. Never infer unsupported facts. Every finding must "
    "trace to a source document."
)


def db1_patient_evidence(drug: str, documents: Any) -> dict[str, Any]:
    doc_text = _docs_to_text(documents)
    user = f"""Requested Drug: {drug}

Patient Documents:
{doc_text}

Extract relevant evidence (diagnosis, ICD codes, medication history, trial/failure
history, contraindications, allergies, labs, imaging, pathology, genetic testing,
weight/BMI, vitals, regimens, provider assessments). Categorize each as Strong
Supporting / Supporting / Neutral / Missing / Contradictory. For each finding give
evidence, source document, date, and a confidence 0-100. Detect missing
documentation that may affect PA approval.

Output JSON:
{{"diagnosis":[],"icd_codes":[],"current_medications":[],"previous_medications":[],
"trial_failure_history":[],"labs":[],"imaging":[],"pathology":[],
"supporting_evidence":[],"missing_evidence":[],"contradictory_evidence":[],
"confidence":0}}"""
    out = llm.complete_json(DB1_SYSTEM, user, max_tokens=2048, model=MODEL_FAST)
    if isinstance(out, dict):
        out["_mode"] = "llm"
        return out
    # Deterministic fallback: treat documents as flat supportive lines.
    lines = doc_text.split("\n") if isinstance(doc_text, str) else []
    return {
        "diagnosis": [], "icd_codes": [], "current_medications": [],
        "previous_medications": [], "trial_failure_history": [], "labs": [],
        "imaging": [], "pathology": [],
        "supporting_evidence": [l for l in lines if l.strip()][:20],
        "missing_evidence": [], "contradictory_evidence": [], "confidence": 50,
        "_mode": "deterministic",
    }


# --------------------------------------------------------------------------- #
# DB2 — Drug Criteria Intelligence Engine  (KB-seeded, LLM-augmented)
# --------------------------------------------------------------------------- #
DB2_SYSTEM = (
    "You are a Pharmacy Benefit Clinical Criteria Engine. You produce the coverage "
    "requirements a PA must satisfy, grounded in FDA labels, payer/PBM policy, and "
    "guideline compendia (NCCN/AHFS/DRUGDEX). Tag every requirement with its source."
)


def _kb_seed_db2(drug: str, payer: str | None) -> dict[str, Any]:
    """Seed DB2 from the mined Criteria KB (deterministic, always available)."""
    entry = get_drug(drug) or {}
    criteria = entry.get("criteria", []) or []
    required_evidence = [
        {"requirement": c.get("statement"), "critical": c.get("critical", False),
         "source": c.get("source")}
        for c in criteria
    ]
    # Matched payer policy (loose name match).
    policies = entry.get("payer_policies", {}) or {}
    matched_name, matched = None, None
    for pname, pdata in policies.items():
        if payer and pname.lower() in payer.lower():
            matched_name, matched = pname, pdata
            break
    if matched is None and policies:
        matched_name, matched = next(iter(policies.items()))
    step_therapy = [matched["step_therapy"]] if matched and matched.get("step_therapy") else []
    return {
        "required_evidence": required_evidence,
        "required_documents": [],
        "required_labs": [],
        "required_trial_failure": step_therapy,
        "step_therapy": step_therapy,
        "approval_drivers": (matched or {}).get("covered_indications", []) or [],
        "denial_drivers": ([matched["not_covered"]] if matched and matched.get("not_covered") else []),
        "matched_policy": (f"{matched_name} {matched.get('policy_number','')}".strip() if matched else None),
        "source_url": (matched or {}).get("source_url"),
        "fda_indication": (entry.get("fda") or {}).get("indications", "")[:400] if entry.get("fda") else "",
        "in_kb": bool(entry),
    }


def db2_drug_criteria(drug: str, payer: str | None) -> dict[str, Any]:
    seed = _kb_seed_db2(drug, payer)
    user = f"""Requested Drug: {drug}
Insurance: {payer or 'unspecified'}

Known criteria from our Criteria KB (history + FDA + payer policy), authoritative —
build on these and fill gaps from FDA label, payer/PBM policy, and NCCN/AHFS/DRUGDEX:
{json.dumps(seed, indent=2)[:3500]}

Produce coverage requirements. Output JSON:
{{"required_evidence":[{{"requirement":"","source":""}}],"required_documents":[],
"required_labs":[],"required_trial_failure":[],"step_therapy":[],
"approval_drivers":[],"denial_drivers":[]}}"""
    out = llm.complete_json(DB2_SYSTEM, user, max_tokens=1800, model=MODEL_FAST)
    if isinstance(out, dict) and out.get("required_evidence"):
        # Keep KB-grounded metadata; layer the LLM fill-ins on top.
        out["matched_policy"] = seed["matched_policy"]
        out["source_url"] = seed["source_url"]
        out["fda_indication"] = seed["fda_indication"]
        out["in_kb"] = seed["in_kb"]
        out["_mode"] = "llm"
        return out
    seed["_mode"] = "deterministic"
    return seed


# --------------------------------------------------------------------------- #
# DB3 — Historical Approval Intelligence  (KB approval rate + optional cases)
# --------------------------------------------------------------------------- #
DB3_SYSTEM = (
    "You are a Prior Authorization Outcome Prediction Engine. You analyze historical "
    "PA outcomes to surface approval/denial patterns and a probability of approval."
)


def _model_approval(drug: str, payer: str | None,
                    supportive_texts: list[str] | None,
                    contradictory_texts: list[str] | None,
                    total_q: int, answered_q: int) -> dict[str, Any] | None:
    """Trained XGBoost+TF-IDF model = our learned historical-approval intelligence.

    Returns approval probability (100 − denial risk) for the case, or None if the
    model artifact/deps are unavailable.
    """
    try:
        from denial_engine.ml.denial_predictor import get_predictor

        case = {
            "drug": drug,
            "medication_class": "Brand",
            "payer_name": payer or "",
            "total_questions": total_q,
            "answered_questions": answered_q,
            "supportive_facts": len(supportive_texts or []),
            "contradictory_facts": len(contradictory_texts or []),
            "supportive_texts": supportive_texts,
            "contradictory_texts": contradictory_texts,
        }
        scored = get_predictor().predict(case)
        return {
            "approval_prob": _pct(100 - scored["denial_risk"]),
            "confidence": _pct(scored.get("confidence", 60)),
            "model": scored.get("model"),
            "model_auc": scored.get("model_auc"),
        }
    except Exception:  # noqa: BLE001 - model optional, never block
        return None


def db3_historical(drug: str, payer: str | None,
                   historical_cases: list[dict] | None = None,
                   supportive_texts: list[str] | None = None,
                   contradictory_texts: list[str] | None = None,
                   total_q: int = 10, answered_q: int = 10) -> dict[str, Any]:
    entry = get_drug(drug) or {}
    base_rate = entry.get("approval_rate")
    n_cases = entry.get("n_cases", 0)
    model = _model_approval(drug, payer, supportive_texts, contradictory_texts,
                            total_q, answered_q)
    # Prefer the trained model's probability; fall back to the KB base rate.
    prob = model["approval_prob"] if model else _pct((base_rate or 0.5) * 100)
    conf = model["confidence"] if model else _pct(min(95, 40 + n_cases))
    seed = {
        "similar_cases": [],
        "top_approval_factors": [],
        "top_denial_factors": [],
        "missing_documents_risk": [],
        "predicted_approval_probability": prob,
        "confidence": conf,
        "n_historical": n_cases,
        "model": (model or {}).get("model"),
        "model_auc": (model or {}).get("model_auc"),
        "kb_base_rate": _pct((base_rate or 0.5) * 100),
    }
    if not historical_cases or not llm.available():
        seed["_mode"] = "deterministic"
        return seed
    user = f"""Drug: {drug}
Payer: {payer or 'unspecified'}
KB base approval rate: {seed['predicted_approval_probability']}% over {n_cases} cases.

Historical Data (sample of labeled outcomes):
{json.dumps(historical_cases[:25], default=str)[:3500]}

Output JSON:
{{"similar_cases":[],"top_approval_factors":[],"top_denial_factors":[],
"missing_documents_risk":[],"predicted_approval_probability":0,"confidence":0}}"""
    out = llm.complete_json(DB3_SYSTEM, user, max_tokens=1400, model=MODEL_FAST)
    if isinstance(out, dict) and "predicted_approval_probability" in out:
        out["n_historical"] = n_cases
        out["_mode"] = "llm"
        return out
    seed["_mode"] = "deterministic"
    return seed


# --------------------------------------------------------------------------- #
# Deterministic scoring (always-on baseline + fallback for the Core Brain)
# --------------------------------------------------------------------------- #
def _deterministic_scores(match: dict | None, db3: dict) -> dict[str, Any]:
    if not match:
        hist = db3.get("predicted_approval_probability", 50)
        overall = _pct(W_HISTORICAL * hist + (1 - W_HISTORICAL) * 50)
        return {
            "clinical_match_score": 50, "criteria_coverage_score": 50,
            "historical_match_score": hist, "documentation_score": 50,
            "overall_approval_probability": overall, "confidence_score": 40,
        }
    crit = match.get("criteria", [])
    total = len(crit) or 1
    met = sum(1 for c in crit if c.get("status") == "MET")
    at_risk = sum(1 for c in crit if c.get("status") == "AT_RISK")
    verified = sum(1 for c in crit if c.get("status") != "UNVERIFIED")
    critical = [c for c in crit if c.get("critical")]
    critical_met = sum(1 for c in critical if c.get("status") == "MET")
    clinical = (critical_met / len(critical) * 100) if critical else (met / total * 100)
    coverage = match.get("readiness_pct", met / total * 100)
    historical = db3.get("predicted_approval_probability", 50)
    documentation = verified / total * 100

    if db3.get("model"):
        # Model-backed backbone (learned from 10k outcomes; AUC ~0.83), nudged by
        # the explainable evidence signals. The model already encodes the dominant
        # signals (contradictions, completeness), so evidence is an adjustment.
        overall = (
            historical
            + (clinical - 50) * 0.12
            + (coverage - 50) * 0.08
            - at_risk * 4
        )
        confidence = db3.get("confidence", 60)
    else:
        # No model artifact: fall back to the pure weighted design.
        overall = (
            W_CLINICAL * clinical + W_CRITERIA * coverage
            + W_HISTORICAL * historical + W_DOCUMENTATION * documentation
        )
        confidence = _pct(55 + (documentation - 50) * 0.4)
    return {
        "clinical_match_score": _pct(clinical),
        "criteria_coverage_score": _pct(coverage),
        "historical_match_score": _pct(historical),
        "documentation_score": _pct(documentation),
        "overall_approval_probability": _pct(overall),
        "confidence_score": _pct(confidence),
    }


def _path_for(scores: dict, critical_unmet: int) -> str:
    # Probability-driven bands (the model backbone is the reliable signal); the
    # critical-gap count only blocks an otherwise-high case from going touchless.
    p = scores["overall_approval_probability"]
    if p >= 68 and critical_unmet <= 1:
        return "HIGH_APPROVAL"
    if p < 42:
        return "LIKELY_DENIAL"
    return "REQUIRES_REVIEW"


# --------------------------------------------------------------------------- #
# Deciding Factor Agent (Core Brain)
# --------------------------------------------------------------------------- #
DECIDING_SYSTEM = (
    "You are a Senior Clinical Prior Authorization Reviewer. You weigh patient "
    "evidence (DB1) against drug criteria (DB2) and historical outcomes (DB3) and "
    "decide whether the patient meets criteria. Be strict and payer-minded. "
    "Scoring weights: Clinical Match 40%, Criteria Coverage 30%, Historical 20%, "
    "Documentation 10%."
)


def deciding_factor(db1: dict, db2: dict, db3: dict,
                    det_scores: dict, critical_unmet: int) -> dict[str, Any]:
    user = f"""Patient Evidence (DB1):
{json.dumps(db1, default=str)[:2500]}

Drug Criteria (DB2):
{json.dumps(db2, default=str)[:2500]}

Historical Outcomes (DB3):
{json.dumps(db3, default=str)[:1500]}

Deterministic baseline scores (cross-check, refine if warranted): {json.dumps(det_scores)}

Determine criteria match, supporting/missing/contradicting evidence, approval
probability and confidence. Output JSON:
{{"clinical_match_score":0,"criteria_coverage_score":0,"historical_match_score":0,
"documentation_score":0,"overall_approval_probability":0,"confidence_score":0,
"supporting_reasons":[],"missing_requirements":[],"contradictions":[],
"recommended_path":"HIGH_APPROVAL|REQUIRES_REVIEW|LIKELY_DENIAL"}}"""
    out = llm.complete_json(DECIDING_SYSTEM, user, max_tokens=1800, model=MODEL_SMART)
    if isinstance(out, dict) and "overall_approval_probability" in out:
        path = str(out.get("recommended_path", "")).upper()
        if path not in ("HIGH_APPROVAL", "REQUIRES_REVIEW", "LIKELY_DENIAL"):
            path = _path_for(out, critical_unmet)
        out["recommended_path"] = path
        out["_mode"] = "llm"
        return out
    return {
        **det_scores,
        "supporting_reasons": [], "missing_requirements": [], "contradictions": [],
        "recommended_path": _path_for(det_scores, critical_unmet),
        "_mode": "deterministic",
    }


# --------------------------------------------------------------------------- #
# Evidence Coverage Validator  (between Deciding Factor and Clinical Answering)
# --------------------------------------------------------------------------- #
COVERAGE_SYSTEM = (
    "You are an Evidence Coverage Validator. For each payer requirement you state "
    "whether the patient's evidence is present, which document supports it, your "
    "confidence, and whether it is missing. You return a coverage matrix only."
)


def coverage_validator(db1: dict, db2: dict, match: dict | None) -> dict[str, Any]:
    # Deterministic matrix straight from the evidence↔criteria match.
    det_matrix = []
    if match:
        for c in match.get("criteria", []):
            st = c.get("status")
            det_matrix.append({
                "requirement": c.get("statement"),
                "critical": c.get("critical", False),
                "present": st == "MET",
                "supporting_document": c.get("evidence") or None,
                "confidence": 80 if st == "MET" else (30 if st == "AT_RISK" else 10),
                "missing": st != "MET",
            })
    if not llm.available() or not det_matrix:
        return {"coverage_matrix": det_matrix, "_mode": "deterministic"}
    user = f"""Payer requirements (DB2):
{json.dumps(db2.get('required_evidence', []), default=str)[:2500]}

Patient evidence (DB1):
{json.dumps(db1, default=str)[:2500]}

Deterministic matrix (refine): {json.dumps(det_matrix, default=str)[:2000]}

For each payer requirement return: requirement, present (bool), supporting_document,
confidence 0-100, missing (bool). Output JSON: {{"coverage_matrix":[]}}"""
    out = llm.complete_json(COVERAGE_SYSTEM, user, max_tokens=1600, model=MODEL_FAST)
    if isinstance(out, dict) and isinstance(out.get("coverage_matrix"), list) and out["coverage_matrix"]:
        out["_mode"] = "llm"
        return out
    return {"coverage_matrix": det_matrix, "_mode": "deterministic"}


# --------------------------------------------------------------------------- #
# Approval-Friendly Re-Evaluation Agent  (governed grey-area optimizer)
# --------------------------------------------------------------------------- #
APPROVAL_FRIENDLY_SYSTEM = (
    "You are an Approval Optimization Agent for prior authorizations. You re-evaluate "
    "a case from an approval perspective. STRICT RULES: (1) You may NOT invent, "
    "assume, or fabricate any clinical fact, lab value, diagnosis, or trial/failure "
    "that is not in the provided evidence. (2) You MAY reframe existing evidence in "
    "payer-favorable, medically-accurate language. (3) You MAY identify requirements "
    "that are genuinely optional, satisfiable by substitute evidence, or not "
    "applicable to this indication, and say so with the rationale. (4) For true gaps, "
    "you state exactly what documentation the provider must supply — you never paper "
    "over them. This keeps optimization compliant and audit-defensible."
)


def approval_friendly_reeval(approval_probability: int,
                             supporting_evidence: Any,
                             missing_evidence: Any,
                             db2: dict) -> dict[str, Any]:
    if not llm.available():
        return {
            "enhanced_justification": None,
            "evidence_coverage_map": [],
            "remaining_risks": missing_evidence if isinstance(missing_evidence, list) else [],
            "final_approval_confidence": approval_probability,
            "_mode": "deterministic",
        }
    user = f"""Current Approval Probability: {approval_probability}%

Supporting Evidence:
{json.dumps(supporting_evidence, default=str)[:2000]}

Missing Evidence:
{json.dumps(missing_evidence, default=str)[:1500]}

Payer requirements (DB2):
{json.dumps(db2.get('required_evidence', []), default=str)[:1500]}

Re-evaluate from an approval perspective per your strict rules. Output JSON:
{{"enhanced_justification":"","evidence_coverage_map":[],"remaining_risks":[],
"truly_required_missing":[],"substitute_evidence":[],"final_approval_confidence":0}}"""
    out = llm.complete_json(APPROVAL_FRIENDLY_SYSTEM, user, max_tokens=1600, model=MODEL_SMART)
    if isinstance(out, dict):
        out["_mode"] = "llm"
        return out
    return {"final_approval_confidence": approval_probability, "_mode": "deterministic"}


# --------------------------------------------------------------------------- #
# Clinical Answering Agent  (answer the questionnaire — pharmacy benefits)
# --------------------------------------------------------------------------- #
CLINICAL_SYSTEM = (
    "You are a Clinical Prior Authorization Answering Agent operating under the "
    "pharmacy benefit. You answer each questionnaire item the way a payer expects, "
    "grounded strictly in the provided evidence and criteria. For each item give the "
    "recommended answer, a clinical+payer justification, and the supporting citation."
)


def clinical_answering(questions: list[dict] | None, db1: dict, db2: dict,
                       coverage: dict, recommended_path: str) -> dict[str, Any]:
    # Build the question set from the payer requirements when none supplied.
    if not questions:
        questions = [
            {"question": r.get("requirement"), "critical": r.get("critical", False)}
            for r in db2.get("required_evidence", [])
        ]
    if not llm.available():
        # Deterministic: answer from the coverage matrix.
        cov = {c.get("requirement"): c for c in coverage.get("coverage_matrix", [])}
        answers = []
        for q in questions:
            c = cov.get(q.get("question"), {})
            present = c.get("present")
            answers.append({
                "question": q.get("question"),
                "recommended_answer": "Yes — supported by chart" if present else "Needs documentation",
                "status": "MET" if present else "UNVERIFIED",
                "justification": None,
                "citation": c.get("supporting_document"),
            })
        return {"answers": answers, "_mode": "deterministic"}
    user = f"""Recommended path: {recommended_path}

Questionnaire items:
{json.dumps([q.get('question') for q in questions], default=str)[:2500]}

Coverage matrix:
{json.dumps(coverage.get('coverage_matrix', []), default=str)[:2000]}

Patient evidence (DB1):
{json.dumps(db1, default=str)[:1800]}

Answer each item in pharmacy-benefit terms. Output JSON:
{{"answers":[{{"question":"","recommended_answer":"","status":"MET|AT_RISK|UNVERIFIED",
"justification":"","citation":""}}]}}"""
    out = llm.complete_json(CLINICAL_SYSTEM, user, max_tokens=2200, model=MODEL_SMART)
    if isinstance(out, dict) and isinstance(out.get("answers"), list):
        out["_mode"] = "llm"
        return out
    return {"answers": [], "_mode": "deterministic"}


# --------------------------------------------------------------------------- #
# Final Intelligence / Justification Agent
# --------------------------------------------------------------------------- #
FINAL_SYSTEM = (
    "You are a Senior Prior Authorization Clinical Decision Engine. You produce the "
    "final approval prediction, confidence, clinical justification, risks, missing "
    "documentation, and the recommended next action."
)


def final_justification(clinical: dict, deciding: dict, db1: dict,
                        db3: dict) -> dict[str, Any]:
    overall = deciding.get("overall_approval_probability", 50)
    det_pred = "APPROVE" if overall >= 70 else ("DENY" if overall < 40 else "PEND")
    if not llm.available():
        return {
            "approval_prediction": det_pred,
            "confidence_score": deciding.get("confidence_score", 50),
            "clinical_justification": "; ".join(deciding.get("supporting_reasons", [])) or None,
            "key_supporting_factors": deciding.get("supporting_reasons", []),
            "key_risks": deciding.get("contradictions", []) + deciding.get("missing_requirements", []),
            "recommended_next_steps": deciding.get("missing_requirements", []),
            "_mode": "deterministic",
        }
    user = f"""Clinical Answers:
{json.dumps(clinical.get('answers', []), default=str)[:2200]}

Deciding Factor scores:
{json.dumps(deciding, default=str)[:1800]}

Historical (DB3):
{json.dumps(db3, default=str)[:1200]}

Output JSON:
{{"approval_prediction":"APPROVE|PEND|DENY","confidence_score":0,
"clinical_justification":"","key_supporting_factors":[],"key_risks":[],
"recommended_next_steps":[]}}"""
    out = llm.complete_json(FINAL_SYSTEM, user, max_tokens=1600, model=MODEL_SMART)
    if isinstance(out, dict) and out.get("approval_prediction"):
        out["approval_prediction"] = str(out["approval_prediction"]).upper()
        out["_mode"] = "llm"
        return out
    return {"approval_prediction": det_pred,
            "confidence_score": deciding.get("confidence_score", 50),
            "_mode": "deterministic"}


# --------------------------------------------------------------------------- #
# Orchestrator
# --------------------------------------------------------------------------- #
def _match_case(engine: str, drug_n: str | None,
                supportive_texts: list[str] | None,
                contradictory_texts: list[str] | None) -> dict[str, Any] | None:
    """Evidence↔criteria match. engine='graph' routes through the PMG-compatible
    knowledge graph (semantic + negation/exclusion aware); default is the
    content-word-overlap heuristic. Both return the same shape."""
    if not drug_n:
        return None
    if engine == "graph":
        try:
            from denial_engine.knowledge import graph_kb
            return graph_kb.match_case(drug_n, supportive_texts, contradictory_texts)
        except Exception:
            pass  # fall back to heuristic if graph KB unavailable
    return match_case(drug_n, supportive_texts, contradictory_texts)


def run_medical_necessity(
    drug: str | None,
    payer: str | None = None,
    documents: Any = None,
    supportive_texts: list[str] | None = None,
    contradictory_texts: list[str] | None = None,
    questions: list[dict] | None = None,
    historical_cases: list[dict] | None = None,
    engine: str = "default",
) -> dict[str, Any]:
    """Run the full medical-necessity pipeline and return every stage + verdict.

    engine: 'default' uses the content-overlap criteria matcher; 'graph' uses the
    PMG-compatible knowledge-graph matcher (graph_kb).
    """
    drug_n = normalize_drug(drug) if drug else None
    trace: list[dict[str, Any]] = []

    def step(name: str, role: str, mode: str) -> None:
        trace.append({"agent": name, "role": role, "mode": mode})

    # If no explicit documents, synthesize them from supportive/contradictory text.
    if documents is None and (supportive_texts or contradictory_texts):
        documents = [
            *(f"SUPPORTIVE: {t}" for t in (supportive_texts or [])),
            *(f"NOTED/CONTRADICTORY: {t}" for t in (contradictory_texts or [])),
        ]

    n_q = len(questions) if questions else 10

    # DB1 / DB2 run concurrently (independent); DB3 is model-backed + fast.
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_db1 = ex.submit(db1_patient_evidence, drug_n or "", documents)
        f_db2 = ex.submit(db2_drug_criteria, drug_n or "", payer)
        db3 = db3_historical(
            drug_n or "", payer, historical_cases,
            supportive_texts=supportive_texts, contradictory_texts=contradictory_texts,
            total_q=n_q, answered_q=n_q,
        )
        db1 = f_db1.result()
        db2 = f_db2.result()
    step("DB1 · Patient Document Intelligence", "Extracts clinical evidence from EMR docs", db1.get("_mode"))
    step("DB2 · Drug Criteria Intelligence", "Coverage requirements: FDA + payer + PBM + guidelines", db2.get("_mode"))
    step("DB3 · Historical Approval Intelligence", "Approval patterns + probability from 10k outcomes", db3.get("_mode"))

    # Evidence↔criteria match (drives deterministic scoring + coverage).
    match = _match_case(engine, drug_n, supportive_texts, contradictory_texts)
    critical_unmet = (match or {}).get("critical_unmet", 0)
    det_scores = _deterministic_scores(match, db3)

    # Deciding Factor + Coverage Validator run concurrently (both need DB1/2/3).
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_dec = ex.submit(deciding_factor, db1, db2, db3, det_scores, critical_unmet)
        f_cov = ex.submit(coverage_validator, db1, db2, match)
        deciding = f_dec.result()
        coverage = f_cov.result()
    step("Deciding Factor (Core Brain)", "Weighted scoring + recommended path", deciding.get("_mode"))
    step("Evidence Coverage Validator", "Per-requirement coverage matrix", coverage.get("_mode"))

    # Branch: grey-area optimization (if not clean HIGH) runs concurrently with
    # clinical answering — neither depends on the other.
    path = deciding.get("recommended_path", "REQUIRES_REVIEW")
    reeval = None
    with ThreadPoolExecutor(max_workers=3) as ex:
        f_clin = ex.submit(clinical_answering, questions, db1, db2, coverage, path)
        f_gap = ex.submit(criteria_gap_recovery, drug_n, payer, match, db2, False)
        f_reev = (
            ex.submit(
                approval_friendly_reeval,
                deciding.get("overall_approval_probability", 50),
                deciding.get("supporting_reasons") or supportive_texts,
                deciding.get("missing_requirements") or [],
                db2,
            )
            if path != "HIGH_APPROVAL"
            else None
        )
        clinical = f_clin.result()
        gap = f_gap.result()
        reeval = f_reev.result() if f_reev else None
    if reeval is not None:
        step("Approval-Friendly Re-Evaluation", "Compliant grey-area optimization", reeval.get("_mode"))
    if gap.get("n_unmet"):
        step("Criteria Gap Recovery", "Recovery pathways + appeal strategy for unmet criteria", gap.get("_mode"))
    step("Clinical Answering", "Answers the questionnaire (pharmacy benefit framing)", clinical.get("_mode"))

    # Final Justification
    final = final_justification(clinical, deciding, db1, db3)
    step("Final Justification", "Final prediction + confidence + next steps", final.get("_mode"))

    modes = {t["mode"] for t in trace}
    reasoning_mode = "llm" if "llm" in modes else "deterministic"

    return {
        "drug": drug_n,
        "payer": payer,
        "reasoning_mode": reasoning_mode,
        "coverage_engine": (match or {}).get("engine", "default"),
        "recommended_path": path,
        "scores": {
            "clinical_match_score": deciding.get("clinical_match_score"),
            "criteria_coverage_score": deciding.get("criteria_coverage_score"),
            "historical_match_score": deciding.get("historical_match_score"),
            "documentation_score": deciding.get("documentation_score"),
            "overall_approval_probability": deciding.get("overall_approval_probability"),
            "confidence_score": deciding.get("confidence_score"),
        },
        "final_prediction": final.get("approval_prediction"),
        "final_confidence": final.get("confidence_score"),
        "db1": db1,
        "db2": db2,
        "db3": db3,
        "deciding_factor": deciding,
        "coverage": coverage,
        "approval_friendly_reeval": reeval,
        "gap_recovery": gap,
        "clinical_answers": clinical,
        "final": final,
        "agents": trace,
    }
