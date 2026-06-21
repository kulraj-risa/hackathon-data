# Roadmap — From Denial Prediction → Evidence Intelligence → Touchless

This roadmap captures the strategy for maximizing pharmacy-PA approvals by
attacking the *addressable* denials with clinical-criteria intelligence and
document-grounded answers.

---

## 1. The core insight: triage denials by addressability

Not all denials are fixable. Split them first:

| Denial type | Addressable? | What we do |
|---|---|---|
| **Not covered under plan** (formulary exclusion) | ❌ No | The plan won't cover this drug. Can't fix with docs — must re-initiate the PA via a different form / pursue an alternative agent or exception. Flag early, don't waste effort. |
| **Step therapy required** | ✅ Yes | Document prior trial & failure of the preferred agent(s). |
| **Medical necessity not met** | ✅ Yes | Provide clinical evidence that meets the payer's criteria. |

**Worked example:** of ~30% denials, if ~10% are "not covered" (lost cause), the
remaining ~20% (step-therapy + medical-necessity) are **winnable by answering the
clinicals correctly with proper documentation.** That 20% is the target.

**Metric this creates:** *Addressable Approval Lift* = approvals recovered from the
ST + MN buckets. This is the honest ceiling — we don't claim to fix "not covered."

---

## 2. To win the addressable 20%, two hard problems

1. **What evidence is required?** We need the **clinical criteria** for this
   drug + this payer + this diagnosis (the step-therapy rules, lab thresholds,
   indication, etc.).
2. **Do we have the documents that prove it?** Patient docs live in **many
   categories / sub-categories**. We must identify *which* docs satisfy *which*
   criterion — that needs document intelligence.

And a rule that governs both: **every questionnaire answer must be backed by a
real document OR a defensible clinical justification** — approval-oriented, never
a bare "Yes."

---

## 3. How to extract clinical criteria (the central question)

Criteria come from five sources, in priority order. The first two need **no
external data** — we already have them.

### Source A — Historical CMM questionnaires  ⭐ ✅ BUILT (`criteria_miner.py`)
Each past PA's `questions[]` array **is the payer's criteria, operationalized into
questions.** So:
- Group historical cases by **(drug, payer, diagnosis)**.
- The **recurring question set** for a group = the criteria template.
- Cross-reference each question's answer with the **outcome** → learn *which
  answers drive approval*.
- Output: a data-driven **Criteria Checklist** per drug/payer, with each item
  tagged Critical vs Supporting. **Zero external dependency — buildable today.**

### Source B — Approved-case evidence patterns ⭐ ✅ BUILT (`criteria_miner.py`)
For a (drug, payer), take the **Approved** PAs and extract the supportive facts
that recur → "what a winning packet looks like." Use as the gold target to aim a
new case at.

### Source C — Payer medical-policy documents (authoritative) ⏳ PENDING DOCS
Highest-fidelity criteria, but needs the policy docs (we don't have them yet). Plan:
1. **Acquire** — ask the team for the payer policy PDFs for the in-scope (drug, payer)
   pairs; many are also public on payer sites (UHC/Optum, Cigna, Aetna, BCBS) and
   CMS NCD/LCD. Land them in Firebase Storage / `gs://` under the rapids project.
2. **Chunk** — PDF → text (pdfjs/PyMuPDF) → section-aware chunks.
3. **Extract** — a medical LLM (Phase 3) pulls structured criteria: indication,
   step-therapy sequence, lab thresholds (e.g., ferritin/TSAT for IV iron), trial
   duration, contraindications — each as a `Checklist` statement + recency rule.
4. **Tag** `source="payer_policy"`, `critical=True`, and key by (drug, payer).
   The merged KB already reserves the slot: `sources.payer_policy=false` flips true.

### Source D — Drug label / compendia (FDA) ✅ BUILT (`fda_criteria.py`)
`openFDA` drug-label API → FDA-approved indications, dosing, contraindications,
boxed warnings. Public, no PHI. 20/22 drugs matched (Dexcom/Freestyle are CGM
devices, not in the drug-label DB). Used as the authoritative indication/dosing anchor.

### Source E — Combine → Criteria Knowledge Base ✅ BUILT (`build_criteria_kb.py`)
Merges A/B/D into a per-drug KB shaped to RISA's `Checklist` model (statement +
`evidences{positive,negative}` + critical/`minimumRequired` + source). Output:
`app_data/criteria_kb_merged.json` → synced to Firestore (see §7). Source C plugs
into the reserved `payer_policy` slot when docs arrive; keying extends to
**(drug, payer, diagnosis)** once payer-level criteria exist.

---

## 4. The Evidence Intelligence Engine (target architecture)

