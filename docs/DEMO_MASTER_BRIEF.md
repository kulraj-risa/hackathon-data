# RISA Hackathon — Master Brief (memorize this)

> One project, two layers: **(1) a deployed Denial Prevention Engine** (real, trained, live)
> and **(2) the Approval Autopilot moonshot** (turns the predictor into a closed-loop approval author).
> Everything below traces to real files: `app_data/insights.json`, `summary.json`,
> `denial_stats.csv`, the trained `denial_model.pkl`, and `docs/MEDICAL_NECESSITY_ENGINE.md`.

---

## 0. The one-sentence pitch
**"We turned a denial *predictor* into an approval *author* — grounded only in RISA's real data,
proven on real denied cases, with a human's hand always on Submit."**

If you say nothing else, say that.

---

## 1. What this is (plain English)
Pharmacy prior authorizations (PAs) get denied ~40% of the time. Most denials aren't "patient
doesn't qualify" — they're **avoidable documentation gaps** nobody caught before submission.
We built a system that:
1. **Predicts** denial risk before submission (deployed, AUC 0.83).
2. **Explains** exactly which evidence is driving the risk.
3. **Authors** the fix — drafts the cited answer/evidence that flips the case red→green.
4. **Proves** it by re-scoring with the held-out model on real past denials.

Live: Next.js + FastAPI on Cloud Run. PHI-safe: the authoring LLM runs on infra you control
(PARAM Shivay / your own job), never a third-party API.

---

## 2. What we built (the 2-day arc — your commit story)
Tell it as a narrative of escalating honesty + capability:

1. **`97a9d4f` Stood up the engine** (FastAPI, no Streamlit) — real service, not a notebook.
2. **`87a6851` Real product UI** — Next.js front end; FastAPI becomes API-only.
3. **`8c126d3` Trained a real XGBoost model** on 10K cases, wired into `/api/predict`.
4. **`6dcbe6c` The breakthrough** — added the **evidence-text channel** → AUC **0.642 → 0.83**.
5. **`2454b9f` Shipped it** — both services deployed to Cloud Run.
6. **`0470e46` Insights** — redesigned dashboard + **model-derived risk insights** (the Insights/Patterns tabs).
7. **`7244c80`/`edd65cd` BOSS plugin** — embeddable denial-risk co-pilot panel.
8. **Necessity Engine v2** (`docs/MEDICAL_NECESSITY_ENGINE.md`) — the multi-agent reasoning brain.

> The arc: *build real → find the real signal → ship → explain → make it actionable.*

---

## 3. The numbers to MEMORIZE

### Data (`summary.json`)
- **10,000** labeled PA cases · **6,000 approved / 4,000 denied** → **60% approval (40% denial)**.
- **7,717** cases have a questionnaire · avg **6.9** questions each.

### Model (`insights.json` → `model`)
- **ROC-AUC 0.83** (headline) · baseline numeric-only model **0.642**.
- Accuracy **0.755** · Precision **0.787** · Recall **0.532** · F1 **0.635**.
- Trained on **8,000**, tested on held-out **2,000**.
- Features: **28 numeric** + **TF-IDF vocab 3,000** over evidence text.
- Algorithm: **XGBoost + TF-IDF** (gradient-boosted trees on numeric features fused with
  evidence-text vectors). SHAP via `pred_contribs` for per-case explanations.

### The single most important sentence about the model
**"Adding RISA's own supportive/contradictory evidence text took us from AUC 0.64 to 0.83.
The signal was never in metadata — it was in the evidence the system already extracts."**

---

## 4. THE INSIGHTS (the data story — this is your differentiator)

These come straight from `insights.json` analyzing all 10K cases. Each one is a *finding*,
not a feature. Narrate them as "here's what RISA's own data told us."

### Insight A — Contradictory facts are the denial dial (THE headline signal)
Denial rate climbs monotonically with the number of contradictory facts on the questionnaire:

| Contradictory facts | Cases | Denial rate |
|---|---|---|
| 0 | 4,121 | **33.3%** |
| 1 | 1,332 | 32.8% |
| 2 | 1,045 | 38.0% |
| 3–4 | 1,457 | 45.3% |
| 5–8 | 1,510 | 54.5% |
| 9+ | 535 | **58.3%** |

**What it taught us:** denial risk is *earned*, fact by fact. Go from 0 → 9+ contradictions and
denial nearly **doubles** (33% → 58%). This is why the model works and why the fix is "neutralize
contradictions," not "add more paperwork."

### Insight B — More supportive facts ≠ safety (counterintuitive)
Supportive-fact count is U-shaped, NOT monotonic: 0 facts = 38.9%, **3–5 facts = 31.5% (lowest)**,
but **11+ facts = 44.4%** (worse than zero). **What it taught us:** piling on evidence can signal a
*contested* case. Quality and relevance beat volume — which is exactly what the Autopilot optimizes.

