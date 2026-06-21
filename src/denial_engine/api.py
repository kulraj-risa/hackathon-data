"""RISA Denial Prevention Engine - FastAPI API (no Streamlit).

Serves a small JSON API consumed by the Next.js frontend (see web/). Runs
entirely on precomputed, de-identified data baked into the container
(app_data/), so the hosted service never touches live PHI or the prod
BigQuery project.

Inference (predict / predict-batch) loads the trained XGBoost + TF-IDF model
from app_data/denial_model.pkl and returns risk, SHAP-style top factors, and
recommendations. Model TRAINING happens offline/locally, not in this serving
container -- see DEPLOY.md.
"""

from __future__ import annotations

import json
import re
from typing import Any

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from denial_engine.core.config import APP_DATA_DIR
from denial_engine.core.storage import get_store

# De-identified artifacts baked into the image. Resolved via config so it honors
# the APP_DATA_DIR env override (set in the container).
APP_DATA = APP_DATA_DIR

app = FastAPI(
    title="RISA Denial Prevention Engine",
    description="Predict pharmacy PA denials before submission (60% -> 95% approval).",
    version="1.0.0",
)

# Allow the pharmacy-app (and the standalone dashboard) to call this API from a
# browser on a different origin. Open for the hackathon demo; tighten to the
# specific app origins for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Cached data loaders (read precomputed de-identified artifacts once)
# --------------------------------------------------------------------------- #
def _read_json(name: str, default: Any) -> Any:
    p = APP_DATA / name
    return json.loads(p.read_text()) if p.exists() else default


def _load_summary() -> dict:
    return _read_json("summary.json", {})


def _load_insights() -> dict:
    return _read_json("insights.json", {})


def _load_samples() -> list[dict]:
    return _read_json("sample_cases.json", [])


def _load_denial_stats() -> list[dict]:
    p = APP_DATA / "denial_stats.csv"
    if not p.exists():
        return []
    df = pd.read_csv(p)
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")


# --------------------------------------------------------------------------- #
# API models
# --------------------------------------------------------------------------- #
class PredictRequest(BaseModel):
    medication_class: str = "Brand"
    payer_name: str = "Aetna Commercial"
    drug: str | None = None  # brand/drug name -> enables per-drug criteria match
    case_id: str = "demo"
    total_questions: int = 10
    answered_questions: int = 10
    supportive_facts: int = 8
    contradictory_facts: int = 4
    # Optional rich evidence text. When provided, the model uses its TF-IDF
    # channel (AUC ~0.83) and counts are derived from the list lengths; the
    # int counts above are the fallback when no text is supplied.
    supportive_texts: list[str] | None = None
    contradictory_texts: list[str] | None = None


class BatchRequest(BaseModel):
    cases: list[PredictRequest]


# --------------------------------------------------------------------------- #
# API routes
# --------------------------------------------------------------------------- #
@app.get("/")
def root() -> dict:
    """API index. The UI is the separate Next.js service (see web/)."""
    return {
        "service": "risa-denial-api",
        "docs": "/docs",
        "endpoints": ["/api/summary", "/api/insights", "/api/denial-stats", "/api/samples", "/api/showcase", "/api/filing-queue", "/api/predict", "/api/predict-batch", "/api/impact", "/api/outcome", "/api/audit", "/api/triage", "/api/criteria", "/api/criteria/{drug}", "/api/graph/stats", "/api/graph/drug/{drug}", "/api/graph/match", "/api/graph/eval", "/api/graph/cypher", "/api/completed-cases", "/api/answer-review", "/api/answer", "/api/agents", "/api/necessity", "/api/gap-recovery", "/api/denial-recovery"],
    }


@app.get("/healthz")
def healthz() -> dict:
    """Liveness probe for Cloud Run."""
    return {"status": "ok"}


@app.get("/api/summary")
def api_summary() -> dict:
    return _load_summary()


@app.get("/api/insights")
def api_insights() -> dict:
    """Aggregate denial-risk insights derived from the trained model + data."""
    return _load_insights()


@app.get("/api/denial-stats")
def api_denial_stats() -> list[dict]:
    return _load_denial_stats()


@app.get("/api/samples")
def api_samples() -> list[dict]:
    return _load_samples()


