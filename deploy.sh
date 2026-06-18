#!/usr/bin/env bash
# Deploy the RISA dashboard to Cloud Run on rapids-platform.
# Builds from source via Cloud Build (no local Docker required).
#
# Prereqs (one-time):
#   gcloud auth login                       # refresh interactive credentials
#   ./build_app_data.py                     # regenerate de-identified app_data/
#   gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
#       artifactregistry.googleapis.com --project rapids-platform
set -euo pipefail

PROJECT="${PROJECT:-rapids-platform}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-risa-denial-dashboard}"

echo "🚀 Deploying '$SERVICE' to Cloud Run (project=$PROJECT, region=$REGION)"

if [[ ! -f "app_data/summary.json" ]]; then
  echo "❌ app_data/ missing. Run: python build_app_data.py" >&2
  exit 1
fi

gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars "STORAGE_BACKEND=${STORAGE_BACKEND:-local}"

echo "✅ Deployed. URL:"
gcloud run services describe "$SERVICE" \
  --project "$PROJECT" --region "$REGION" \
  --format='value(status.url)'
