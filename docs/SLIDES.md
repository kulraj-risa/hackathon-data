# Presentation Deck (10 slides) — Denial Prevention Engine

Speaker outline. Each slide = one idea. Live app does the heavy lifting on slides 5–7.

---

## Slide 1 — Title
**RISA Denial Prevention Engine**
Catch preventable pharmacy PA denials *before* submission.
Problem #5 · 60% → 95% approval · Live on Cloud Run.

## Slide 2 — The problem
- 40% of pharmacy PAs denied → **4,000 patients/yr**
- ~7-day medication delay per denial
- Rework + lost revenue
- *Most denials are preventable documentation gaps.*

## Slide 3 — The honest insight
- Hackathon guide assumed data that doesn't exist (AI "confidence", evidence-quality flags) → fictional 92%.
- We validated the **real BigQuery schema**.
- True signal = RISA's **supportive / contradictory evidence facts**.
- Adding evidence text: **ROC-AUC 0.64 → 0.83**.

## Slide 4 — The solution (architecture)
Evidence facts → **TF-IDF + structured features** → **XGBoost** → denial risk % + band → **SHAP** top factors → mapped **fixes** → re-validate.
Trained offline; served on de-identified data (no live PHI).

## Slide 5 — LIVE DEMO: single case
Conflicted PA → 1-click Analyze → risk gauge + **SHAP factors** + **recommended fixes** → remove a contradiction → risk drops. *"Denial prevented."*

## Slide 6 — LIVE DEMO: batch triage
Paste a worklist → risk distribution + **preventable denials** + sorted queue. Triage the reds first.

## Slide 7 — Validation
- Held-out 2,000 cases: **AUC 0.83**, precision 0.79, recall 0.53.
- 0.64 → 0.83 lift from the evidence-text channel.
- Exact SHAP explainability (XGBoost `pred_contribs`).

## Slide 8 — Business impact (two scenarios)
| | Target (goal) | Model-grounded |
|---|---|---|
| Approval | 60%→95% | 60%→~71% |
| Annual benefit | ~$1.88M | ~$0.58M |
| Patient-days saved | 24,500 | ~7,500 |
*Every number auditable in `config.py`.*

## Slide 9 — Roadmap
- **Now:** deployed dashboard + API, audit trail.
- **Next:** pre-submission gate in the PA workflow.
- **Then:** outcome feedback loop → monthly retrain; medical-PA expansion.

## Slide 10 — Why this wins
- Built on RISA's **real** data, not assumptions.
- **Working, deployed** product — not slides.
- **Explainable + actionable** (factors → fixes).
- **Honest ROI** with conservative and target scenarios.
- **PHI-safe** by design.