@app.get("/api/showcase")
def api_showcase() -> list[dict]:
    """Curated real PA cases (predicted vs. actual outcome) for the demo."""
    return _read_json("showcase_cases.json", [])


@app.get("/api/filing-queue")
def api_filing_queue() -> list[dict]:
    """Dummy-patient PA worklist (synthetic identities + real evidence)."""
    return _read_json("filing_queue.json", [])


@app.get("/api/groundtruth")
def api_groundtruth() -> dict:
    """Closed-loop validation: AI decisions vs. clinician-verified ground truth.

    Snapshot of how often the criteria-decisioning agreed with expert reviewers
    on real, human-graded coverage criteria (PHI-safe: decisions + counts only,
    no patient text). Produced by groundtruth_eval.py from the medical-necessity
    QA pipeline's criteria_validations.
    """
    return _read_json("groundtruth_eval.json", {})


@app.get("/api/audit")
def api_audit(limit: int = 100) -> list[dict]:
    return get_store().list_predictions(limit=limit)


@app.get("/api/impact")
def api_impact() -> dict:
    """Business case / ROI (config-driven, with model-grounded scenario)."""
    from impact_calculator import compute_impact

    recall = (_load_insights().get("model") or {}).get("recall")
    return compute_impact(recall=recall)


@app.post("/api/predict")
def api_predict(req: PredictRequest) -> dict:
    """Score a PA case with the trained XGBoost model.

    Falls back to a placeholder only if the model artifact is missing
    (e.g. before `python model_trainer.py` has been run).
    """
    case = req.model_dump()
    try:
        from denial_engine.ml.denial_predictor import get_predictor

        scored = get_predictor().predict(case)
        model_name = scored["model"]
    except Exception:  # noqa: BLE001  - model missing / deps absent -> placeholder
        scored = {
            "denial_risk": 85.0,
            "risk_level": "HIGH",
            "recommendations": ["Train the model: run `python model_trainer.py`."],
        }
        model_name = "placeholder"

    result = {
        "case_id": req.case_id,
        "medication_class": req.medication_class,
        "payer_name": req.payer_name,
        "denial_risk": scored["denial_risk"],
        "risk_level": scored["risk_level"],
        "decision": scored.get("decision"),
        "recommendations": scored["recommendations"],
        "event": "predict",
    }
    rid = get_store().log_prediction(result)

    # Evidence -> criteria match (only when a drug is given and is in the KB).
    criteria_match = None
    try:
        from denial_engine.knowledge.criteria_kb import match_case

        criteria_match = match_case(req.drug, req.supportive_texts, req.contradictory_texts)
    except Exception:  # noqa: BLE001 - KB is optional, never block scoring
        criteria_match = None

    return {
        **result,
        "drug": req.drug,
        "confidence": scored.get("confidence"),
        "decision_reason": scored.get("decision_reason"),
        "risk_factors": scored.get("risk_factors", []),
        "criteria_match": criteria_match,
        "record_id": rid,
        "model": model_name,
        "model_auc": scored.get("model_auc"),
    }


@app.get("/api/triage")
def api_triage() -> dict:
    """Addressable-denial split (from denial_triage.py)."""
    from denial_engine.knowledge.criteria_kb import triage_summary

    return triage_summary()


@app.get("/api/criteria")
def api_criteria() -> list[dict]:
    """Per-drug index of the mined Criteria KB."""
    from denial_engine.knowledge.criteria_kb import list_drugs

    return list_drugs()


@app.get("/api/criteria/{drug}")
def api_criteria_drug(drug: str) -> dict:
    """Full criteria checklist for one drug (history + FDA)."""
    from denial_engine.knowledge.criteria_kb import get_drug

    return get_drug(drug) or {}


