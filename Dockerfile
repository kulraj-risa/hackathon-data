# FastAPI service for Cloud Run. Python 3.12 = stable wheels for all deps.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

# Install runtime deps first for better layer caching.
COPY requirements-app.txt .
RUN pip install --no-cache-dir -r requirements-app.txt

# App code + frontend + precomputed de-identified data (NO PHI in the image).
COPY app.py storage.py config.py ./
COPY static/ ./static/
COPY app_data/ ./app_data/

EXPOSE 8080

# Cloud Run sets $PORT; uvicorn must bind 0.0.0.0 and that port.
CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT}
