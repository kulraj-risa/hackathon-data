# Graph DB / Knowledge-Graph & Retrieval Study

**Question we set out to answer:** can a knowledge graph / graph-RAG approach —
specifically RISA's own [`patient-medical-graph` (PMG)](https://github.com/risa-labs-inc/patient-medical-graph)
plus the wider open-source research — make our denial-prevention engine better?

**Short answer: yes, and the highest-leverage move is to stop treating our
criteria KB and patient evidence as text blobs and start treating them as a
graph.** We prototyped two pieces of this and measured a real lift on the
historic 10k PAs. The biggest structural insight is that PMG already solves the
*patient* half of the problem extremely well, and is missing exactly the
*coverage* half that we have built — so the two are complementary, not competing.

---

## 0. TL;DR (measured, not hand-wavy)

| Change | Metric | Baseline (today) | Graph approach | Result |
|---|---|---|---|---|
| Coverage matcher (DB1↔DB2) | AUC of readiness→approval | **0.632** (content-word overlap) | **0.664** (semantic + negation/exclusion, analog signal) | **+0.032** |
| Historical intel (DB3) | AUC / accuracy | XGBoost ≈ 0.84 (opaque) | **0.794 / 0.713** (explainable k-NN, with neighbor provenance) | competitive **and explainable** |
| Criteria→PMG | coverage of PA drugs | string match, 22 drugs | shared `:Drug`/`:OntologyConcept` nodes, RxNorm-normalized | structural, not just accuracy |

Reproduce: `python eval_graph_kb.py --n 4000 --k 25` (uses `graph_kb.py`, no Neo4j needed).

> Honesty note: the coverage-matcher lift is modest on *this* dataset because the
> historic facts are free-text Q&A with **no coded values** (no LOINC/ICD/RxCUI in
> the rows). The graph's real advantage — exact coded matching like `BMI ≥ 30`
> against a LOINC-coded vital — can't show up until evidence is coded, which is
> precisely what PMG ingestion produces. So the prototype *understates* the win.

---

## 1. What PMG actually is (deep dive)

PMG is a **fully-implemented Neo4j Patient Memory Graph** — far more than a demo.
Cloned and inspected: `pmg/src/pmg/{models,retrieval,services,ingestion,cypher_llm}`.

### 1.1 Schema — patient-centric, FHIR-coded
Node labels actually used in Cypher (frequency-ranked): `Patient`, `ConditionState`,
`Encounter`, `MedicationState`, `Drug`, `Condition`, `LabResult`, `VitalSign`,
`PriorAuthRequest`, `Insurance`/`Insurer`, `OntologyConcept`, `Document`,
`Prescriber`. Relationships: `PRESCRIBED`, `DIAGNOSED`, `TREATS`, `HAS_PA_REQUEST`,
`HAS_DECISION`, `CONTRAINDICATES`, `HAS_LAB`, `MAPS_TO` (→ ontology), `RISK_FOR`,
`SIDE_EFFECT`, `INSTANCE_OF` (per-patient instance → shared canonical node).

Crucially, the criteria models are **coded and operator-based** (`pmg/models/query_criteria.py`):

```python
VitalCriteria(code="39156-5", operator=">=", value=30)   # BMI ≥ 30 (LOINC)
LabCriteria(code="4548-4", operator=">", value=8.0)      # HbA1c > 8 (LOINC)
DrugCriteria(name="Metformin", status="active")          # RxCUI-aware
ConditionCriteria(icd_code="E11")                         # ICD/SNOMED
```

Each `*.to_cypher_condition()` compiles to a `WHERE` clause. `CohortQuery` ANDs
them and runs against the patient graph. **This is exactly the deterministic,
explainable coverage check our `criteria_kb._overlap` is a fuzzy approximation of.**

### 1.2 Retrieval — production hybrid GraphRAG
`pmg/src/pmg/retrieval/retrieval_service.py` implements: query understanding →
**vector candidate retrieval** → **k-hop graph expansion** → **salience scoring +
rerank** → **EvidencePack** builder, with **contradiction detection** and
**stale-data warnings**. The output `EvidencePack.to_prompt_context()`
(`pmg/models/evidence_pack.py`) is a clean, structured, citation-ready DB1 context
— strictly better than the flat fact lists our `db1_patient_evidence` emits today.