# --------------------------------------------------------------------------- #
# Clinical Knowledge Graph (graph_kb) — inspect the DB, match, and validate
# --------------------------------------------------------------------------- #
@app.get("/api/graph/stats")
def api_graph_stats() -> dict:
    """Inventory of the in-memory clinical knowledge graph (PMG-compatible).

    Returns node/edge counts by type, the drug coverage, the typed schema, and
    the semantic matcher's thresholds — proof the graph DB is real and loaded.
    """
    from denial_engine.knowledge.graph_kb import (
        COVERAGE_LABELS,
        PATIENT_LABELS,
        ClinicalKnowledgeGraph,
        get_graph,
    )

    g = get_graph()
    labels: dict[str, int] = {}
    for n in g.nodes.values():
        labels[n.label] = labels.get(n.label, 0) + 1
    rels: dict[str, int] = {}
    for e in g.edges:
        rels[e.rel] = rels.get(e.rel, 0) + 1
    drugs = sorted(str(n.props.get("name")) for n in g.nodes_with_label("Drug"))
    return {
        "engine": "graph_kb (in-memory, Neo4j/PMG-compatible)",
        "nodes": len(g.nodes),
        "edges": len(g.edges),
        "node_labels": labels,
        "edge_types": rels,
        "drugs_covered": len(drugs),
        "drugs": drugs,
        "schema": {
            "patient_layer": sorted(PATIENT_LABELS),
            "coverage_layer": sorted(COVERAGE_LABELS),
        },
        "matcher": {
            "method": "TF-IDF cosine similarity + negation / contradiction / exclusion awareness",
            "thresholds": {
                "SIM_MET": ClinicalKnowledgeGraph.SIM_MET,
                "SIM_TOUCH": ClinicalKnowledgeGraph.SIM_TOUCH,
            },
        },
    }


@app.get("/api/graph/drug/{drug}")
def api_graph_drug(drug: str) -> dict:
    """The Drug→Criterion→CoveragePolicy subgraph for one drug (with provenance)."""
    from denial_engine.knowledge.graph_kb import _norm_drug, get_graph

    g = get_graph()
    d = _norm_drug(drug)
    duid = f"Drug:{d}"
    if duid not in g.nodes:
        return {
            "drug": d,
            "found": False,
            "available_drugs": sorted(str(n.props.get("name")) for n in g.nodes_with_label("Drug")),
        }
    dn = g.nodes[duid]
    criteria = [{"uid": c.uid, **c.props} for c in g.neighbors(duid, "REQUIRES")]
    policies = [
        {"uid": n.uid, **n.props}
        for n in g.nodes_with_label("CoveragePolicy")
        if n.props.get("drug") == d
    ]
    return {
        "drug": d,
        "found": True,
        "drug_props": dn.props,
        "n_criteria": len(criteria),
        "n_critical": sum(1 for c in criteria if c.get("critical")),
        "criteria": criteria,
        "coverage_policies": policies,
    }


class GraphMatchRequest(BaseModel):
    drug: str | None = None
    supportive_texts: list[str] | None = None
    contradictory_texts: list[str] | None = None


@app.post("/api/graph/match")
def api_graph_match(req: GraphMatchRequest) -> dict:
    """Run the graph coverage match: semantic, contradiction-aware, with the
    actual evidence line that drove each criterion's MET / AT_RISK / UNVERIFIED.
    """
    from denial_engine.knowledge.graph_kb import match_case

    out = match_case(req.drug, req.supportive_texts, req.contradictory_texts)
    return out or {"error": "drug not found in graph KB", "drug": req.drug}


@app.get("/api/graph/eval")
def api_graph_eval() -> dict:
    """Measured head-to-head accuracy of the graph KB vs. the content-overlap
    baseline on the historic 10k PAs (reproducible via tools/eval_graph_kb.py).
    """
    return {
        "dataset": "10,000 historic PAs; balanced sample n=4000, k=25",
        "reproduce": "PYTHONPATH=src python tools/eval_graph_kb.py --n 4000 --k 25",
        "coverage_matcher": {
            "metric": "AUC of readiness → approval (model-free signal quality)",
            "baseline_content_overlap_auc": 0.632,
            "graph_semantic_analog_auc": 0.664,
            "delta": 0.032,
            "winner": "graph",
            "cases_scored": 223,
            "note": "Lift is modest on this set because historic facts are free-text Q&A "
                    "with no coded values (no LOINC/ICD/RxCUI). The graph's exact coded "
                    "matching advantage appears once evidence is coded (PMG ingestion).",
        },
        "graph_db3_similar_patient_retrieval": {
            "method": "Explainable cosine k-NN neighbor vote (with neighbor provenance)",
            "accuracy": 0.713,
            "auc": 0.794,
            "train_test": "3000 / 1000",
            "vs_xgboost_auc": 0.84,
            "note": "Competitive with the opaque XGBoost, but every prediction is "
                    "explained by the actual nearest historic cases that drove it.",
        },
    }


