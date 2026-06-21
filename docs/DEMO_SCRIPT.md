# 5-Minute Demo Script — RISA Denial Prevention Engine

**Live app:** https://risa-denial-web-835676485453.us-central1.run.app
**Stack:** XGBoost + TF-IDF evidence model · FastAPI + Next.js on Cloud Run (`rapids-platform`)
**One-liner:** *"We catch preventable pharmacy PA denials before they're submitted, using the evidence RISA already extracts."*

> Honesty note for judges: numbers below are the **real** model's. Test ROC-AUC is **0.83** (not a made-up 92%). The 60%→95% figure is the *target* / stated goal; the Impact tab also shows a conservative, model-grounded scenario.

---

## [0:00–0:30] The problem
> "At RISA, about **40% of pharmacy prior-auths get denied** — 4,000 patients a year. Each denial delays medication ~7 days and costs rework. The goal of Problem #5 is to move approval from **60% toward 95%**."

**Show:** Overview tab — *Cases analyzed 10,000*, *Approval rate 60%*.

## [0:30–1:10] The insight (why this is winnable)
> "The guide assumed fields like AI 'confidence' that don't exist in production. We checked the real BigQuery schema. The actual signal is RISA's own **supportive and contradictory evidence facts**. Feeding those into the model lifted ROC-AUC from **0.64 → 0.83**. The evidence text is the dominant predictor."

**Show:** Overview → *Model performance* — the AUC bar (0.64 baseline → 0.83 deployed).

## [1:10–2:40] Live demo — a high-risk case
> "Here's a Brand PA with a few problems in the evidence."

**Do:** Predict tab → click **"Conflicted case"** preset → **Analyze case**.

**Show & narrate:**
- Risk gauge lands in **MEDIUM/HIGH**.
- **Top risk factors (SHAP):** point to the contributing evidence phrases and the contradictory-to-supportive ratio — *"this is exactly why the model is worried."*
- **Recommended fixes:** step-therapy not documented, quantity exceeds limit, missing biomarker — *"each contradiction is mapped to a real failure mode with a concrete fix."*

## [2:40–3:10] Fix & re-validate
> "Let's say the coordinator documents the prior step-therapy and removes that contradiction."

**Do:** Delete the step-therapy line from *Contradictory facts* → **Analyze** again.
**Show:** Risk **drops** and the factor disappears. *"We just prevented a denial — before it ever reached the payer."*

## [3:10–3:50] Scale it — batch
**Do:** Batch tab → **Score 5 cases**.
**Show:** Risk distribution bar (HIGH/MEDIUM/LOW), avg risk, **preventable denials** count, sorted queue with each case's top factor. *"A reviewer can triage a whole worklist and attack the red ones first."*

## [3:50–4:30] Business impact
**Do:** Impact tab.
**Show:** Two clearly-labeled scenarios:
- **Target (stated goal):** 60%→95%, ~$1.88M annual benefit, 24,500 patient-days saved.
- **Model-grounded (conservative):** uses the model's real 53% recall × 60% fix rate → still ~$580K/yr and ~7,500 patient-days.
> "We're not hand-waving — every number derives from auditable assumptions in config."

## [4:30–5:00] Close + roadmap
> "It's deployed on Cloud Run, served on de-identified data so it never touches live PHI, and the prediction trail is auditable. Next: wire it as a pre-submission gate in the PA workflow and add a feedback loop to retrain on new outcomes."

**Show:** Audit tab (de-identified prediction log).

---

## Backup talking points
- *Why not the guide's code?* It referenced non-existent fields and a fictional 92%. We built the honest version on the real schema.
- *Where does training happen?* Offline/local (or Vertex AI). Cloud Run only serves the saved artifact — no PHI, no live BigQuery.
- *Explainability* is exact SHAP via XGBoost `pred_contribs` — no extra dependency.
