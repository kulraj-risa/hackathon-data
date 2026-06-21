# Q&A Prep — Denial Prevention Engine

Keep answers <30 seconds. Lead with the honest, specific point.

### Q1. "What's your real accuracy?"
ROC-AUC **0.83** on a 2,000-case held-out test set; precision 0.79, recall 0.53. We deliberately report AUC, not a cherry-picked accuracy, because the base rate is 40% denials. The model is a triage aid, not an oracle.

### Q2. "What if the model is wrong?"
It never auto-decides. It ranks risk and surfaces fixes; a human still submits. False positives just mean an extra documentation check; false negatives are no worse than today's process. We tune the HIGH threshold to the team's tolerance.

### Q3. "How is this different from the hackathon guide?"
The guide assumed fields (AI confidence, evidence-quality flags) that don't exist in production and quoted a fictional 92%. We validated the real BigQuery schema and found the true signal is RISA's **supportive/contradictory evidence facts**. That's our unfair advantage — we built on reality, AUC 0.64→0.83.

### Q4. "Where does it run? Is PHI safe?"
Training is offline/local (or Vertex AI). The Cloud Run services serve only **de-identified** precomputed artifacts and the saved model — they never touch live PHI or the prod BigQuery project. The TF-IDF vocabulary uses `min_df>=5`, so no patient-specific tokens persist.

### Q5. "How do you explain a prediction?"
Exact SHAP values via XGBoost `pred_contribs` (no extra library). We show the top factors pushing a case toward denial — specific evidence phrases plus structured ratios — then map contradictions to actionable fixes.

### Q6. "Is the $1.8M real?"
It's the **target** scenario (60%→95%). We also show a **model-grounded** scenario on the Impact tab: 85% preventable × 53% recall × 60% fix rate ≈ $580K/yr. Every figure is derived from auditable constants in `config.py`.

### Q7. "How would it fit the real workflow?"
As a pre-submission gate: after the questionnaire is answered, score it; block/flag HIGH risk with fixes; re-score after edits. The batch endpoint lets a team triage a whole worklist.

### Q8. "How often retrain / what about drift?"
Retrain monthly (or when payer criteria change) on new outcomes. The audit log captures predictions; pairing them with eventual outcomes gives a continuous feedback loop. Training is a single offline job — nothing in serving changes.

### Q9. "Does it generalize beyond pharmacy PAs?"
The architecture (evidence facts → TF-IDF + structured features → gradient boosting) is domain-agnostic. Medical PAs are a Phase-2 extension once their evidence facts are available.

### Q10. "Why XGBoost + TF-IDF and not an LLM?"
It's fast, cheap, fully explainable, runs on de-identified data, and the TF-IDF channel already captures the evidence signal (AUC 0.83). An LLM re-ranker is a possible later enhancement, but this is production-pragmatic.
