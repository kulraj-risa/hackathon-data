# Developer workflow for the denial-prevention engine.
# Run `make help` for the list of targets.

PYTHON ?= python3
PROJECT ?= rapids-platform
REGION ?= us-central1
SERVICE ?= risa-denial-api

.DEFAULT_GOAL := help

.PHONY: help install install-dev run test lint format \
        build-data deploy-backend deploy-frontend frontend-build clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Install the engine package (runtime deps)
	$(PYTHON) -m pip install -e .

install-dev: ## Install with pipeline + dev extras
	$(PYTHON) -m pip install -e ".[pipelines,dev]"

run: ## Serve the API locally (http://localhost:8080)
	PORT=8080 denial-engine

test: ## Run the test suite
	$(PYTHON) -m pytest -q

lint: ## Lint with ruff
	$(PYTHON) -m ruff check src pipelines tools

format: ## Auto-format with ruff
	$(PYTHON) -m ruff check --fix src pipelines tools

build-data: ## Regenerate de-identified app_data/ from BigQuery (needs ADC)
	$(PYTHON) -m pipelines.build_app_data

simulate: ## Run the medical-necessity accuracy simulation (deterministic)
	$(PYTHON) -m tools.simulate_necessity --n 300

deploy-backend: ## Deploy the API to Cloud Run
	bash scripts/deploy_backend.sh

frontend-build: ## Build the demo frontend
	cd frontend/pharmacy-app && npm ci && npm run build:demo

deploy-frontend: ## Build + deploy the demo frontend to Firebase Hosting
	cd frontend/pharmacy-app && npm run build:demo && $(PYTHON) deploy-hosting.py

clean: ## Remove caches and build artifacts
	find . -type d -name __pycache__ -prune -exec rm -rf {} + 2>/dev/null || true
	rm -rf build dist *.egg-info src/*.egg-info .pytest_cache .ruff_cache