### 1.3 Population analytics — a graph-native DB3
`services/population_analytics_service.py` runs **Neo4j GDS**: PageRank,
**community detection** (patient cohorts), **patient similarity (k-NN)**,
drug–condition associations, and projects a graph that *includes PA outcomes*.
This is our "historical approval intelligence" as a graph: find patients like
this one, see their PA outcomes for this drug, and read off the distinguishing
factors — with the actual neighbor cases as provenance.

### 1.4 The gap (= our contribution)
PMG has **no `Criterion`, `CoveragePolicy`, or payer-requirement nodes** and no
`REQUIRES`/`SATISFIES` edges. It models the patient beautifully and the *payer
rulebook not at all*. Our mined criteria KB + payer policies are exactly that
missing **coverage layer**. Integration story: attach our coverage subgraph to
PMG's existing `:Drug` / `:Condition` / `:OntologyConcept` nodes via shared keys.

---

## 2. Open-source research landscape (what to borrow)

| Work | What it gives us | Where it plugs in |
|---|---|---|
| **MedGraphRAG** ([arXiv 2408.04187](https://arxiv.org/html/2408.04187), [code](https://github.com/MedicineToken/Medical-Graph-RAG)) | Triple Graph Construction (user data → medical sources → UMLS vocab) + **U-Retrieval** for **source-cited** answers | Clinical-Answering & Final-Justification agents: every claim cites a graph node/source |
| **Multi-Agent Medical Necessity Justification** ([ACL BioNLP 2024](https://aclanthology.org/2024.bionlp-1.4/)) | GPT-4 hits **86.2%** checklist-item w/ evidence, **95.6%** overall judgment | Direct benchmark + validation of our multi-agent + coverage-matrix design; target numbers |
| **PrimeKG** ([Nature Sci Data](https://www.nature.com/articles/s41597-023-01960-3), [code](https://github.com/mims-harvard/PrimeKG)) | 129k nodes / 4M edges; drug–disease **indication / contraindication / off-label** edges; MONDO ontology; clinical-guideline text | Enrich DB2 with mechanism + contraindication edges → powers MechanismAgent, catches "off-label = denial" |
| **Adaptive PA policy retrieval as RL/MDP** ([arXiv 2604.05125](https://www.arxiv.org/pdf/2604.05125)) | Cost-aware "retrieve-more vs decide" policy; **CQL 92%** | Future: learned PayerStrategy retrieval instead of static top-K |
| **Auto medical-indicator KG via RAG+LLM** ([arXiv 2511.13526](https://arxiv.org/html/2511.13526)) | Guideline-driven acquisition + ontology schema + **expert-in-the-loop** | Hardening of `criteria_miner` → graph with HITL validation |
| **Microsoft GraphRAG / Neo4j GraphRAG** (cited throughout PMG's `research_docs`) | Community-summary global retrieval; LangChain/LangGraph + Neo4j patterns | Reference architecture for the graph + LLM orchestration |
| **OHDSI OMOP CDM / SNOMED / RxNorm / LOINC** | Standard vocabularies & entity resolution | Normalize our 312 free-text drug names → RxCUI so criteria actually match |

---

## 3. Concrete improvements, mapped to our system

Priority = (impact × how-cheap). H/M/L effort.

1. **[H impact, M effort] Replace content-word overlap with the graph coverage matcher.**
   Done as a prototype (`graph_kb.py`): semantic similarity + negation +
   exclusion-criterion handling + critical-weighting, emitting a continuous
   `coverage_signal` with per-criterion provenance. Already +0.032 AUC; more once
   evidence is coded.

2. **[H impact, M effort] Use PMG's `RetrievalService` as DB1.** Swap our
   `db1_patient_evidence` text-dump for PMG's `EvidencePack` (contradiction-aware,
   salience-ranked, citation-ready). Strictly better context for every agent.

3. **[H impact, M effort] Graph DB3 via patient similarity.** Prototyped
   (`eval_graph_kb.py` Part B): k-NN over case features → empirical approval rate
   **with the neighbor cases as the explanation**. In production this is PMG GDS
   `compute_patient_similarity` / community detection over the PA-outcome graph.
   Keep XGBoost as a second opinion; the graph gives the *why*.

4. **[H impact, L effort] RxNorm-normalize drug names.** Only 22 of 312 distinct
   meds match a KB drug today. Mapping to RxCUI (OMOP/RxNorm) is the cheapest
   single coverage win and is a prerequisite for graph joins.

5. **[M impact, M effort] MedGraphRAG-style cited justifications.** Make
   Final-Justification cite specific `(:Criterion)`/`(:Document)` nodes — turns the
   appeal letter from "LLM says" into "graph-traceable evidence", which is the
   compliance bar payers/auditors want.

6. **[M impact, H effort] Enrich DB2 with PrimeKG edges** (indication /
   contraindication / off-label) so MechanismAgent reasons over real
   drug–disease structure, not just text.

7. **[L now, H later] RL-based cost-aware policy retrieval** (arXiv 2604.05125)
   once we have logged retrieval trajectories.

---

## 4. What we prototyped (runnable today)

- **`graph_kb.py`** — `ClinicalKnowledgeGraph`: an in-memory, **PMG-schema-compatible**
  coverage graph (`Drug → REQUIRES → Criterion`, `Payer → PUBLISHES → CoveragePolicy
  → FOR_DRUG → Drug`) loaded from our existing `criteria_kb_merged.json`
  (**265 nodes, 281 edges, 199 criteria**). `match_case()` is a drop-in replacement
  for `criteria_kb.match_case` with scored, provenance-bearing statuses.
  `Neo4jPMGAdapter` emits the exact Cypher (`MERGE` upserts + a single-traversal
  `coverage_query_cypher()`) to fold this onto a live PMG instance — so the
  in-memory prototype is a genuine on-ramp, not a throwaway.

- **`eval_graph_kb.py`** — head-to-head on the historic 10k PAs:
  Part A (coverage signal AUC, graph vs overlap) and Part B (graph DB3 k-NN
  with neighbor provenance). Numbers in §0.

No new heavy dependencies (TF-IDF + cosine via the already-present scikit-learn,
with a pure-python fallback). Runs in the slim serving container.

---

## 5. Recommended roadmap

- **Phase 0 (now, shipped):** in-memory graph coverage matcher + graph DB3 +
  measured lift. Wire `graph_kb.match_case` behind a flag in `necessity_engine`.
- **Phase 1:** RxNorm/OMOP normalization of drugs & conditions; stand up PMG Neo4j
  (the repo ships Docker + FastAPI); ingest our criteria as the coverage layer via
  `Neo4jPMGAdapter`.
- **Phase 2:** route DB1 through PMG `RetrievalService` (EvidencePack); add a Neo4j
  vector index on criterion embeddings; coverage match becomes one Cypher query.
- **Phase 3:** MedGraphRAG-style cited justifications; PrimeKG mechanism edges;
  GDS-based DB3 (similarity + community PA-outcome rates).
- **Phase 4:** learned, cost-aware policy retrieval (offline RL).

---

## 6. Risks & honest limitations

- **Coded evidence is the unlock.** The graph's killer feature (exact
  `BMI ≥ 30` / `HbA1c > 8` matching) needs coded inputs; the historic dataset is
  free text. PMG ingestion produces the codes — until then the lift is modest.
- **Coverage of the criteria KB** (22 drugs) limits Part A's sample (223 cases).
  Expanding the KB + RxNorm normalization matters more than matcher cleverness.
- **Neo4j is operational weight.** The in-memory graph is the right call for the
  hackathon; the adapter keeps the migration honest and cheap.
- **k-NN DB3 is competitive but not strictly better than XGBoost on AUC** — its
  value is **explainability** (neighbor provenance), so run them together.
