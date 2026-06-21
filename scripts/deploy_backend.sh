#!/usr/bin/env bash
# Deploy the denial-prevention engine API to Cloud Run on rapids-platform.
# Builds from source via Cloud Build (no local Docker required).
#
# Prereqs (one-time):
#   gcloud auth login                        # refresh interactive credentials
#   python -m pipelines.build_app_data       # regenerate de-identified app_data/
#   gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
#       artifactregistry.googleapis.com --project rapids-platform
set -euo pipefail

# Run from the repo root regardless of where the script is invoked.
cd "$(dirname "$0")/.."

PROJECT="${PROJECT:-rapids-platform}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-risa-denial-api}"

# Storage backend. Default to the dedicated, isolated Firestore DB so the demo
# can collect data — run scripts/setup_firestore.sh once first. Override with
# STORAGE_BACKEND=local for an ephemeral, zero-setup run.
STORAGE_BACKEND="${STORAGE_BACKEND:-firestore}"
FIRESTORE_PROJECT="${FIRESTORE_PROJECT:-$PROJECT}"
FIRESTORE_DATABASE="${FIRESTORE_DATABASE:-risa-denial-hackathon}"
FIRESTORE_COLLECTION="${FIRESTORE_COLLECTION:-pa_predictions}"

echo "🚀 Deploying '$SERVICE' to Cloud Run (project=$PROJECT, region=$REGION)"
echo "   storage=$STORAGE_BACKEND  firestore_db=$FIRESTORE_DATABASE"

if [[ ! -f "app_data/summary.json" ]]; then
  echo "❌ app_data/ missing. Run: python -m pipelines.build_app_data" >&2
  exit 1
fi

ENV_VARS="STORAGE_BACKEND=${STORAGE_BACKEND}"
if [[ "$STORAGE_BACKEND" == "firestore" ]]; then
  ENV_VARS="${ENV_VARS},FIRESTORE_PROJECT=${FIRESTORE_PROJECT},FIRESTORE_DATABASE=${FIRESTORE_DATABASE},FIRESTORE_COLLECTION=${FIRESTORE_COLLECTION}"
fi

gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars "$ENV_VARS"

echo "✅ Deployed. URL:"
gcloud run services describe "$SERVICE" \
  --project "$PROJECT" --region "$REGION" \
  --format='value(status.url)'