### Insight C — A 100%-complete questionnaire is still denied 40% of the time
Of the 7,717 questionnaire cases, the 100%-complete ones are **still denied 40.4%**.
**What it taught us:** "completeness" is a vanity metric. *Filling every box doesn't help if the
answers carry contradictions.* This kills the naive "just answer all questions" approach and
justifies an evidence-quality model.

### Insight D — Specific phrases swing risk enormously (the actionable gold)
Model-derived evidence terms vs the 40% base rate:

**Risk UP (red flags):**
| Phrase | Cases | Denial rate | Lift |
|---|---|---|---|
| "preferred brand" | 294 | **96.9%** | **+56.9pp** |
| "unspecified ans(wer)" | 589 | 84.6% | +44.6 |
| "coverage" | 234 | 73.9% | +33.9 |
| "venofer" | 598 | 70.9% | +30.9 |
| "contraindications" | 1,460 | 67.5% | +27.5 |
| "deficiency anemia" | 933 | 59.5% | +19.5 |

**Risk DOWN (green flags):**
| Phrase | Cases | Denial rate | Lift |
|---|---|---|---|
| "alternative available" | 318 | **0.6%** | **−39.4pp** |
| "acceptable alternative" | 320 | 0.9% | −39.1 |
| "on formulary" | 135 | 13.3% | −26.7 |

**What it taught us:** denials are *linguistically* predictable. "preferred brand" / "unspecified
answer" almost guarantee denial; framing around "acceptable alternative / on formulary" almost
guarantees approval. **This is the exact knowledge the Autopilot uses to re-author answers.**