@app.get("/api/graph/cypher")
def api_graph_cypher() -> dict:
    """The Neo4j/PMG drop-in: schema + sample upsert + the single-traversal
    coverage query that replaces app-side matching once data lives in PMG.
    """
    from denial_engine.knowledge.graph_kb import Neo4jPMGAdapter, get_graph

    adapter = Neo4jPMGAdapter(get_graph())
    return {
        "schema_cypher": adapter.schema_cypher(),
        "sample_upsert_cypher": adapter.upsert_cypher()[:15],
        "coverage_query_cypher": adapter.coverage_query_cypher(),
    }


# --------------------------------------------------------------------------- #
# Case QA Review — replay previously-completed PAs through the engine and
# compare the bot's questionnaire answering + decision to the real submission.
# --------------------------------------------------------------------------- #
@app.get("/api/completed-cases")
def api_completed_cases(limit: int = 50) -> list[dict]:
    """Previously-completed PAs with their full questionnaire, the actual answer
    that was submitted per question, and the real payer outcome. PHI-safe
    historical Q&A baked into the image (see tools/build_completed_cases.py).
    """
    cases = _read_json("completed_cases.json", [])
    return cases[: max(1, min(limit, len(cases)))]


def _yn(s: str | None) -> bool | None:
    """Coerce an answer to a yes/no boolean for agreement scoring, else None."""
    t = (s or "").strip().lower()
    if not t:
        return None
    if t in ("yes", "y", "true", "met"):
        return True
    if t in ("no", "n", "false"):
        return False
    head = t[:24]
    if head.startswith("yes") or "— supported" in t or "supported by chart" in t:
        return True
    if head.startswith("no") or "needs documentation" in t or "not " in head:
        return False
    return None


def _answers_agree(actual: str | None, bot: str | None) -> bool | None:
    a, b = _yn(actual), _yn(bot)
    if a is None or b is None:
        return None  # free-text / non-binary — not auto-comparable
    return a == b


def _norm_q(q: str | None) -> str:
    return re.sub(r"\s+", " ", (q or "").strip().lower())[:80]


class AnswerReviewQuestion(BaseModel):
    question: str
    actual_answer: str | None = None
    options: list[str] | None = None


class AnswerReviewRequest(BaseModel):
    drug: str | None = None
    payer_name: str | None = None
    medication_class: str | None = "Brand"
    supportive_texts: list[str] | None = None
    contradictory_texts: list[str] | None = None
    questions: list[AnswerReviewQuestion] | None = None
    actual_outcome: str | None = None  # "Approved" | "Denied"
    total_questions: int | None = None
    answered_questions: int | None = None


