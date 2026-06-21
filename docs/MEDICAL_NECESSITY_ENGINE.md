# Medical Necessity Engine (v2) — Design, Scaling & Results

The v2 reasoning brain for pharmacy prior authorizations. It formalizes the
DB1/DB2/DB3 → Deciding Factor → Coverage Validator → Clinical Answering → Final
Justification design into a real, testable, deployed multi-agent pipeline.

- Code: `necessity_engine.py` (orchestrator + agents)
- API: `POST /api/necessity` (`app.py`)
- Simulation/accuracy: `simulate_necessity.py`
- UI: Agent Studio tab → "Medical Necessity (v2)" pipeline

---

## 1. The pipeline

```
            ┌── DB1 Patient Document Intelligence  (LLM extraction from EMR docs)
 inputs ────┼── DB2 Drug Criteria Intelligence     (KB + FDA/payer/PBM/NCCN)
            └── DB3 Historical Approval Intelligence(trained model, AUC ~0.83)
                          │  (DB1+DB2 run concurrently; DB3 is fast)
                          ▼
            Deciding Factor (Core Brain)   ── Clinical 40% · Coverage 30%
                          │                     History 20% · Docs 10%
                          ▼                     → recommended_path
            Evidence Coverage Validator    (per-requirement coverage matrix)
                          │
              ┌───────────┴───────────────┐
              ▼ (path = HIGH_APPROVAL)     ▼ (REQUIRES_REVIEW / LIKELY_DENIAL)
         (skip re-eval)            Approval-Friendly Re-Evaluation (governed)
              └───────────┬───────────────┘   ‖ runs concurrent w/ answering
                          ▼
            Clinical Answering             (answer questionnaire, pharmacy benefit)
                          ▼
            Final Justification            (APPROVE / PEND / DENY + confidence + next steps)
```

Every stage is **LLM-powered when a key is present, deterministic otherwise**, and
returns its `_mode` so the orchestration is fully inspectable. The orchestrator
parallelizes independent stages (DB1‖DB2, Deciding‖Coverage, Re-Eval‖Answering),
cutting the critical path from ~8 sequential LLM calls to ~4 (~40s on Haiku).

### Stage → prompt mapping (the originals)

| Stage | Source prompt |
| ----- | ------------- |
| DB1 | "Prior Authorization Clinical Evidence Extraction Engine" |
| DB2 | "Pharmacy Benefit Clinical Criteria Engine" |
| DB3 | "Prior Authorization Outcome Prediction Engine" |
| Deciding Factor | "Senior Clinical Prior Authorization Reviewer" (40/30/20/10) |
| Coverage Validator | "Evidence Coverage Validator" (added between Deciding & Answering) |
| Re-Evaluation | "Approval Optimization Agent" (governed — see §4) |
| Final | "Senior Prior Authorization Clinical Decision Engine" |

---

## 2. Storage & retrieval: vector DB vs graph DB

**Recommendation: vector-first, with a lightweight structured criteria graph. Do
NOT stand up a dedicated graph database (Neo4j) for this.**

| Need | Best fit | Why |
| ---- | -------- | --- |
| **DB1** per-case evidence | *None* (transient JSON) | DB1 is per-case extraction, not a cross-case store. Output is structured JSON used in that run, then logged to Firestore for audit/training. |
| **DB2** guidelines/policy corpus (FDA, NCCN, AHFS, DRUGDEX, payer policies) | **Vector DB (RAG)** | Large free-text corpora. Semantic chunk retrieval pulls the requirements relevant to *this* drug+payer+indication. This is the classic RAG case. |
| **DB2** required-evidence checklist + step-therapy edges | **Structured "graph" as JSON in the Criteria KB** | The *relationships* (drug → indication → required labs → step therapy) power the Coverage Validator's matrix and explainability. We already encode these in `criteria_kb_merged.json` — a JSON adjacency is enough; a graph DB adds ops cost without payoff at this scale. |
| **DB3** similar-case retrieval | **Vector DB (case embeddings)** + the trained model | Nearest-neighbor over case embeddings finds "similar_cases"; the XGBoost model gives the calibrated probability. |

**Concrete plan on Firebase (no new infra):** use **Firestore vector search** for
DB2 guideline chunks and DB3 case embeddings (Firestore now supports `FindNearest`
vector queries), keep the structured criteria graph as JSON in the KB doc, and
store every run's stage outputs + justification in a Firestore `necessity_runs`
collection. Those logs are the **training data** for continuous improvement.

