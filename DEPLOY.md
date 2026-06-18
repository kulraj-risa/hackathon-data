# Deploying the RISA app to `rapids-platform` (Cloud Run)

The app is a **FastAPI** service (no Streamlit) hosted on **Cloud Run**. It serves
**precomputed, de-identified data** baked into the container (`app_data/`). It does
**not** query the prod PHI table or the prod BigQuery project at serve time — this
avoids cross-project IAM and keeps PHI out of the hosted app.

## Where does model TRAINING happen?

Training is **offline / local — never in the Cloud Run service.**

- `prior--backen-prod-svc-u4g8` (prod BigQuery, PHI): source of training data.
- **Local machine / a training job** (with ADC to prod BigQuery): runs
  `data_loader.py` → `feature_engineer.py` → `model_trainer.py`, producing
  `models/denial_predictor_final.pkl`. This is where the XGBoost model is trained.
  It can later be promoted to a **Vertex AI custom training job** on the prod
  project if you want it off your laptop, but the laptop/local run is the default.
- `rapids-platform` (this Cloud Run service): **serving / inference only.** It loads
  the trained artifact (once wired in) and the de-identified `app_data/`. No PHI,
  no training, no live prod BigQuery access at serve time.

```
prod BigQuery (PHI)
      │  ADC, local only
      ▼
Local / Vertex AI  ── TRAIN ──>  models/denial_predictor_final.pkl   (XGBoost)
      │                                   │  artifact (no PHI)
      │ build_app_data.py                 │
      ▼                                    ▼
  app_data/  (de-identified aggregates) ──┐
                                          ▼
Cloud Build (gcloud run deploy --source .) ──> Cloud Run service (rapids-platform)
  Dockerfile → FastAPI app.py + static/ + storage.py + app_data/   ── SERVE / inference
                                          │
                                          ▼
        storage.py (pluggable): local JSON | Firestore | BigQuery
```

## One-time setup

```bash
# 1. Refresh interactive gcloud credentials (the IDE session token was stale)
gcloud auth login

# 2. Enable required APIs on rapids-platform
gcloud services enable \
  run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  --project rapids-platform
```

## Deploy

```bash
# Regenerate de-identified app data (run locally; needs prod BigQuery ADC)
venv/bin/python build_app_data.py

# Build + deploy from source (no local Docker needed)
./deploy.sh
```

Override defaults via env vars:

```bash
PROJECT=rapids-platform REGION=us-central1 SERVICE=risa-denial-dashboard ./deploy.sh
```

## Storage backend (decide later)

`storage.py` is DB-agnostic. Default is a local JSON-lines file. To switch:

| Backend | How |
|---------|-----|
| Local (default) | `STORAGE_BACKEND=local` (ephemeral on Cloud Run) |
| Firestore | `STORAGE_BACKEND=firestore`, add `google-cloud-firestore` to `requirements-app.txt`, grant the Cloud Run service account Firestore access on `rapids-platform` |
| BigQuery | `STORAGE_BACKEND=bigquery`, set `BQ_PREDICTIONS_TABLE=project.dataset.table`, add `google-cloud-bigquery` |

Only de-identified prediction metadata is persisted (allow-list enforced in
`storage.py`). **Never** write patient names / DOB / MRN.

## PHI / compliance notes

- `data/` (training parquet, may contain questionnaire/clinical text) and the
  guide are excluded from the upload via `.gcloudignore` / `.dockerignore`.
- The container only contains `app_data/` aggregates — verified PHI-free by an
  allow-list check in `build_app_data.py`.
- If you later need live data in the hosted app, prefer a dedicated read-only
  service account scoped to non-PHI views.

## Run locally

```bash
venv/bin/pip install -r requirements-app.txt
venv/bin/uvicorn app:app --reload --port 8080
# open http://localhost:8080  (API docs at /docs, health at /healthz)
```

## Status

- [x] Container + deploy pipeline ready (`Dockerfile`, `deploy.sh`)
- [x] FastAPI app runs locally (health 200) — Streamlit removed
- [x] De-identified app data generated
- [ ] `gcloud auth login` + API enablement (needs you, interactive)
- [ ] First Cloud Run deploy
- [ ] Wire real model into the Predict endpoint (after `model_trainer.py`)
- [ ] Choose persistent storage backend (Firestore vs BigQuery)
```