@app.post("/api/answer-review")
def api_answer_review(req: AnswerReviewRequest) -> dict:
    """Replay one completed case: run the medical-necessity engine over its
    questionnaire, compare the bot's per-question answer to the actual answer,
    and compare both the necessity engine AND the XGBoost model's predicted
    decision to the real payer outcome.
    """
    from denial_engine.agents.necessity_engine import run_medical_necessity

    qs = [{"question": q.question} for q in (req.questions or []) if q.question]
    nec = run_medical_necessity(
        drug=req.drug,
        payer=req.payer_name,
        supportive_texts=req.supportive_texts,
        contradictory_texts=req.contradictory_texts,
        questions=qs or None,
    )

    bot_answers = (nec.get("clinical_answers") or {}).get("answers") or []
    by_text: dict[str, dict] = {}
    for a in bot_answers:
        by_text[_norm_q(a.get("question"))] = a

    review: list[dict] = []
    agree = comparable = 0
    for i, q in enumerate(req.questions or []):
        a = by_text.get(_norm_q(q.question)) or (bot_answers[i] if i < len(bot_answers) else {})
        bot_ans = a.get("recommended_answer")
        agreed = _answers_agree(q.actual_answer, bot_ans)
        if agreed is not None:
            comparable += 1
            agree += int(agreed)
        review.append(
            {
                "question": q.question,
                "actual_answer": q.actual_answer,
                "bot_answer": bot_ans,
                "status": a.get("status"),
                "justification": a.get("justification"),
                "citation": a.get("citation"),
                "agree": agreed,
            }
        )

    scores = nec.get("scores") or {}
    final = nec.get("final") or {}
    prob = scores.get("overall_approval_probability") or 50
    pred = str(final.get("approval_prediction") or "").upper()
    nec_predicts = "Approved" if pred == "APPROVE" else "Denied" if pred == "DENY" else (
        "Approved" if prob >= 50 else "Denied"
    )

    xgb = None
    try:
        from denial_engine.ml.denial_predictor import get_predictor

        scored = get_predictor().predict(
            {
                "medication_class": req.medication_class or "Brand",
                "payer_name": req.payer_name or "",
                "drug": req.drug,
                "total_questions": req.total_questions or len(qs) or 10,
                "answered_questions": req.answered_questions or len(qs) or 10,
                "supportive_texts": req.supportive_texts,
                "contradictory_texts": req.contradictory_texts,
            }
        )
        xgb = {
            "denial_risk": scored["denial_risk"],
            "risk_level": scored["risk_level"],
            "decision": scored.get("decision"),
            "predicts": "Approved" if scored["denial_risk"] < 50 else "Denied",
            "model": scored.get("model"),
            "model_auc": scored.get("model_auc"),
        }
    except Exception:  # noqa: BLE001 - model optional
        xgb = None

    # ── Prevention re-score: run the trained model ON the necessity engine's
    # output. This is the sequential pipeline (engine enriches the case, then
    # XGBoost re-scores) rather than the parallel benchmark above. We feed the
    # model the case AS THE ENGINE WOULD SUBMIT IT: the questionnaire completed,
    # the criteria the engine substantiated (MET) added as supportive evidence,
    # and only the gaps it still couldn't close (AT_RISK/UNVERIFIED) left as
    # contradictions. The delta vs. the raw score is the preventable risk.
    xgb_after = None
    xgb_delta = None
    if xgb is not None:
        try:
            met_evidence = [
                (a.get("justification") or a.get("question"))
                for a in review
                if str(a.get("status") or "").upper() == "MET"
                and (a.get("justification") or a.get("question"))
            ]
            open_gaps = [
                (a.get("justification") or a.get("question"))
                for a in review
                if str(a.get("status") or "").upper() in {"AT_RISK", "UNVERIFIED"}
                and (a.get("justification") or a.get("question"))
            ]
            n_q = req.total_questions or len(qs) or 10
            enriched = {
                "medication_class": req.medication_class or "Brand",
                "payer_name": req.payer_name or "",
                "drug": req.drug,
                "total_questions": n_q,
                # the engine answers every question -> a complete questionnaire
                "answered_questions": n_q,
                "supportive_texts": list(req.supportive_texts or []) + met_evidence,
                # only the gaps the engine could NOT close remain as contradictions
                "contradictory_texts": open_gaps,
            }
            scored_after = get_predictor().predict(enriched)
            xgb_after = {
                "denial_risk": scored_after["denial_risk"],
                "risk_level": scored_after["risk_level"],
                "decision": scored_after.get("decision"),
                "predicts": "Approved" if scored_after["denial_risk"] < 50 else "Denied",
                "n_resolved": len(met_evidence),
                "n_open_gaps": len(open_gaps),
            }
            xgb_delta = round(xgb["denial_risk"] - xgb_after["denial_risk"], 1)
        except Exception:  # noqa: BLE001 - model optional
            xgb_after = None
            xgb_delta = None

    return {
        "drug": nec.get("drug"),
        "payer": req.payer_name,
        "reasoning_mode": nec.get("reasoning_mode"),
        "recommended_path": nec.get("recommended_path"),
        "approval_probability": prob,
        "necessity_predicts": nec_predicts,
        "final_prediction": final.get("approval_prediction"),
        "final_confidence": final.get("confidence_score") or scores.get("confidence_score"),
        "scores": scores,
        "reasoning": final.get("clinical_justification"),
        "key_supporting_factors": final.get("key_supporting_factors") or [],
        "key_risks": final.get("key_risks") or [],
        "answers": review,
        "n_questions": len(review),
        "n_comparable": comparable,
        "n_agree": agree,
        "agreement_pct": round(agree / comparable * 100) if comparable else None,
        "actual_outcome": req.actual_outcome,
        "necessity_correct": (nec_predicts == req.actual_outcome) if req.actual_outcome else None,
        "xgb": xgb,
        "xgb_correct": (xgb["predicts"] == req.actual_outcome) if (xgb and req.actual_outcome) else None,
        "xgb_after": xgb_after,
        "xgb_delta": xgb_delta,
    }