> When would a real graph DB pay off? Only if we start doing multi-hop ontology
> reasoning across drugs/indications/policies (e.g., "find all PCSK9 inhibitors a
> payer covers for HeFH with a statin-intolerance pathway"). Until then, JSON +
> vector is the scalable, low-ops choice.

---

## 3. Scaling

- **Model backbone for DB3.** The trained XGBoost+TF-IDF model (AUC ~0.83) is the
  probability backbone — fast, cached, no LLM cost. The LLM stages add reasoning
  and drafted answers on top.
- **Cache DB2 per (drug, payer)** and **DB3 per (drug, payer, evidence-hash).**
  DB2 changes rarely; this removes 2 LLM calls from the hot path.
- **Parallel stages** (already implemented) keep latency ~40s even with full LLM.
- **Two speeds:** deterministic mode is instant and batch-friendly (we scored 300
  cases in ~2s); LLM mode is for the high-value, human-facing draft.
- **Model override:** `NECESSITY_MODEL_SMART=claude-sonnet-4-6` for higher-quality
  reasoning in offline/batch; Haiku by default for interactive latency.
- **Continuous learning:** log every run + the eventual payer outcome (the existing
  `/api/outcome` feedback loop) → periodic retrain so the model + thresholds track
  payer-criteria drift.

---

## 4. Grey-area governance (compliance)

The "answer in an approval-friendly way / follow the grey area" requirement is
implemented as a **compliant optimizer**, not a fabricator. The
Approval-Friendly Re-Evaluation agent's system prompt enforces hard rules:

1. **No invented clinical facts** — it may not assume a lab value, diagnosis, or
   trial/failure that isn't in the evidence.
2. **Reframe, don't fabricate** — it may restate *existing* evidence in
   payer-favorable, medically-accurate language.
3. **Optional vs. required** — it may identify requirements that are genuinely
   optional, satisfiable by substitute evidence, or not applicable, *with rationale*.
4. **True gaps stay gaps** — for real missing documentation it states exactly what
   the provider must supply; it never papers over them.

This keeps optimization audit-defensible and is logged for every run.

---

## 5. Measured results (real historical data)

Run against `data/training_data.parquet` (10,000 labeled PA outcomes; 6k approved
/ 4k denied), reconstructing each case's evidence from its per-question
supportive/contradictory facts.

**Deterministic, model-backed path — 300 balanced cases:**

```
Probability-classifier accuracy : 83.7%   (251/300)
Precision (approve) : 92.4%    Recall (approve) : 73.3%
Avg approval probability — approved: 67.6%  vs  denied: 32.7%   (separation +34.9 pts)
Recommended-path mix : REQUIRES_REVIEW 156 · LIKELY_DENIAL 123 · HIGH_APPROVAL 21
```

**Full agentic LLM path** — verified end-to-end on real cases: all 8 stages
produce grounded outputs (e.g., correctly flagging a missing baseline-BMI
document for a Wegovy continuation), ~40s/case. The LLM path is intentionally
*stricter* than historical human filers (it pends on undocumented criteria),
which is the desired safety behavior; the model backbone provides the calibrated
probability.

> Note on the headline AUC: 0.83 is the model's **held-out test** metric from
> training. The simulation samples from the full set, so its in-run accuracy is a
> sanity check on calibration/separation, not an independent generalization claim.

Reproduce:

```bash
python simulate_necessity.py --n 300            # deterministic, ~2s
python simulate_necessity.py --llm --n 4 --trace # full agentic, staged trace
```

---

## 6. API

`POST /api/necessity`

```jsonc
// request
{ "drug": "Wegovy", "payer_name": "Aetna Commercial",
  "supportive_texts": ["BMI 38.2 …", "completed 6-month diet program …"],
  "contradictory_texts": [], "documents": null, "questions": null }

// response (abridged)
{ "recommended_path": "REQUIRES_REVIEW",
  "scores": { "clinical_match_score": 42, "criteria_coverage_score": 45,
              "historical_match_score": 63, "documentation_score": 48,
              "overall_approval_probability": 56, "confidence_score": 28 },
  "final_prediction": "PEND",
  "db1": {…}, "db2": {…}, "db3": { "model": "xgboost+tfidf", "model_auc": 0.83 },
  "deciding_factor": {…}, "coverage": { "coverage_matrix": [...] },
  "approval_friendly_reeval": {…}, "clinical_answers": { "answers": [...] },
  "final": { "approval_prediction": "PEND", "clinical_justification": "…",
             "key_risks": [...], "recommended_next_steps": [...] },
  "agents": [ {"agent":"DB1 · …","mode":"llm"}, … ] }
```

---

## 7. Roadmap

1. **Real EMR ingestion (DB1):** wire OncoEMR document fetch → DB1 extraction so the
   runner pulls a real case's documents instead of pasted evidence. (See the
   document-type list the team provided.)
2. **Firestore vector search** for DB2 guidelines + DB3 similar-case retrieval.
3. **Per-(drug,payer) caching** of DB2/DB3.
4. **Outcome feedback → retrain** loop for accuracy drift.
5. **Config-driven pipeline:** make stages toggleable/reorderable per tenant
   (the Agent Studio already renders the roster from data).
