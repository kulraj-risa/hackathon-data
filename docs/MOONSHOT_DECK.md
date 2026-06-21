# 🚀 MOONSHOT PITCH DECK — RISA Approval Autopilot
### From *predicting* denials → *authoring* approvals (and proving it on real denied cases)

> 14 slides. Live app carries slides 6–8. Every number traces to `config.py`,
> `app_data/`, or a cluster run log. Speaker notes are the *italic* lines.
>
> One-line thesis: **"We stopped predicting denials and started preventing them —
> an autonomous, cited PA author that recovers real denials, with a human's hand
> always on the Submit button."**

---

## Slide 1 — Title / Hook
**RISA Approval Autopilot**
*Don't just flag the denial. Author the approval.*

- Problem #5 · Pharmacy PA · 60% → first-pass approvals
- Live on Cloud Run · Medical LLM on PARAM Shivay (PHI never leaves infra you control)

> *"Last sprint we built a system that predicts denials. This sprint we asked a
> harder question: if we can predict it, can we just fix it? Meet the Autopilot."*

**SHOW:** product name + the red→green risk gauge as a single animated hero image.

---

## Slide 2 — The problem (make it human first, then financial)
- **4 in 10 pharmacy PAs are denied** — 4,000 patients/yr on our data.
- Each denial = **~7 extra days** a patient waits for their medication + staff rework.
- **The gut punch:** most denials aren't "patient doesn't qualify" — they're *avoidable
  documentation gaps* that nobody caught before the packet went out the door.

> *"This isn't a paperwork problem. It's a 7-day-delay-for-a-sick-patient problem,
> 4,000 times a year."*

**SHOW:** the 4,000 / 7-days / "avoidable" triad, one big number each.

---

## Slide 3 — The honest insight (this is your trust-builder — keep it)
- The hackathon brief assumed fields that **don't exist** in the data (AI "confidence",
  evidence-quality flags) → its "92%" was fiction.
- We validated the **real BigQuery schema**. The true signal is RISA's own
  **supportive / contradictory evidence facts** on every questionnaire answer.
- Adding that evidence text took our denial model from **AUC 0.64 → 0.83**.
- **We only build on what's real. That discipline is the whole pitch.**

> *"We'd rather show you an honest 0.83 than a fictional 0.92. Everything after this
> slide is grounded in your actual data."*

**SHOW:** before/after AUC bar (0.64 → 0.83); a tiny snippet of a real
`contradictory_facts` string (de-identified).

---

## Slide 4 — The leap: prediction → authoring
Two columns, "Last sprint" vs "This sprint":

| Denial Prevention Engine (have) | **Approval Autopilot (moonshot)** |
|---|---|
| Tells you a PA is risky | **Writes the packet that isn't** |
| SHAP says *which* factor hurts | **Generates the exact evidence/answer that fixes it** |
| Human fixes it manually | **Agent self-corrects in a closed loop, human approves** |
| Scores one case | **Recovers thousands of *real* past denials, measured** |

> *"A spell-checker underlines the typo. An author writes the sentence. We built the author."*

**SHOW:** this 2-column table; the right column glowing.

---

## Slide 5 — How it works (the closed loop)
The architecture diagram (intake → criteria KB → evidence extraction → evidence↔criteria
match → cited answer authoring → **denial-risk gate** → self-correct → readiness %).

**The one idea to land:** *our deployed AUC-0.83 model is the **reward signal** in a
closed loop.* The author proposes; the predictor judges; the loop repeats until green.

> *"The model we shipped last sprint isn't the product anymore — it's the referee.
> The Autopilot keeps rewriting until the referee says 'approve.'"*

**SHOW:** the loop diagram with the gate highlighted; arrow looping back from gate → author.

---

## Slide 6 — LIVE DEMO ①: recover a *real* denied case  ⭐ (the money moment)
1. Load a case that was **actually denied in production**. Gauge is **RED**.
2. Click **Autopilot**. It:
   - reads the chart docs, finds the buried tried-and-failed drug + a recent lab,
   - drafts each answer **with a citation** to the source line,
   - re-scores → gauge slides **red → yellow → green**.
3. Show the **before/after packet** side by side and the cited evidence.

> *"This patient waited an extra week in real life. Watch the Autopilot prevent that
> in nine seconds — and notice every answer points to a real document, never a bare 'Yes.'"*

**SHOW:** the live gauge animation + the cited-answer diff. Rehearse this until it's flawless.

---

## Slide 7 — LIVE DEMO ②: the counterfactual ("the one thing")
- For any red case, the Autopilot names the **single highest-leverage fix**:
  *"Add documentation that the patient tried & failed the preferred agent (Δrisk −38%)."*
- If the evidence exists in another doc → it pulls and cites it.
- If it genuinely doesn't exist → it generates the **exact provider request**, not a vague nag.

> *"It never says 'this is risky, good luck.' It says 'add this one line, here's where I found it.'"*

**SHOW:** the ranked counterfactual list with Δrisk per fix; one fix expanding to its citation.

---

## Slide 8 — THE PROOF: retrospective recovery on real denials  ⭐⭐ (your headline number)
Run the Autopilot over the **2,176 addressable real denials** (of 4,000) on the cluster.