@app.get("/api/agents")
def api_agents() -> dict:
    """Config-ready description of the multi-agent orchestration.

    Single source of truth for the Agent Studio UI: what each agent does, how
    it reasons, its inputs/outputs, and whether the LLM reasoner is live.
    """
    from denial_engine.agents.questionnaire import agent_registry

    return agent_registry()


class AnswerRequest(BaseModel):
    drug: str | None = None
    payer_name: str | None = None
    supportive_texts: list[str] | None = None
    contradictory_texts: list[str] | None = None


@app.post("/api/answer")
def api_answer(req: AnswerRequest) -> dict:
    """Multi-agent PA questionnaire answerer.

    Runs a small team of specialist agents (criteria retrieval, evidence
    matching, mechanism justification, clinical guidelines, payer strategy,
    answer composer) and returns a structured 'how to answer + why' packet.
    """
    from denial_engine.agents.questionnaire import answer_questionnaire

    return answer_questionnaire(
        drug=req.drug,
        payer=req.payer_name,
        supportive_texts=req.supportive_texts,
        contradictory_texts=req.contradictory_texts,
    )


class NecessityRequest(BaseModel):
    drug: str | None = None
    payer_name: str | None = None
    supportive_texts: list[str] | None = None
    contradictory_texts: list[str] | None = None
    documents: list[Any] | None = None
    questions: list[dict] | None = None
    engine: str | None = None  # 'graph' routes coverage match through graph_kb


@app.post("/api/necessity")
def api_necessity(req: NecessityRequest) -> dict:
    """Medical Necessity Engine — the staged multi-agent approval pipeline.

    DB1 (patient evidence) + DB2 (drug criteria) + DB3 (historical/model) ->
    Deciding Factor -> Coverage Validator -> [grey-area re-eval] -> Clinical
    Answering -> Final Justification. Returns every stage output + a trace.
    """
    from denial_engine.agents.necessity_engine import run_medical_necessity

    return run_medical_necessity(
        drug=req.drug,
        payer=req.payer_name,
        documents=req.documents,
        supportive_texts=req.supportive_texts,
        contradictory_texts=req.contradictory_texts,
        questions=req.questions,
        engine=(req.engine or "default"),
    )


class GapRecoveryRequest(BaseModel):
    drug: str | None = None
    payer_name: str | None = None
    # Pass the coverage matrix from a prior /api/necessity run (preferred), or a
    # raw criteria list. Either is converted to the gap-recovery input.
    coverage_matrix: list[dict] | None = None
    criteria: list[dict] | None = None


@app.post("/api/gap-recovery")
def api_gap_recovery(req: GapRecoveryRequest) -> dict:
    """Criteria Gap Recovery Framework — standalone, on-demand.

    For each unmet coverage criterion, returns importance, bypassability,
    reviewer intent, clinically-accepted alternative pathways, contraindication/
    safety-based bypass, alternative clinical evidence, and appeal strategy.

    Decoupled from /api/necessity so it runs alone (reliable LLM mode, no
    contention with the 8-stage pipeline's concurrent calls).
    """
    from denial_engine.agents.criteria_gap_recovery import criteria_gap_recovery

    crits = req.criteria
    if not crits and req.coverage_matrix:
        crits = [
            {
                "statement": c.get("requirement"),
                "critical": bool(c.get("critical")),
                "status": "MET" if c.get("present") else "UNVERIFIED",
                "evidence": c.get("supporting_document"),
            }
            for c in req.coverage_matrix
            if c.get("requirement")
        ]
    match = {"criteria": crits or []}
    return criteria_gap_recovery(req.drug, req.payer_name, match, db2={})


