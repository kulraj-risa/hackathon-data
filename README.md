# RISA Denial Prevention Engine

Predicts pharmacy Prior-Authorization (PA) denials **before** submission so staff
can fix documentation gaps and lift approval from ~60% → 95%.

> Stack: **Next.js** (frontend) + **FastAPI** (API/inference) · XGBoost · BigQuery (offline) · Cloud Run

## Two services

| Service | Tech | Role |
|---------|------|------|
| `web/` | Next.js 16 + Tailwind + Recharts | UI; proxies `/api/*` to the backend |
| root (`app.py`) | FastAPI + uvicorn | JSON API, audit store, model inference |

The browser only talks to Next.js; Next proxies `/api/*` to FastAPI via
`BACKEND_URL` (a `rewrites()` rule), so there's no CORS to manage.

## Where training vs. serving happen

| Stage | Where | Touches PHI? |
|-------|-------|--------------|
| **Train** the XGBoost model | Local machine / Vertex AI job with ADC to prod BigQuery (`prior--backen-prod-svc-u4g8`) | Yes (secured) |
| **Serve** predictions + dashboard | FastAPI on Cloud Run (`rapids-platform`) | **No** — only de-identified `app_data/` + the trained artifact |

Training never runs inside the Cloud Run service. See [`DEPLOY.md`](DEPLOY.md).

## Layout

```
app.py              FastAPI API (JSON + inference)        ← serving
storage.py          Pluggable audit store (local JSON | Firestore | BigQuery)
config.py           Project / model config
data_loader.py      BigQuery extraction (Queries 1–3)     ← local/offline only
build_app_data.py   Generates de-identified app_data/      ← local/offline only
app_data/           Precomputed de-identified aggregates baked into the image
Dockerfile          API container (uvicorn)
deploy.sh           gcloud run deploy (API) --source .
web/                Next.js frontend
  src/app/page.tsx  Dashboard (Overview / Patterns / Predict / Audit)
  next.config.ts    Proxies /api/* -> BACKEND_URL (FastAPI)
  Dockerfile        Frontend container (standalone Next server)
```

## Run locally

Two terminals:

```bash
# 1) API backend (port 8000)
python3 -m venv venv && source venv/bin/activate
pip install -r requirements-app.txt
uvicorn app:app --reload --port 8000

# 2) Frontend (port 3000, proxies /api -> :8000)
cd web
npm install
BACKEND_URL=http://127.0.0.1:8000 npm run dev
# open http://localhost:3000   (API docs at http://localhost:8000/docs)
```

To regenerate de-identified data (needs prod BigQuery access):

```bash
pip install -r requirements.txt
python build_app_data.py
```

## Model

`python model_trainer.py` trains an XGBoost classifier (Denied vs Approved) on
`data/training_data.parquet` and writes the slim artifact to
`app_data/denial_model.pkl` (no PHI — ships in the API image).

- **Pipeline:** `feature_engineer.py` → `model_trainer.py` → `denial_predictor.py`.
- **Two feature channels:**
  1. **Numeric (28):** question counts, completeness, and **supportive vs.
     contradictory fact** totals/ratios (the guide's `confidence` /
     `evidence_quality` fields don't exist in the data), plus drug class & payer.
  2. **Evidence text (TF-IDF):** the per-criterion **supportive / contradictory
     facts** and AI answers (`api_response.facts` / `answer`) — RISA's own
     evidence-evaluation output (Stage 3). `min_df≥5` keeps the persisted
     vocabulary free of patient-specific tokens.
- **Performance:** the text channel lifts held-out **ROC-AUC from 0.64 → 0.83**
  (precision 0.79). The evidence facts are by far the dominant signal — the
  guide's "92%" assumed structured fields that aren't populated.
- **RISA-grounded recommendations:** contradictory facts are classified into
  authentic failure modes (step-therapy, diagnosis/indication, dosing,
  labs/biomarkers, missing documentation, criteria-not-met) and explained with
  the Stage-3 True/False/**Undetermined** + AND-rollup vocabulary.

## Deploy (Cloud Run, two services)

```bash
# 1) API
./deploy.sh                       # deploys FastAPI -> prints API URL

# 2) Frontend (point it at the API URL from step 1)
cd web
gcloud run deploy risa-denial-web --source . --project rapids-platform \
  --region us-central1 --allow-unauthenticated --port 8080 \
  --set-env-vars "BACKEND_URL=https://<api-service-url>"
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Liveness probe |
| GET | `/api/summary` | Headline dataset metrics |
| GET | `/api/denial-stats` | Denial rate by drug class × payer |
| GET | `/api/samples` | De-identified sample cases |
| POST | `/api/predict` | Denial risk + recommendations (trained XGBoost model) |
| GET | `/api/audit` | Recent (de-identified) prediction log |
