# Denial Prevention Engine — Agent Architecture

This document describes the reasoning layer that sits on top of the RISA
pharmacy worklist: how a prior-authorization (PA) case flows from raw data to a
filed answer, the multi-agent orchestration that drafts the questionnaire, and
how the **Agent Studio** tab visualizes and exercises it live.

It is the source-of-truth companion to:

- `agents.py` — the orchestrator + the agent registry (`AGENT_REGISTRY`)
- `criteria_kb.py` — the Criteria KB + evidence↔criteria matcher
- `app.py` — the FastAPI surface (`/api/agents`, `/api/answer`, `/api/predict`, …)
- `pharmacy-app/src/pages/agentStudio/agentStudio.tsx` — the Agent Studio UI

---

## 1. Why this exists

Historically ~40% of pharmacy PAs are denied on the first pass, mostly for
**addressable** reasons (a missing criterion, an unmet step-therapy
prerequisite, wrong indication framing). The engine's job is to **catch those
before filing**:

1. **Predict** denial risk for every case in the worklist (XGBoost + TF-IDF).
2. **Explain** the risk against the drug's coverage criteria.
3. **Draft** how to answer each questionnaire item and *why* — with citations —
   so a filer (or an automated send-to-plan) can file a winning PA.

Everything runs on **precomputed, de-identified** data baked into the serving
container. The hosted service never touches live PHI or the production BigQuery
project.

---

## 2. Architecture (5 layers)

```
┌───────────────────────────────────────────────────────────────────────┐
│ 1 · DATA SOURCES                                                        │
│    Historical PAs (win/loss)   FDA labels (indications, MoA)            │
│    Payer medical policies (Cigna · Aetna · UHC)                         │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 2 · KNOWLEDGE & MODEL                                                   │
│    Criteria KB (criteria_kb_merged.json) — per-drug criteria, tagged    │
│      by source + critical flag + payer_policies                         │
│    Denial-risk model — XGBoost + TF-IDF over evidence (AUC ~0.83)       │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 3 · MULTI-AGENT ORCHESTRATOR  (agents.answer_questionnaire)             │
│    7 specialist agents, criteria → evidence → reasoning → answer        │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 4 · DECISIONS                                                           │
│    Denial risk + routing: AUTO_FILE / REVIEW / BLOCK                    │
│    Drafted answers: per-question answer + justification + citation      │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 5 · PHARMACY WORKFLOW (the existing app)                                │
│    Worklist / Requests  →  Questionnaire  →  Send to Plan / SFTP        │
│    (risk-ranked queue)     (pre-drafted)      (touchless filing)        │
└───────────────────────────────────────────────────────────────────────┘
```

### Where the agents plug into the current flow

| Pharmacy step (existing)        | Engine contribution                                   |
| ------------------------------- | ----------------------------------------------------- |
| **Worklist / Requests** tab     | `/api/predict` → denial risk %, decision, payer column, risk-ranked sort |
| Row drill-in (RISA AI Review)   | `/api/answer` → full agent reasoning + drafted answers |
| **Questionnaire** screen        | Pre-drafted answers + per-item justification/citation |
| **Send to Plan / SFTP** delivery| Verdict gates touchless filing (AUTO_FILE) vs. human review |

---

## 3. The agent team

The orchestration runs in `agents.answer_questionnaire()`. Order matters and is
reflected verbatim in `AGENT_REGISTRY` (served at `GET /api/agents`).

| # | Agent                  | Method                         | Reads → Produces |
| - | ---------------------- | ------------------------------ | ---------------- |
| 1 | **Criteria Retrieval** | Knowledge Base lookup          | drug → criteria checklist (FDA + historical + payer), payer policies, approval rate |
| 2 | **Evidence Matching**  | Heuristic NLP (word overlap)   | criteria + chart evidence → per-criterion `MET / AT_RISK / UNVERIFIED`, readiness % |
| 3 | **LLM Clinical Reasoner** *(optional)* | Claude (`claude-haiku-4-5`) | criteria + KB context + evidence → semantic status, drafted answer, citation, reviewer summary |
| 4 | **Mechanism Justification** | Curated pharmacology (FDA) | drug → mechanism-of-action rationale |
| 5 | **Clinical Guidelines** | Curated guidelines (KDIGO/NCCN/ADA/…) | drug → supporting guidelines |
| 6 | **Payer Strategy**     | Rule application               | payer policy → matched policy, step-therapy/exception strategy, covered-indication framing |
| 7 | **Answer Composer**    | Composition + decision rules   | all of the above → per-question answer + verdict `AUTO_FILE / REVIEW / BLOCK` |