class DenialRecoveryRequest(BaseModel):
    drug: str | None = None
    payer_name: str | None = None
    denial_reason: str | None = None
    denial_letter: str | None = None
    supportive_texts: list[str] | None = None
    contradictory_texts: list[str] | None = None
    submitted_answers: list[dict] | None = None


@app.post("/api/denial-recovery")
def api_denial_recovery(req: DenialRecoveryRequest) -> dict:
    """Post-Denial Recovery & Appeal Specialist.

    Given a DENIED PA, determines appeal viability + approval probability,
    identifies the root cause and recovery opportunities, lists required
    supporting documents, assigns a denial-recovery classification, and drafts a
    submission-ready appeal letter. LLM-powered with a deterministic fallback.
    """
    from denial_engine.agents.denial_recovery import denial_recovery

    return denial_recovery(
        drug=req.drug,
        payer=req.payer_name,
        denial_reason=req.denial_reason,
        denial_letter=req.denial_letter,
        supportive_texts=req.supportive_texts,
        contradictory_texts=req.contradictory_texts,
        submitted_answers=req.submitted_answers,
    )


class OutcomeRequest(BaseModel):
    record_id: str
    outcome: str  # "Approved" | "Denied"
    note: str | None = None


@app.post("/api/outcome")
def api_outcome(req: OutcomeRequest) -> dict:
    """Feedback loop: record the real payer outcome for a past prediction.

    These labels are what a periodic retrain learns from, so the model and the
    touchless thresholds track payer-criteria drift over time.
    """
    rid = get_store().log_prediction(
        {
            "event": "outcome",
            "record_id": req.record_id,
            "outcome": req.outcome,
            "note": req.note,
        }
    )
    return {"ok": True, "record_id": rid, "linked_to": req.record_id, "outcome": req.outcome}


@app.post("/api/predict-batch")
def api_predict_batch(req: BatchRequest) -> dict:
    """Score many PA cases at once -> per-case risk + portfolio distribution.

    Shows reviewers how a queue of pending PAs splits across risk bands and how
    many denials could be prevented if high-risk cases are fixed before submit.
    """
    from denial_engine.ml.denial_predictor import get_predictor

    predictor = get_predictor()
    rows: list[dict] = []
    bands = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    routing = {"AUTO_SUBMIT": 0, "REVIEW": 0, "BLOCK": 0}
    for i, c in enumerate(req.cases):
        scored = predictor.predict(c.model_dump())
        bands[scored["risk_level"]] = bands.get(scored["risk_level"], 0) + 1
        decision = scored.get("decision", "REVIEW")
        routing[decision] = routing.get(decision, 0) + 1
        rows.append(
            {
                "case_id": c.case_id or f"case-{i + 1}",
                "medication_class": c.medication_class,
                "payer_name": c.payer_name,
                "denial_risk": scored["denial_risk"],
                "risk_level": scored["risk_level"],
                "decision": decision,
                "top_factor": (scored.get("risk_factors") or [{}])[0].get("factor"),
            }
        )

    n = len(rows) or 1
    avg_risk = round(sum(r["denial_risk"] for r in rows) / n, 1)
    flagged = bands["HIGH"] + bands["MEDIUM"]
    preventable = int(round(flagged * 0.60))
    return {
        "count": len(rows),
        "avg_risk": avg_risk,
        "distribution": bands,
        "routing": routing,
        "touchless_rate": round(routing["AUTO_SUBMIT"] / n * 100, 1),
        "needs_human": routing["REVIEW"] + routing["BLOCK"],
        "flagged": flagged,
        "preventable_denials": preventable,
        "results": sorted(rows, key=lambda r: r["denial_risk"], reverse=True),
    }


def run() -> None:
    """Console entrypoint (`denial-engine`): serve the API with uvicorn.

    Binds 0.0.0.0 and honors $PORT (Cloud Run sets it; defaults to 8080).
    """
    import os

    import uvicorn

    uvicorn.run(
        "denial_engine.api:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8080")),
    )


if __name__ == "__main__":
    run()
