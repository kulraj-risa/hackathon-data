# FastAPI API service for Cloud Run. Python 3.12 = stable wheels for all deps.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080 \
    PROJECT_ROOT=/app \
    APP_DATA_DIR=/app/app_data \
    DATA_DIR=/app/data \
    MODELS_DIR=/app/models

WORKDIR /app

# libgomp1 is required by xgboost's native library on Debian slim.
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install the package (deps resolved from pyproject.toml). README is referenced
# by pyproject's `readme`, so it must be present at build time.
COPY pyproject.toml README.md ./
COPY src/ ./src/
RUN pip install --no-cache-dir .

# Precomputed, de-identified data baked into the image (NO PHI).
COPY app_data/ ./app_data/

EXPOSE 8080

# Console entrypoint binds 0.0.0.0 and honors $PORT (Cloud Run sets it).
CMD ["denial-engine"]