### Reasoning modes & graceful degradation

- **With an Anthropic key** (`ANTHROPIC_API_KEY` via Secret Manager): the LLM
  reasoner re-reads the chart *by meaning*, drafts cited answers, and writes a
  reviewer summary — grounded in the KB context so it cites our sources.
  `reasoning_mode = "llm"`.
- **Without a key**: the deterministic Answer Composer produces the same packet
  shape from the heuristic matcher. `reasoning_mode = "deterministic"`. The UI
  shows a *Rule-based* badge. **The product is fully demoable offline.**

### Decision rule (Answer Composer verdict)

```
critical_unmet == 0 AND readiness >= 80   → AUTO_FILE
critical_unmet >= 1 AND readiness < 40     → BLOCK
otherwise                                  → REVIEW
```

---

## 4. API surface (consumed by the dashboard)

| Endpoint                | Purpose |
| ----------------------- | ------- |
| `GET  /api/agents`      | Config-ready agent registry + `llm_available` + model. Drives Agent Studio. |
| `POST /api/predict`     | XGBoost denial risk + routing decision + criteria match. |
| `POST /api/answer`      | Full multi-agent orchestration → drafted answers packet. |
| `GET  /api/criteria`    | Per-drug KB index (criteria counts, approval rate, n_cases). |
| `GET  /api/criteria/{drug}` | Full criteria checklist for one drug. |
| `GET  /api/filing-queue`| Synthetic-identity PA worklist (real evidence). |
| `GET  /api/triage`      | Addressable-denial split. |
| `GET  /api/impact`      | ROI / business case. |

`/api/agents` response shape:

```json
{
  "pipeline": "answer_questionnaire",
  "llm_available": true,
  "llm_model": "claude-haiku-4-5-20251001",
  "count": 7,
  "agents": [
    { "id": "criteria_retrieval", "name": "Criteria Retrieval", "order": 1,
      "method": "Knowledge Base lookup", "tech": "...",
      "inputs": ["drug"], "outputs": ["criteria checklist", "..."],
      "optional": false, "reasoning": "..." }
  ]
}
```

---

## 5. The Agent Studio tab

`Agents` tab in the pharmacy nav (`pharma-agent-studio`). Three things:

1. **Architecture map** — the 5 layers above, rendered live (drug/criteria/case
   counts pulled from `/api/criteria`).
2. **Live orchestration runner** — pick a drug + payer + paste chart evidence
   (or use a preset), hit **Run**. The 7 agents animate firing in sequence, each
   showing its real output, ending in the verdict + risk + drafted answers.
   Calls `/api/predict` and `/api/answer` in parallel.
3. **Agent roster** — one card per agent (role, method, inputs/outputs, tech),
   rendered from `/api/agents`. Falls back to a static mirror
   (`AGENT_REGISTRY_FALLBACK` in `denialEngine.ts`) if the endpoint is
   unavailable, so the tab always renders.

---

## 6. Configurability roadmap

Because the roster is **data-driven from `/api/agents`**, the pipeline can become
configurable without UI changes:

- Toggle the optional LLM reasoner on/off per client/payer.
- Reorder or disable agents (e.g., skip guidelines for a payer that ignores them).
- Swap the payer-strategy source (different policy KB per client).
- Add new agents (e.g., a Prior-Therapy/step-edit agent, an Appeals-letter agent)
  by appending to `AGENT_REGISTRY` and wiring them into `answer_questionnaire`.

The natural next step is to make `AGENT_REGISTRY` itself loadable from
Firestore/config so it's editable per tenant.

---

## 7. Running locally

```bash
# engine (FastAPI) — from repo root
uvicorn app:app --reload --port 8080
# with LLM reasoning, set the key (or use .env.engine.local):
export ANTHROPIC_API_KEY=sk-ant-...
export ANTHROPIC_REASONER_MODEL=claude-haiku-4-5-20251001

# frontend — from pharmacy-app/
npm start            # uses .env.local (REACT_APP_ENGINE_API=http://localhost:3009/engine via proxy)
```

Production: the engine is Cloud Run `risa-denial-api` (Anthropic key from Secret
Manager); the dashboard is the Firebase Hosting `pharmacy-hackathon-demo` site,
which proxies `/api/engine/**` → the engine.