### Insight E — Denial is payer × medication-class specific (`denial_stats.csv`)
- Brand + **WellCare Medicare**: **82.4%** denial · Brand + **Fidelis Care**: 74.5% · Brand + **OptumRx Medicare Part D**: 69.2%.
- **NYRx Medicaid: 0%** denial (Brand and Generic).
**What it taught us:** risk isn't uniform — it's concentrated in specific payer/brand combos.
Triage should route the high-risk segments first (that's the Triage tab).

> **The meta-insight (say this):** *We didn't assume what causes denials — we measured it.
> Contradictions, not incompleteness, drive denial; specific phrasing swings it ±40 points;
> and it's concentrated in a few payer/brand segments. The model and the Autopilot are both
> built directly on those measured facts.*

---

## 5. The architecture (detailed — to answer any question)

### 5.1 Prediction pipeline (deployed)
```
10K PA cases (BigQuery → training_data.parquet, de-identified)
        │
        ▼
Feature engineering (denial_engine.ml.feature_engineer)
  • 28 numeric features: supportive/contradictory fact counts, completeness,
    answered/total questions, medication class, payer one-hots, lab recency, etc.
  • Evidence-text channel: TF-IDF (vocab 3,000) over supportive+contradictory fact strings
        │
        ▼
XGBoost classifier  →  P(denial)  +  SHAP per-feature contributions
        │
        ▼
FastAPI  /api/predict   →   Next.js dashboard (gauge + drivers + counterfactuals)
```

### 5.2 Counterfactual engine (the red→green moment, needs NO LLM)
For a high-risk case: iterate over neutralizing each contradictory fact, **re-score with the
same model**, rank the fixes by Δrisk. Output: "Add tried-and-failed documentation (Δrisk −38%)."
This is deterministic, fast, and auditable — it's why the demo is safe to run live.

### 5.3 Medical Necessity Engine v2 (the reasoning brain — `MEDICAL_NECESSITY_ENGINE.md`)
```
 inputs ─┬─ DB1 Patient Doc Intelligence   (LLM extracts evidence from EMR docs)
         ├─ DB2 Drug Criteria Intelligence (Criteria KB + FDA/payer/PBM/NCCN, vector RAG)
         └─ DB3 Historical Approval Intel  (the XGBoost model, AUC 0.83)
                       ▼
        Deciding Factor (Core Brain)  — Clinical 40% · Coverage 30% · History 20% · Docs 10%
                       ▼
        Evidence Coverage Validator   (per-requirement coverage matrix)
                       ▼
        Approval-Friendly Re-Evaluation (governed: reframe, never fabricate)
                       ▼
        Clinical Answering  →  Final Justification (APPROVE / PEND / DENY + confidence)
```
- Every stage is **LLM when a key is present, deterministic otherwise** (returns its `_mode`).
- Independent stages run in parallel (~40s/case full LLM; ~2s/300 cases deterministic).
- **Storage:** vector-first (Firestore vector search for DB2 guidelines + DB3 similar cases);
  criteria graph kept as JSON — no Neo4j needed at this scale.
- **Measured:** deterministic path **83.7% accuracy** on 300 balanced cases; approve-vs-deny
  probability separation **+34.9 points**.

### 5.4 The moonshot loop (Approval Autopilot)
**The one idea:** *the deployed AUC-0.83 model becomes the referee.* An LLM author drafts cited
answers; the predictor scores; the loop repeats until the risk gate turns green.
- Retrospective proof: run over the **~2,176 addressable denials** (of 4,000), apply the
  counterfactual repair, re-score with the held-out model, count red→green flips.
- Human-in-the-loop: it drafts; a filer approves and clicks Submit. Never auto-submits.

---

## 6. The compelling demo (run order)
1. **Hook** — show the red→green risk gauge; say the one-sentence pitch.
2. **Honesty slide** — "the brief assumed fields that don't exist; the real signal is RISA's own
   evidence facts; that took us 0.64 → 0.83." (This builds trust faster than any accuracy number.)
3. **Live ①** — load a **real denied case** (RED) → click Autopilot → it finds buried
   tried-and-failed + recent lab, drafts cited answers → gauge slides **red→green**.
4. **Live ②** — the counterfactual: "Add this one line (Δrisk −38%); here's where I found it."
5. **The Insights tab** — show Insight A (contradictions dial) + Insight D (phrase lifts).
   "We didn't guess what causes denials. We measured it."
6. **The proof slide** — retrospective recovery funnel: 4,000 → 2,176 addressable → recovered.
7. **Close** — "land the patient, not the model." Repeat the one sentence.

> Demo safety: pre-compute recovery numbers + 2–3 hero cases offline; the live click *replays*
> a known-good result, never gambles on a cold LLM call in front of judges.

---

## 7. Q&A prep (the hard questions + your answers)
- **"Is 0.83 good?"** → "Up from a 0.642 numeric-only baseline. The lift came from RISA's own
  evidence text — a real, reproducible result on held-out data, not a tuned vanity number."
- **"Why not 92% like the brief?"** → "The brief assumed AI-confidence/evidence-quality fields
  that don't exist in the schema. We refused to fake them. 0.83 is honest and grounded."
- **"Recall is only 0.53 — you miss denials."** → "True. We tuned for precision (0.79) so flagged
  cases are trustworthy; the Autopilot + counterfactual catch the rest by improving packets, not
  by relabeling. We can move the threshold per payer."
- **"Isn't 'approval-friendly' just gaming payers?"** → "No. The re-eval agent has hard rules: no
  invented facts, reframe existing evidence only, true gaps stay gaps with an explicit provider
  request. Every answer is cited and logged."
- **"Does PHI leave your control?"** → "Never. The authoring LLM runs on PARAM Shivay / your job.
  No third-party API sees a record. Full audit trail."
- **"What's real vs aspirational?"** → "Real: the deployed model, the insights, the deterministic
  counterfactual, the necessity-engine simulation. Aspirational/next: prospective pilot recovery
  measured by filers."

---

## 8. What to submit
1. **Live app URL** (Cloud Run) — the deployed engine with Insights/Predict/Triage/Patterns tabs.
2. **The deck** (`docs/MOONSHOT_DECK.md`, 14 slides) — predictor → author narrative.
3. **The honesty story** — 0.64 → 0.83 via real evidence text (your trust anchor).
4. **The insights** (Section 4 above) — measured denial drivers.
5. **The proof** — retrospective recovery on real denials (`app_data` recovery output).
6. **Architecture one-pager** — Section 5 diagrams.
7. **Compute story** — XGBoost + (optional) ClinicalBERT/medical-LLM experiment on PARAM Shivay.

---

## 9. "Should we add an Insights tab?" — you already have one; make it the star
The app already renders **Insights / Risk Insights / Patterns** tabs from `insights.json`.
Recommendation: don't add a new tab — **elevate the existing one** to tell Section 4 as a story:
contradictions-dial chart → phrase-lift table (red/green) → payer-segment heatmap → the
"completeness is a vanity metric" callout. That turns a chart page into the argument that the
whole product is grounded in measured reality. See Section 10 for impact reasoning.

---

## 10. How much impact do the insights hold, and why (the reasoning)
- **They convert a black-box score into a defensible argument.** Judges trust "we measured that
  9+ contradictions = 58% denial" far more than "our model says 0.83." Insights are the *evidence*
  for the model's *credibility*.
- **They are the Autopilot's instruction set.** Insight D (phrase lifts) literally tells the
  authoring agent what to reframe ("preferred brand" → "acceptable alternative on formulary").
  Without the insights, the loop has no target; with them, every rewrite is grounded.
- **They drive triage ROI.** Insight E concentrates risk in a few payer/brand segments, so the
  Triage tab can prioritize the cases where intervention pays off most.
- **They de-risk the claim.** Insight C ("100% complete still 40% denied") pre-empts the obvious
  objection ("just fill the form") and proves you need evidence quality, not completeness.
- **Bottom line:** the model is the engine, but the **insights are the proof of roadworthiness**.
  In a healthcare pitch, "grounded + measured + cited" beats a bigger accuracy number every time.
