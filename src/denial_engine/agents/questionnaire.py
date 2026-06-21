"""Multi-agent PA questionnaire answerer.

Given a drug + payer + the patient's evidence, a small team of specialist
"agents" drafts how to answer the prior-authorization questionnaire and why:

  1. CriteriaRetrievalAgent  - pulls the relevant criteria (FDA + payer + KB)
  2. EvidenceMatchingAgent   - matches patient evidence to each criterion
  3. MechanismAgent          - mechanism-of-action justification
  4. GuidelinesAgent         - clinical-guideline support (KDIGO/NCCN/ADA/...)
  5. PayerStrategyAgent      - payer-specific strategy (step therapy, exceptions)
  6. AnswerComposerAgent     - per-question answer + overall fileability verdict

Deterministic + KB-grounded so it always runs offline. If an LLM key is present
(ANTHROPIC_API_KEY) a narrative synthesis step is added on top; otherwise the
structured, templated reasoning is returned (and is fully demoable).
"""
from __future__ import annotations

import os
from typing import Any

from denial_engine.core import llm
from denial_engine.knowledge.criteria_kb import get_drug, match_case

# --------------------------------------------------------------------------- #
# Curated domain knowledge (mechanism of action + governing guidelines).
# Sourced from FDA labels + the guideline sections of payer coverage policies.
# --------------------------------------------------------------------------- #
MECHANISM: dict[str, str] = {
    "Ozempic": "Semaglutide is a GLP-1 receptor agonist: it augments glucose-dependent insulin secretion, suppresses glucagon, and slows gastric emptying — directly lowering HbA1c in type 2 diabetes.",
    "Mounjaro": "Tirzepatide is a dual GIP/GLP-1 receptor agonist, improving insulin secretion and sensitivity and slowing gastric emptying for glycemic control in type 2 diabetes.",
    "Wegovy": "Semaglutide (GLP-1 receptor agonist) reduces appetite and energy intake via central and gastric pathways, producing clinically meaningful weight loss with diet and exercise.",
    "Zepbound": "Tirzepatide (dual GIP/GLP-1 agonist) reduces appetite and food intake, producing weight loss when combined with reduced-calorie diet and increased activity.",
    "Repatha": "Evolocumab is a PCSK9 inhibitor: by blocking PCSK9 it increases hepatic LDL-receptor recycling, sharply lowering LDL-C beyond maximally tolerated statins.",
    "Prolia": "Denosumab is a RANK-ligand inhibitor that blocks osteoclast formation/function, increasing bone mineral density and reducing fracture risk.",
    "Xgeva": "Denosumab (RANKL inhibitor) suppresses osteoclast-mediated bone resorption, preventing skeletal-related events in metastatic bone disease and giant cell tumor.",
    "Injectafer": "Ferric carboxymaltose is a parenteral iron replacement that repletes iron stores and supports erythropoiesis when oral iron fails or is not absorbed.",
    "Venofer": "Iron sucrose is an IV iron replacement that delivers elemental iron to the reticuloendothelial system for hemoglobin synthesis in iron-deficiency anemia.",
    "Aranesp": "Darbepoetin alfa is an erythropoiesis-stimulating agent that binds the erythropoietin receptor to stimulate red-cell production in anemia of CKD or chemotherapy.",
    "Lupron": "Leuprolide is a GnRH agonist that, after initial flare, downregulates pituitary GnRH receptors to suppress gonadal steroidogenesis (used in endometriosis, fibroids, prostate cancer, CPP).",
    "Gemtesa": "Vibegron is a beta-3 adrenergic agonist that relaxes the detrusor during bladder filling, reducing urgency, frequency, and urge incontinence.",
    "Akynzeo": "Netupitant (NK1 antagonist) + palonosetron (5-HT3 antagonist) block the two principal emetic pathways for acute and delayed chemotherapy-induced nausea/vomiting.",
    "Udenyca": "Pegfilgrastim (pegylated G-CSF) stimulates neutrophil production, reducing febrile neutropenia risk in myelosuppressive chemotherapy.",
}