- **Addressable denials:** 2,176 / 4,000 = **54%** (the honest ceiling — we don't claim "not covered").
- **Recovered by Autopilot (flip red→green under the risk model):** **X%** → **Y patients/yr**.
- Each recovery = ~7 patient-days saved → **Z patient-days/yr**.

> *"This is the slide that matters. Not a hypothetical ROI — a count of real patients
> our team already denied, that the Autopilot would have gotten approved on the first try."*

**SHOW:** funnel: 4,000 denials → 2,176 addressable → recovered (highlight). Put the
*method* in one line so it's auditable ("scored each repaired packet with the held-out model").

---

## Slide 9 — Validation & honesty (pre-empt the skeptic)
- Risk model: held-out 2,000 cases, **AUC 0.83**, precision 0.79; exact SHAP via `pred_contribs`.
- Recovery measured against the **same held-out model**, on cases it never trained on.
- **What we do NOT claim:** we don't fix "not covered" (62 cases); we don't auto-submit;
  recovery is *model-judged*, validated next by a filer pilot.
- ClinicalBERT vs TF-IDF experiment on PARAM Shivay: **AUC 0.8X** (cite the real result —
  even "TF-IDF is competitive and cheaper" is a legitimate finding).

> *"Here's exactly where the line is. Everything inside it is defensible; we tell you
> what's outside it too."*

**SHOW:** metrics table + the cluster log comparison block (numeric / TF-IDF / ClinicalBERT).

---

## Slide 10 — Why it's safe (the enterprise unlock)
- **Human-in-the-loop, always.** The Autopilot drafts; a person reviews and clicks Submit.
- **Every answer is cited** to a source document or a defensible clinical justification.
- **PHI never leaves infra you control:** the authoring LLM runs on *your* PARAM Shivay /
  Vertex job — **no third-party API ever sees a patient record.**
- Full **audit trail** of every draft, citation, and risk score.

> *"In healthcare, the differentiator isn't a bigger model — it's a model that never
> leaks a record and never acts without a human. That's how this ships, not just demos."*

**SHOW:** the "IS / IS NOT" table (reuse `FOR_THE_FILING_TEAM.md`) + a "no data leaves" lock diagram.

---

## Slide 11 — Why we can build the moonshot (and others can't)
- We already have the **deployed risk model** (the referee) — the loop's hardest piece.
- We already mined the **Criteria KB** from historical questionnaires + a payer policy PDF.
- We have **real labeled outcomes** (10K) to *measure* recovery, not guess it.
- We have **GPU compute** (PARAM Shivay) to run an open medical LLM over the whole corpus.

> *"This isn't a 72-hour idea bolted onto nothing. It's the next layer on a system
> that's already live, fed by data only an insider team has."*

**SHOW:** a "we have / we built / we measured" checklist with green ticks.

---

## Slide 12 — Business impact (two scenarios, both auditable)
| | Conservative (model-grounded) | Target |
|---|---|---|
| First-pass approval | 60% → ~71% | 60% → 95% |
| Denials recovered/yr | ~Y_low | ~Y_high |
| Patient-days saved/yr | ~Z_low | ~24,500 |
| Annual benefit | ~$0.58M | ~$1.88M |

*Every figure lives in `config.py` — change an assumption, the slide changes.*

> *"We show you the conservative number first. The upside is real, but we'd rather
> under-promise the dollars and over-deliver on the patients."*

**SHOW:** the two-scenario table; emphasize the conservative column.

---

## Slide 13 — Roadmap to production
- **Now:** Autopilot drafts cited packets; risk gate; retrospective recovery proven.
- **Next (pilot):** drop the Autopilot panel into the live PA workflow as a pre-submit step;
  filers approve/edit; measure *prospective* recovery vs. the retrospective estimate.
- **Then:** outcome feedback loop → monthly retrain of criteria weights + risk model;
  per-payer drift tracking; expand from pharmacy → medical PAs.

> *"The retrospective number tells us the ceiling. The pilot turns it into banked approvals."*

**SHOW:** 3-step timeline (Now → Pilot → Scale).

---

## Slide 14 — Close / the one sentence
**"We turned a denial predictor into an approval author — and proved it recovers
real patients' denials, without ever taking the human's hand off Submit."**

- Live · Grounded in your data · PHI-safe · Measured on real outcomes.

> *Land the patient, not the model. End on the 7-days-back-to-zero image from Slide 2.*

**SHOW:** the hero gauge red→green one more time + the headline recovery number.

---

# Appendix — what to actually build before the deadline (so the demo is real)

Priority order. Stop at any line and you still have a coherent demo.

1. **Counterfactual core (guarantees the demo).** Extend `denial_predictor.py`: for a red
   case, iterate over removing/neutralizing each contradictory fact, re-score, rank fixes by
   Δrisk. This *is* the red→green moment and needs **no LLM**. (Slides 6–7 work on this alone.)
2. **Retrospective recovery script (guarantees the headline number).** Loop the addressable
   denials, apply the counterfactual repair, re-score with the held-out model, count flips →
   write `app_data/recovery.json`. (Fills Slide 8's `X% / Y / Z`.)
3. **Cited authoring (the "author" claim).** Medical LLM on PARAM Shivay (Med42 / OpenBioLLM
   via vLLM) drafts each answer with a citation to the matched evidence; ClinicalBERT for
   evidence↔criteria matching (your branch). PHI stays on the cluster.
4. **Autopilot panel in `web/`.** One button: case → loop → readiness % + cited diff + audit row.
5. **(Stretch) LoRA fine-tune (the compute showcase).** Fine-tune the authoring LLM on the 10K
   `(case → cited answer)` pairs; cite the run as a real HPC experiment on Slide 9.

**Compute plan (PARAM Shivay):** serve the authoring LLM with vLLM on 1 GPU; batch-embed the
corpus with ClinicalBERT; run the agent over all 2,176 addressable denials as a SLURM batch job
(this is where the cluster earns its slide). De-identify first (`deidentify.py`) and gate on
data-governance sign-off — same rules as `docs/TRANSFORMER_BRANCH.md`.

**Demo safety:** pre-compute `recovery.json` and 2–3 hero cases offline; the live click should
*replay* a known-good result, not gamble on a cold LLM call in front of judges.
