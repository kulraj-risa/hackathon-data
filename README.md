# RISA Denial Prevention Engine

A multi-agent system that predicts pharmacy **Prior-Authorization (PA) denials
before submission**, explains *why*, and tells you **how to still get approved**
when the chart doesn't yet meet a payer's criteria. The goal: lift first-pass
approval from ~60% toward ~95%.

> Python **FastAPI** engine (LLM agents + XGBoost) · React demo SPA · Cloud Run + Firebase Hosting

---

## 🔗 Live demo & links

| | Link |
|---|---|
| 🖥️ **Live demo (pharmacy Agent Studio)** | https://pharmacy-hackathon-demo.web.app |
| ⚙️ **Live API (FastAPI on Cloud Run)** | https://risa-denial-api-scnxtg3pqa-uc.a.run.app |
| 📘 **Interactive API docs (Swagger)** | https://risa-denial-api-scnxtg3pqa-uc.a.run.app/docs |
| 📗 **API reference (ReDoc)** | https://risa-denial-api-scnxtg3pqa-uc.a.run.app/redoc |
| 📄 **OpenAPI spec (JSON)** | https://risa-denial-api-scnxtg3pqa-uc.a.run.app/openapi.json |
| 💻 **Source** | https://github.com/kulraj-risa/hackathon-data |

**Try it in 30 seconds:** open the demo → **Agent Studio** tab → hit **Send** on any
endpoint in the *Endpoint Validation Console* to call the live API, or run the
*Live orchestration runner* to watch the agents reason on a real case end-to-end.
Or hit the API directly:

```bash
# the live service index + endpoint list
curl https://risa-denial-api-scnxtg3pqa-uc.a.run.app/

# score a real PA's denial risk (trained XGBoost, AUC ~0.83)
curl -s -X POST https://risa-denial-api-scnxtg3pqa-uc.a.run.app/api/predict \
  -H 'Content-Type: application/json' \
  -d '{"drug":"Wegovy","payer_name":"Aetna Commercial","medication_class":"Brand",
       "supportive_texts":["BMI 38.2 documented.","6-month supervised diet program, inadequate weight loss."],
       "contradictory_texts":[]}'
```

### At a glance

| | |
|---|---|
| **Drugs in Criteria KB** | 22 |
| **Mined coverage criteria** | ~199 |
| **Historical PAs (training)** | ~10,000 labeled cases |
| **Denial-risk model** | XGBoost + TF-IDF · ROC-AUC ~0.83 |
| **Clinical knowledge graph** | 265 nodes / 281 edges (Drug→Criterion→CoveragePolicy→Payer) |
| **Multi-agent pipeline** | 9-stage Medical Necessity Engine (LLM + model) |
| **Closed-loop validation** | AI decisions graded vs. clinician ground truth (agreement + κ) |

---

## What's in here

This repo contains two deliverables:

1. **The engine** (`src/denial_engine/`) — an installable Python package that
   serves a JSON API. It combines a trained model with an LLM-powered,
   multi-agent reasoning pipeline.
2. **The demo** (`frontend/pharmacy-app/`) — a React "Agent Studio" that runs the
   engine live and visualizes the agents reasoning end-to-end.

### How the engine reasons

The **Medical Necessity Engine** is a staged, multi-agent pipeline. Every stage
is LLM-powered when an API key is present and falls back to a deterministic,
KB-grounded path otherwise, so it always runs (even offline).

```
        ┌── DB1  Patient evidence      (LLM extraction from EMR docs)
inputs ─┼── DB2  Drug criteria         (criteria KB + FDA/payer/PBM/NCCN)
        └── DB3  Historical outcomes   (trained XGBoost, AUC ~0.83)
                      │
                      ▼
        Deciding Factor (Core Brain)   weighted score → recommended path
                      ▼
        Evidence Coverage Validator    per-requirement coverage matrix
                      │
        ┌─────────────┼───────────────────────────┐
        ▼             ▼                            ▼
  Approval-Friendly   Criteria Gap Recovery        Clinical Answering
  Re-Evaluation       (recovery pathways +         (answer the questionnaire)
  (compliant)          appeal strategy)
        └─────────────┴───────────────────────────┘
                      ▼
        Final Justification            APPROVE / PEND / DENY + confidence + next steps
```

Two flagship capabilities:

- **Coverage validation** — semantically matches patient evidence against each
  payer requirement (negation- and exclusion-aware), producing an explainable
  coverage matrix instead of brittle keyword overlap.
- **Criteria Gap Recovery Framework** — for every unmet criterion, returns its
  importance, whether it can be bypassed, the reviewer's intent, clinically
  accepted **alternative pathways**, contraindication/safety-based bypass
  options, and the strongest **appeal arguments** — framed as "document if
  present," never fabricated.

---

## Repository layout