GUIDELINES: dict[str, list[str]] = {
    "Injectafer": ["KDIGO 2025 Anemia in CKD — IV iron when oral iron fails/insufficient (TSAT/ferritin thresholds)", "ACC/AHA/HFSA 2022 Heart Failure — IV iron reasonable in HFrEF with iron deficiency", "NCCN Hematopoietic Growth Factors — IV iron for cancer-related iron deficiency"],
    "Venofer": ["KDIGO 2025 Anemia in CKD — IV iron repletion based on TSAT/ferritin", "NCCN Hematopoietic Growth Factors — IV iron in chemotherapy-related anemia"],
    "Aranesp": ["KDIGO Anemia in CKD — ESA when Hb below target with iron replete", "NCCN Hematopoietic Growth Factors — ESA in chemo-induced anemia (non-curative intent)"],
    "Prolia": ["Endocrine Society / AACE osteoporosis — anti-resorptive for high fracture risk; bisphosphonate typically first-line", "ACR glucocorticoid-induced osteoporosis guidance"],
    "Xgeva": ["NCCN bone health / supportive care — bone-modifying agents to prevent skeletal-related events in bone metastases and multiple myeloma"],
    "Repatha": ["ACC/AHA 2018 & 2022 Cholesterol — add PCSK9 inhibitor when LDL-C remains high on maximally tolerated statin in ASCVD or FH"],
    "Ozempic": ["ADA Standards of Care — GLP-1 RA preferred with ASCVD/CKD; metformin commonly first-line", "AACE type 2 diabetes algorithm (comorbidity-centric)"],
    "Mounjaro": ["ADA Standards of Care — incretin therapy for type 2 diabetes with weight/CV considerations"],
    "Wegovy": ["AACE/TOS obesity guidelines — pharmacotherapy with lifestyle for BMI \u2265 30 or \u2265 27 with comorbidity", "AHA — semaglutide reduces MACE in established CVD with overweight/obesity"],
    "Zepbound": ["AACE/TOS obesity guidelines — pharmacotherapy adjunct to lifestyle", "AASM/obesity — tirzepatide for moderate-severe OSA in obesity"],
    "Lupron": ["ASRM endometriosis guidance — GnRH agonist after/with first-line hormonal therapy", "AUA/NCCN prostate cancer — androgen-deprivation therapy"],
    "Gemtesa": ["AUA/SUFU Overactive Bladder guideline — antimuscarinics/beta-3 agonists after behavioral therapy"],
    "Akynzeo": ["NCCN Antiemesis & ASCO — NK1 + 5-HT3 + dexamethasone for highly/moderately emetogenic chemo"],
    "Udenyca": ["NCCN/ASCO Myeloid Growth Factors — prophylactic G-CSF when febrile-neutropenia risk \u2265 20%"],
}


# --------------------------------------------------------------------------- #
# Agents
# --------------------------------------------------------------------------- #
def _norm(drug: str | None) -> str | None:
    if not drug:
        return None
    return drug.strip().title()


def _norm_status(s: str | None) -> str | None:
    """Map free-form LLM status labels onto MET / AT_RISK / UNVERIFIED."""
    if not s:
        return s
    u = s.strip().upper()
    if u == "MET" or u == "SUPPORTED":
        return "MET"
    if any(k in u for k in ("RISK", "CONTRAD", "NOT MET", "NOT_MET", "FAIL", "VIOLAT", "EXCLU")):
        return "AT_RISK"
    if any(k in u for k in ("UNVER", "SILENT", "MISSING", "UNKNOWN", "INSUFFIC", "NEEDS")):
        return "UNVERIFIED"
    return u


class CriteriaRetrievalAgent:
    name = "Criteria Retrieval"
    role = "Pulls the FDA + payer criteria that this PA must satisfy."

    def run(self, drug: str | None) -> dict[str, Any] | None:
        return get_drug(drug) if drug else None


class EvidenceMatchingAgent:
    name = "Evidence Matching"
    role = "Maps the patient's chart evidence to each criterion (met / missing / contradicted)."

    def run(self, drug, supportive, contradictory) -> dict[str, Any] | None:
        try:
            return match_case(drug, supportive, contradictory)
        except Exception:  # noqa: BLE001
            return None


class MechanismAgent:
    name = "Mechanism Justification"
    role = "Explains why the drug is pharmacologically appropriate for the indication."

    def run(self, drug: str) -> str:
        return MECHANISM.get(drug, f"{drug}: mechanism-based rationale should be documented for the requested indication.")


