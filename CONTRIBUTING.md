# Contributing

## Project layout

```
src/denial_engine/      installable Python package (the serving engine)
  core/                 config, llm client, prediction/audit storage
  knowledge/            criteria KB, graph KB, FDA criteria (DB2)
  ml/                   feature engineering + XGBoost predictor (DB3)
  agents/               necessity engine, questionnaire answerer, gap recovery
  api.py                FastAPI app + console entrypoint (`denial-engine`)
pipelines/              offline data extraction, KB builds, training (run as -m)
tools/                  simulation, evaluation, impact analysis
scripts/                deploy + setup shell scripts
app_data/               de-identified artifacts baked into the serving image
frontend/pharmacy-app/  the demo SPA (React) deployed to Firebase Hosting
docs/                   design docs and guides
```

## Setup

```bash
python -m venv venv && source venv/bin/activate
make install-dev            # editable install + pipeline/dev extras
cp .env.example .env.engine.local   # add your ANTHROPIC_API_KEY (optional)
```

## Running

```bash
make run        # serve the API at http://localhost:8080
make simulate   # deterministic accuracy simulation
make lint       # ruff
make test       # pytest
```

Pipelines and tools run as modules from the repo root so the package resolves:

```bash
python -m pipelines.build_app_data
python -m tools.simulate_necessity --n 300
```

## Conventions

- **Imports** use the full package path (e.g. `from denial_engine.knowledge.criteria_kb import match_case`).
- **No PHI in git or build artifacts.** `data/`, `models/`, loose PDFs/PNGs and
  the Notion export are gitignored — keep it that way.
- **Every LLM stage must have a deterministic fallback** so the pipeline runs
  offline and never breaks a demo.
- Run `make lint` before opening a PR.

## Security

- Secrets live in `.env.engine.local` (gitignored). Never commit keys.
- If a key is ever committed, rotate it immediately.