```
Input: drug + diagnosis + payer
   │
   ▼
[1] Criteria Checklist        ← Criteria KB (Section 3)
   │   "what evidence is required + recency rules"
   ▼
[2] Evidence→Document Mapping ← document-classification schema (Aamer's structure)
   │   map each criterion to patient-doc categories, retrieve candidates
   ▼
[3] Document Intelligence     ← OpenMed NER + medical LLM
   │   extract evidence, match to criteria → FOUND / MISSING
   ▼
[4] Answer Generation
   │   answer each question with a CITED doc, else a justification; never bare "Yes"
   ▼
[5] Denial-risk gate          ← our deployed XGBoost model (AUC 0.83)
   │   score the assembled packet; confidence-gated routing
   ▼
Output: PA Readiness % + Found/Missing + denial-risk decision (touchless/review/block)
```

This is the same pipeline as the Evidence Intelligence diagram — now fed by the
Criteria KB and gated by our risk model.

---

## 5. Implementation plan (phased)

### Phase 1 — Denial triage + criteria mining  *(BUILT — existing data)*
- [x] `denial_triage.py` — classifies denials over contradictory-fact language.
      **Result on `training_data` (4,000 denials):** Medical-necessity 49%, step-therapy 5%,
      not-covered 2%, unclear 10%, **no-evidence-captured 34%**.
      → **~54% of denials are addressable** (≈22 pts of the 40% denial rate winnable).
      Writes `app_data/triage.json`.
- [x] `criteria_miner.py` — mines per-drug question templates + approved/denied
      evidence patterns (Sources A & B) → `app_data/criteria_kb.json` (22 drugs ≥8 cases).
- [x] `fda_criteria.py` — Source D: openFDA label indication/dosing/contraindication
      for the same drugs (20/22 matched) → `app_data/fda_criteria.json`.
- [x] `build_criteria_kb.py` — Source E: merges A/B/D into the unified KB shaped to
      the `Checklist` model → `app_data/criteria_kb_merged.json` (67 criteria, 20 FDA-anchored).
- [x] `firestore_sync.py` — pushes the KB to Firestore `rapids-platform/risa-denial-hackathon`
      (`criteria_kb/{drug}`, `meta/kb_summary`, `meta/triage`).
- [ ] Surface in dashboard: "addressable denial rate" + per-drug criteria checklist.

### Phase 2 — Document intelligence  *(needs Aamer's doc schema + patient docs)*
- [ ] Integrate the **document-classification structure from Aamer** (NOT in the
      repo yet — obtain it). Map criteria → doc categories.
- [ ] `extract_evidence.py` — OpenMed Clinical NER over patient docs → structured
      entities (Drug, Dosage, Test, Test_Result, Disease, Date…).
- [ ] Match extracted evidence ↔ criteria → Found / Missing.

### Phase 3 — Approval-oriented answer generation  *(needs medical LLM)*
- [ ] Medical LLM (BioMistral 7B / Med42 v2 8B via vLLM) drafts each answer with a
      **cited document** or a **clinical justification**; flags any unsupported "Yes".
- [ ] Pull authoritative criteria from payer policy (Source C) + FDA label (Source D).

### Phase 4 — Close the loop
- [ ] Feed outcomes back (`/api/outcome`) → retrain criteria weights + risk model;
      track payer-criteria drift per (drug, payer).

---

## 6. Open dependencies (need from the team)
- **Aamer's document-classification structure** — referenced but not in the repo. Needed for Phase 2 mapping.
- **Access to patient documents** — confirmed to live in Firestore (`rapids-platform/pharmacy`,
  e.g. `orders/{caseId}` + Firebase Storage); need governance sign-off and the doc-category
  taxonomy. Keep PHI off shared infra (OpenMed on-device de-id) for Phase 2.
- **Payer medical-policy documents** for the drugs/payers in scope (Source C).
- Confirmation of the **denial-reason field** (or reliable text signal) to validate the triage labels.

---

## 7. Criteria KB storage (Firestore — rapids-platform)

The KB lives in an **isolated** Firestore database so experiments never touch the
prod `pharmacy` / `(default)` data:

- **Project:** `rapids-platform`  ·  **Database:** `risa-denial-hackathon`
- `criteria_kb/{drug}` — unified per-drug record (criteria list, FDA anchor,
  approval rate, source flags), shaped to the `Checklist` model.
- `meta/kb_summary` — drug/criteria counts, sources, build time.
- `meta/triage` — addressable-denial summary from `denial_triage.py`.

Rebuild + publish pipeline (all PHI-free — aggregate criteria text + public FDA data):
```
criteria_miner.py  →  fda_criteria.py  →  build_criteria_kb.py  →  firestore_sync.py
   (A + B)              (D)                 (E merge)                (publish)
```
This Firestore DB is also the experimentation/training store: the app reads the KB
for the per-drug checklist, and outcomes (`/api/outcome`) can be written back here to
retrain criteria weights (Phase 4).
```