class GuidelinesAgent:
    name = "Clinical Guidelines"
    role = "Cites the clinical guidelines that support medical necessity."

    def run(self, drug: str) -> list[str]:
        return GUIDELINES.get(drug, [])


class PayerStrategyAgent:
    name = "Payer Strategy"
    role = "Applies the specific payer's coverage rules and the winning filing strategy."

    def run(self, kb: dict | None, payer: str | None) -> dict[str, Any]:
        if not kb:
            return {"payer": payer, "matched_policy": None, "strategy": []}
        policies = kb.get("payer_policies", {}) or {}
        # Match payer name loosely (e.g., "Cigna Commercial" -> "Cigna").
        chosen_name, chosen = None, None
        for pname, pdata in policies.items():
            if payer and pname.lower() in payer.lower():
                chosen_name, chosen = pname, pdata
                break
        if chosen is None and policies:
            chosen_name, chosen = next(iter(policies.items()))
        self.payer_key = chosen_name
        strategy: list[str] = []
        if chosen:
            if chosen.get("step_therapy"):
                strategy.append(f"Document the payer prerequisite: {chosen['step_therapy']} — or file a step-therapy exception with rationale.")
            inds = chosen.get("covered_indications") or []
            if inds:
                strategy.append(f"State the request under a covered indication: {inds[0]}.")
            if chosen.get("not_covered"):
                strategy.append(f"Avoid non-covered framing: {chosen['not_covered']}")
        return {
            "payer": payer or chosen_name,
            "payer_key": chosen_name,
            "matched_policy": (f"{chosen_name} {chosen.get('policy_number','')}".strip() if chosen else None),
            "source_url": (chosen or {}).get("source_url"),
            "strategy": strategy,
        }


class AnswerComposerAgent:
    name = "Answer Composer"
    role = "Drafts the recommended answer for each questionnaire item and the overall verdict."

    @staticmethod
    def _answer_for(status: str) -> str:
        return {
            "MET": "Yes — supported by the chart; cite the evidence.",
            "AT_RISK": "Currently No / contradicted — resolve or add documentation before filing.",
            "UNVERIFIED": "Needs documentation — the chart does not yet establish this.",
        }.get(status, "Needs review.")

    def run(self, match: dict | None, mechanism: str, guidelines: list[str], payer_strategy: dict) -> dict[str, Any]:
        questions: list[dict[str, Any]] = []
        if match:
            for c in match.get("criteria", []):
                src = c.get("source")
                justification = mechanism if src in ("fda_label", "historical") else None
                if guidelines and src in ("fda_label", "historical"):
                    justification = (justification or "") + " Guideline: " + guidelines[0]
                payer_note = None
                if src == "payer_policy" and payer_strategy.get("strategy"):
                    payer_note = payer_strategy["strategy"][0]
                questions.append({
                    "question": c.get("statement"),
                    "source": src,
                    "critical": c.get("critical", False),
                    "status": c.get("status"),
                    "recommended_answer": self._answer_for(c.get("status", "")),
                    "justification": justification,
                    "payer_strategy": payer_note,
                    "evidence": c.get("evidence") or None,
                })
        readiness = (match or {}).get("readiness_pct", 0)
        critical_unmet = (match or {}).get("critical_unmet", 0)
        if critical_unmet == 0 and readiness >= 80:
            verdict = "AUTO_FILE"
        elif critical_unmet >= 1 and readiness < 40:
            verdict = "BLOCK"
        else:
            verdict = "REVIEW"
        return {"questions": questions, "readiness_pct": readiness,
                "critical_unmet": critical_unmet, "verdict": verdict}