```
src/denial_engine/        installable package (the serving engine)
├── core/                 config · llm client · prediction/audit storage
├── knowledge/            criteria KB · graph KB · FDA criteria   (DB2)
├── ml/                   feature engineering · XGBoost predictor (DB3)
├── agents/               necessity engine · questionnaire answerer · gap recovery
└── api.py                FastAPI app + `denial-engine` console entrypoint
pipelines/                offline: BigQuery extraction, KB builds, training, eval snapshots
tools/                    simulation, graph-KB evaluation, ROI/impact analysis
scripts/                  deploy + setup shell scripts
app_data/                 de-identified artifacts baked into the image (no PHI)
frontend/pharmacy-app/    the demo SPA (React) → Firebase Hosting
docs/                     design docs & guides
```

> `data/`, `models/`, the Notion export, loose PDFs/PNGs, `one-risa-1/`, and all
> `node_modules/` are gitignored — they hold PHI, large assets, or out-of-scope code.

---

## Quickstart

```bash
python -m venv venv && source venv/bin/activate
make install-dev                       # editable install + extras
cp .env.example .env.engine.local      # add ANTHROPIC_API_KEY (optional)
make run                               # serve at http://localhost:8080  (docs: /docs)
```

Other common tasks (`make help` for all):

```bash
make simulate          # deterministic accuracy simulation (~2s for 300 cases)
make lint              # ruff
make deploy-backend    # build + deploy the API to Cloud Run
make deploy-frontend   # build + deploy the demo to Firebase Hosting
```

Pipelines and tools run as modules from the repo root:

```bash
python -m pipelines.build_app_data        # regenerate app_data/ from BigQuery (needs ADC)
python -m tools.simulate_necessity --n 300
```

---

## Data sources

| Layer | Source |
|------|--------|
| **DB3** historical outcomes | BigQuery `prior--backen-prod-svc-u4g8.pharmacy_pa_requests.pa_request_entries` joined with `oncoemr.questionnaire_data` → `data/training_data.parquet` (10k labeled cases) |
| **DB2** drug criteria | `app_data/criteria_kb_merged.json` (FDA + payer/PBM/NCCN), synced to Firestore `risa-denial-hackathon` |
| Closed-loop ground truth | Firestore `medical-necessity-qa` collections `orders` + `criteria_validations` (AI vs. clinician-verified decisions) |

**Training never runs in the serving container.** Cloud Run only ships the
trained artifact + de-identified `app_data/` — no PHI in the image.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | Liveness probe — returns the service index + full endpoint list |
| GET  | `/api/summary` | Headline dataset metrics |
| GET  | `/api/triage` | Addressable vs. non-addressable denial split |
| GET  | `/api/graph/stats` · `/api/graph/drug/{drug}` | Clinical knowledge graph: inventory + per-drug subgraph |
| POST | `/api/graph/match` | Semantic, negation/exclusion-aware coverage match (vs. keyword overlap) |
| GET  | `/api/graph/eval` · `/api/graph/cypher` | Graph accuracy eval + Neo4j/PMG drop-in Cypher |
| POST | `/api/denial-recovery` | Post-denial appeal: viability, root cause, drafted appeal letter |
| GET  | `/api/denial-stats` | Denial rate by drug class × payer |
| GET  | `/api/insights` | Aggregate denial-risk insights |
| GET  | `/api/impact` | ROI / business case |
| GET  | `/api/samples` · `/api/showcase` · `/api/filing-queue` | De-identified case sets |
| GET  | `/api/criteria` · `/api/criteria/{drug}` | Drug coverage criteria (DB2) |
| GET  | `/api/groundtruth` | Closed-loop AI-vs-clinician agreement snapshot |
| GET  | `/api/agents` | Agent roster for the questionnaire answerer |
| POST | `/api/predict` · `/api/predict-batch` | Denial risk + top factors + recommendations |
| POST | `/api/answer` | Answer a PA questionnaire (evidence-grounded) |
| POST | `/api/necessity` | **Full multi-agent necessity pipeline** (all stages + trace) |
| POST | `/api/gap-recovery` | **Criteria Gap Recovery** for unmet criteria |
| POST | `/api/outcome` | Feedback loop: record the real payer outcome |

See [`docs/MEDICAL_NECESSITY_ENGINE.md`](docs/MEDICAL_NECESSITY_ENGINE.md) for the
full design, scaling notes, and measured results.

---

## Deploy

- **Backend:** `make deploy-backend` → Cloud Run service `risa-denial-api`
  (`rapids-platform`, `us-central1`). Builds from source via Cloud Build.
- **Frontend:** `make deploy-frontend` → Firebase Hosting
  (`pharmacy-hackathon-demo`). The SPA calls the engine directly over HTTPS.

---

## Security & compliance

- Secrets live in `.env.engine.local` (gitignored). **Never commit API keys**;
  rotate immediately if one leaks.
- No PHI in git or build artifacts — enforced by `.gitignore` / `.gcloudignore`.
- The optimization agents are **compliant**: they reframe and surface
  legitimately-supported pathways but never invent clinical facts.
