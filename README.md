# RISA Denial Prevention Engine

Predicts pharmacy Prior-Authorization (PA) denials **before** submission so staff
can fix documentation gaps and lift approval from ~60% → 95%.

> Stack: **Python + FastAPI** (no Streamlit) · XGBoost · BigQuery (offline) · Cloud Run

## Where training vs. serving happen

| Stage | Where | Touches PHI? |
|-------|-------|--------------|
| **Train** the XGBoost model | Local machine / Vertex AI job with ADC to prod BigQuery (`prior--backen-prod-svc-u4g8`) | Yes (secured) |
| **Serve** predictions + dashboard | FastAPI on Cloud Run (`rapids-platform`) | **No** — only de-identified `app_data/` + the trained artifact |

Training never runs inside the Cloud Run service. See [`DEPLOY.md`](DEPLOY.md).

## Layout

```
app.py              FastAPI service (JSON API + static SPA)  ← serving
static/index.html   Frontend (vanilla JS + Chart.js, no build step)
storage.py          Pluggable audit store (local JSON | Firestore | BigQuery)
config.py           Project / model config
data_loader.py      BigQuery extraction (Queries 1–3)  ← local/offline only
build_app_data.py   Generates de-identified app_data/   ← local/offline only
app_data/           Precomputed de-identified aggregates baked into the image
Dockerfile          Cloud Run container (uvicorn)
deploy.sh           gcloud run deploy --source .
```

## Run locally

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements-app.txt
uvicorn app:app --reload --port 8080
# http://localhost:8080  ·  docs at /docs  ·  health at /healthz
```

To regenerate de-identified data (needs prod BigQuery access):

```bash
pip install -r requirements.txt
python build_app_data.py
```

## Deploy

```bash
./deploy.sh   # builds + deploys to Cloud Run on rapids-platform
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Liveness probe |
| GET | `/api/summary` | Headline dataset metrics |
| GET | `/api/denial-stats` | Denial rate by drug class × payer |
| GET | `/api/samples` | De-identified sample cases |
| POST | `/api/predict` | Risk score (placeholder until model wired in) |
| GET | `/api/audit` | Recent (de-identified) prediction log |