class LLMReasoner:
    """Generative clinical reasoner. Reads the chart evidence against every
    criterion *by meaning* (not keyword overlap), drafts the recommended answer
    with a citation, and writes a one-paragraph reviewer summary. Grounded in
    the KB context passed in (criteria + mechanism + guidelines + payer policy),
    so it cites our sources rather than free-associating. Returns None on any
    failure so the caller falls back to the deterministic composer.
    """

    name = "LLM Clinical Reasoner"
    role = "Reads the chart against each criterion by meaning and drafts cited answers."
    # Haiku 4.5 is fast + cheap for per-case reasoning; override for higher quality.
    MODEL = os.environ.get("ANTHROPIC_REASONER_MODEL", "claude-haiku-4-5-20251001")

    _SYSTEM = (
        "You are a senior pharmacy prior-authorization reviewer. You decide, for each "
        "coverage criterion, whether the patient's chart evidence MEETS it, CONTRADICTS "
        "it (AT_RISK), or is silent (UNVERIFIED). Be strict and payer-minded: only mark "
        "MET when the evidence clearly supports it. Ground every judgment in the provided "
        "criteria, mechanism, guidelines, and payer policy. Never invent clinical facts "
        "that are not in the evidence."
    )

    def run(
        self,
        drug: str,
        payer: str | None,
        criteria: list[dict[str, Any]],
        mechanism: str,
        guidelines: list[str],
        payer_strategy: dict[str, Any],
        supportive: list[str] | None,
        contradictory: list[str] | None,
    ) -> dict[str, Any] | None:
        if not criteria or not llm.available():
            return None
        crit_lines = "\n".join(
            f'{i}. [{c.get("source","")}{"/critical" if c.get("critical") else ""}] {c.get("statement")}'
            for i, c in enumerate(criteria)
        )
        sup = "\n".join(f"- {t}" for t in (supportive or [])) or "(none provided)"
        con = "\n".join(f"- {t}" for t in (contradictory or [])) or "(none provided)"
        guide = "; ".join(guidelines) or "(none)"
        strat = "; ".join(payer_strategy.get("strategy") or []) or "(none)"
        user = (
            f"DRUG: {drug}\nPAYER: {payer or 'unspecified'}\n"
            f"MECHANISM: {mechanism}\nGUIDELINES: {guide}\n"
            f"PAYER POLICY ({payer_strategy.get('matched_policy') or 'n/a'}): {strat}\n\n"
            f"COVERAGE CRITERIA (answer each by index):\n{crit_lines}\n\n"
            f"SUPPORTIVE CHART EVIDENCE:\n{sup}\n\n"
            f"CONTRADICTORY / MISSING EVIDENCE:\n{con}\n\n"
            "Return JSON of the form:\n"
            '{"verdict":"AUTO_FILE|REVIEW|BLOCK","readiness_pct":0-100,'
            '"summary":"<=60 word reviewer note",'
            '"questions":[{"index":int,"status":"MET|AT_RISK|UNVERIFIED",'
            '"recommended_answer":"how to answer this item","justification":"clinical+payer reason",'
            '"citation":"the supporting evidence line, or \'no chart evidence\'"}]}'
        )
        out = llm.complete_json(self._SYSTEM, user, max_tokens=2048, model=self.MODEL)
        if not isinstance(out, dict) or not isinstance(out.get("questions"), list):
            return None
        return out


