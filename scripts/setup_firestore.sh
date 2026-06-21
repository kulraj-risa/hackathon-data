#!/usr/bin/env bash
# One-time setup for the hackathon app's DEDICATED, isolated Firestore database.
#
# This creates a brand-new Firestore database inside rapids-platform that is
# SEPARATE from:
#   - the (default) database, and
#   - the pharmacy product's "pharmacy" database.
# The hackathon API only ever reads/writes this DB, so it can never touch the
# real pharmacy dashboard's data.
#
# Run once (needs an account with Firestore + IAM admin on rapids-platform):
#   gcloud auth login
#   ./scripts/setup_firestore.sh
set -euo pipefail

PROJECT="${PROJECT:-rapids-platform}"
DATABASE="${FIRESTORE_DATABASE:-risa-denial-hackathon}"
# Firestore location. nam5 = US multi-region. Use a single region (e.g.
# us-central1) to co-locate with Cloud Run if you prefer lower latency.
LOCATION="${FIRESTORE_LOCATION:-nam5}"

echo "🗄️  Setting up isolated Firestore DB '$DATABASE' in project '$PROJECT' ($LOCATION)"

# 1. Create the named database (Native mode). Idempotent: skip if it exists.
if gcloud firestore databases describe --database="$DATABASE" --project="$PROJECT" >/dev/null 2>&1; then
  echo "✅ Database '$DATABASE' already exists — skipping create."
else
  echo "📦 Creating database '$DATABASE'..."
  gcloud firestore databases create \
    --database="$DATABASE" \
    --location="$LOCATION" \
    --type=firestore-native \
    --project="$PROJECT"
fi

# 2. Grant the Cloud Run runtime service account read/write on Firestore.
#    Cloud Run uses the default compute service account unless overridden.
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
RUNTIME_SA="${RUNTIME_SA:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"

echo "🔑 Granting roles/datastore.user to $RUNTIME_SA"
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.user" \
  --condition=None \
  >/dev/null

echo "✅ Done."
echo "   Database : $DATABASE"
echo "   Project  : $PROJECT"
echo "   Runtime  : $RUNTIME_SA (roles/datastore.user)"
echo
echo "Deploy the API against it with:"
echo "   STORAGE_BACKEND=firestore FIRESTORE_DATABASE=$DATABASE ./deploy.sh"