# --------------------------------------------------------------------------- #
# Orchestrator
# --------------------------------------------------------------------------- #
def answer_questionnaire(
    drug: str | None,
    payer: str | None = None,
    supportive_texts: list[str] | None = None,
    contradictory_texts: list[str] | None = None,
) -> dict[str, Any]:
    """Run the agent team and return a structured PA answer packet.

    Uses the LLM clinical reasoner when a key is configured; otherwise falls
    back to the deterministic composer. Mechanism / guidelines / payer strategy
    are always the factual KB-grounded outputs.
    """
    drug = _norm(drug)
    crit_agent = CriteriaRetrievalAgent()
    ev_agent = EvidenceMatchingAgent()
    mech_agent = MechanismAgent()
    guide_agent = GuidelinesAgent()
    payer_agent = PayerStrategyAgent()
    composer = AnswerComposerAgent()
    reasoner = LLMReasoner()

    kb = crit_agent.run(drug)
    match = ev_agent.run(drug, supportive_texts, contradictory_texts)
    mechanism = mech_agent.run(drug or "")
    guidelines = guide_agent.run(drug or "")
    payer_strategy = payer_agent.run(kb, payer)
    composed = composer.run(match, mechanism, guidelines, payer_strategy)

    # Keep FDA/historical criteria + only the matched payer's policy criteria
    # (don't answer Aetna/UHC rules for a Cigna case — faster and correct).
    payer_key = payer_strategy.get("payer_key")
    if match and payer_key:
        kb_payer = {c["statement"]: c.get("payer") for c in (kb or {}).get("criteria", [])}
        kept = [
            c for c in match.get("criteria", [])
            if c.get("source") != "payer_policy" or kb_payer.get(c["statement"]) == payer_key
        ]
        if kept:
            met = sum(1 for c in kept if c["status"] == "MET")
            at_risk = sum(1 for c in kept if c["status"] == "AT_RISK")
            match["criteria"] = kept
            match["met"] = met
            match["at_risk"] = at_risk
            match["unverified"] = len(kept) - met - at_risk
            match["total"] = len(kept)
            match["readiness_pct"] = round(met / (len(kept) or 1) * 100)
            match["critical_unmet"] = sum(1 for c in kept if c["critical"] and c["status"] != "MET")
            composed = composer.run(match, mechanism, guidelines, payer_strategy)

    reasoning_mode = "deterministic"
    summary = None
    criteria = (match or {}).get("criteria", [])
    llm_out = reasoner.run(
        drug or "", payer, criteria, mechanism, guidelines, payer_strategy,
        supportive_texts, contradictory_texts,
    )
    if llm_out:
        reasoning_mode = "llm"
        summary = llm_out.get("summary")
        by_index = {q.get("index"): q for q in llm_out["questions"] if isinstance(q, dict)}
        det_questions = composed["questions"]
        questions = []
        for i, c in enumerate(criteria):
            q = by_index.get(i, {})
            det_status = det_questions[i].get("status") if i < len(det_questions) else None
            status = _norm_status(q.get("status")) or det_status
            questions.append({
                "question": c.get("statement"),
                "source": c.get("source"),
                "critical": c.get("critical", False),
                "status": status,
                "recommended_answer": q.get("recommended_answer") or AnswerComposerAgent._answer_for(status or ""),
                "justification": q.get("justification"),
                "payer_strategy": (payer_strategy.get("strategy") or [None])[0] if c.get("source") == "payer_policy" else None,
                "evidence": q.get("citation"),
            })
        met = sum(1 for q in questions if q["status"] == "MET")
        readiness = llm_out.get("readiness_pct")
        if not isinstance(readiness, (int, float)):
            readiness = round(met / (len(questions) or 1) * 100)
        critical_unmet = sum(1 for q in questions if q["critical"] and q["status"] != "MET")
        verdict = llm_out.get("verdict") or composed["verdict"]
    else:
        questions = composed["questions"]
        readiness = composed["readiness_pct"]
        critical_unmet = composed["critical_unmet"]
        verdict = composed["verdict"]

    agents_trace = [
        {"agent": a.name, "role": a.role}
        for a in (crit_agent, ev_agent, reasoner, mech_agent, guide_agent, payer_agent, composer)
    ]

    return {
        "drug": drug,
        "payer": payer,
        "in_kb": kb is not None,
        "reasoning_mode": reasoning_mode,
        "summary": summary,
        "mechanism": mechanism,
        "guidelines": guidelines,
        "payer_strategy": payer_strategy,
        "verdict": verdict,
        "readiness_pct": readiness,
        "critical_unmet": critical_unmet,
        "questions": questions,
        "agents": agents_trace,
    }


# --------------------------------------------------------------------------- #
# Agent registry (config-ready metadata for the Agent Studio UI)
#
# This is the single source of truth describing *what each agent does and how*.
# It's served verbatim at GET /api/agents so the dashboard renders the live
# orchestration from data rather than hardcoded copy — and so the team can make
# the pipeline configurable in the future (toggle/reorder/swap agents) without
# touching the UI.
# --------------------------------------------------------------------------- #
AGENT_REGISTRY: list[dict[str, Any]] = [
    {
        "id": "criteria_retrieval",
        "name": CriteriaRetrievalAgent.name,
        "role": CriteriaRetrievalAgent.role,
        "order": 1,
        "method": "Knowledge Base lookup",
        "tech": "Criteria KB (mined history + FDA + payer policies)",
        "inputs": ["drug"],
        "outputs": ["criteria checklist", "payer_policies", "approval_rate"],
        "optional": False,
        "reasoning": (
            "Normalizes the drug name and pulls the full criteria checklist this PA "
            "must satisfy — every criterion tagged by source (FDA label, historical "
            "win/loss pattern, or payer medical policy) and whether it is critical."
        ),
    },
    {
        "id": "evidence_matching",
        "name": EvidenceMatchingAgent.name,
        "role": EvidenceMatchingAgent.role,
        "order": 2,
        "method": "Heuristic NLP (content-word overlap)",
        "tech": "Transparent keyword matcher (no black box)",
        "inputs": ["criteria checklist", "supportive evidence", "contradictory evidence"],
        "outputs": ["per-criterion status: MET / AT_RISK / UNVERIFIED", "readiness %"],
        "optional": False,
        "reasoning": (
            "Lines the patient's chart evidence up against each criterion using shared "
            "content words. Contradiction beats support; silence is UNVERIFIED. Fully "
            "explainable — every status shows the evidence line that drove it."
        ),
    },
    {
        "id": "llm_reasoner",
        "name": LLMReasoner.name,
        "role": LLMReasoner.role,
        "order": 3,
        "method": "LLM semantic reasoning",
        "tech": f"Anthropic Claude ({LLMReasoner.MODEL})",
        "inputs": ["criteria", "mechanism", "guidelines", "payer policy", "chart evidence"],
        "outputs": ["semantic status per criterion", "drafted answer", "citation", "reviewer summary"],
        "optional": True,
        "reasoning": (
            "When an API key is configured, re-reads the chart against each criterion "
            "by meaning (not keywords), drafts the recommended answer with a citation, "
            "and writes a reviewer summary — grounded in the KB context so it cites our "
            "sources. Degrades gracefully to the deterministic composer if unavailable."
        ),
    },
    {
        "id": "mechanism",
        "name": MechanismAgent.name,
        "role": MechanismAgent.role,
        "order": 4,
        "method": "Curated pharmacology",
        "tech": "FDA label–sourced mechanism of action",
        "inputs": ["drug"],
        "outputs": ["mechanism-of-action justification"],
        "optional": False,
        "reasoning": (
            "Supplies the mechanism-of-action rationale that explains why the drug is "
            "pharmacologically appropriate for the requested indication."
        ),
    },
    {
        "id": "guidelines",
        "name": GuidelinesAgent.name,
        "role": GuidelinesAgent.role,
        "order": 5,
        "method": "Curated guidelines",
        "tech": "KDIGO / NCCN / ADA / ACC-AHA / AACE-TOS …",
        "inputs": ["drug"],
        "outputs": ["supporting clinical guidelines"],
        "optional": False,
        "reasoning": (
            "Cites the governing clinical guidelines that back medical necessity for "
            "the indication, strengthening the justification beyond the payer's own rules."
        ),
    },
    {
        "id": "payer_strategy",
        "name": PayerStrategyAgent.name,
        "role": PayerStrategyAgent.role,
        "order": 6,
        "method": "Rule application",
        "tech": "Payer medical-policy KB (Cigna / Aetna / UHC …)",
        "inputs": ["payer_policies", "payer name"],
        "outputs": ["matched policy", "step-therapy / exception strategy", "covered-indication framing"],
        "optional": False,
        "reasoning": (
            "Matches the case's payer to its specific medical policy and produces the "
            "winning filing strategy: satisfy prerequisites (or file a step-therapy "
            "exception), frame under a covered indication, and avoid non-covered language."
        ),
    },
    {
        "id": "answer_composer",
        "name": AnswerComposerAgent.name,
        "role": AnswerComposerAgent.role,
        "order": 7,
        "method": "Composition + decision rules",
        "tech": "Readiness + critical-gap thresholds",
        "inputs": ["matched criteria", "mechanism", "guidelines", "payer strategy"],
        "outputs": ["per-question recommended answer", "overall verdict: AUTO_FILE / REVIEW / BLOCK"],
        "optional": False,
        "reasoning": (
            "Assembles the per-question answer-and-why packet and rolls everything into "
            "one fileability verdict: AUTO_FILE when ready, BLOCK when a critical "
            "criterion is unmet and readiness is low, REVIEW otherwise."
        ),
    },
]


def agent_registry() -> dict[str, Any]:
    """Config-ready description of the orchestration (served at /api/agents)."""
    return {
        "pipeline": "answer_questionnaire",
        "llm_available": bool(llm.available()),
        "llm_model": LLMReasoner.MODEL,
        "count": len(AGENT_REGISTRY),
        "agents": sorted(AGENT_REGISTRY, key=lambda a: a["order"]),
    }
