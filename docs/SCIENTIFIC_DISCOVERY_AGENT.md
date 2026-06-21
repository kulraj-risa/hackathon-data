# Scientific Discovery Agent — Full Engineering Blueprint

**Author context:** IIT BHU final-year researcher, PARAM Shivay HPC access.
**Domain:** Adsorption / catalysis / materials (g-C3N4, tetracycline), electrolytes, MD + DFT.
**Goal:** An autonomous Materials & Drug Discovery Agent that reads literature, builds a knowledge graph + vector DB, predicts properties, ranks candidates, auto-generates QE/GROMACS inputs, and self-improves.

This is a build document, not advice. Every section gives schemas, concrete model names, repos, and code structure.

---

## SECTION 0 — Design principles (read first)

1. **Provenance is law.** Every extracted number carries `(paper_doi, page, sentence, char_span, extractor, confidence)`. No orphan facts in the KG.
2. **Two-store brain.** Symbolic memory = Knowledge Graph (Neo4j). Semantic memory = Vector DB (Qdrant). The agent queries both (GraphRAG).
3. **Structured extraction > free text.** LLMs output Pydantic-validated JSON, never prose, for any fact that enters the DB.
4. **Cheap-to-expensive funnel.** ML/GNN screens millions → ranks → only top-k go to DFT (QE) → validated hits go to MD (GROMACS). Active learning closes the loop.
5. **Everything is a tool.** QE, GROMACS, the GNN, the KG, the retriever are all callable tools behind one agent planner.
6. **Reproducible HPC.** Every simulation is a versioned input deck + SLURM script + provenance record.

---

## SECTION 1 — Complete system architecture

```
                         ┌───────────────────────────────────────────┐
                         │          ORCHESTRATION / AGENT LAYER         │
                         │  Planner (Qwen2.5-72B local) + Tool Router   │
                         │  ReAct loop: plan → call tool → observe →    │
                         │  reflect → act. LangGraph state machine.     │
                         └───┬───────────┬──────────┬─────────┬─────────┘
                             │           │          │         │
            ┌────────────────┘           │          │         └────────────────┐
            ▼                            ▼          ▼                          ▼
 ┌──────────────────┐        ┌────────────────┐ ┌──────────────┐   ┌────────────────────┐
 │  KNOWLEDGE LAYER  │        │  REASONING/RAG  │ │  PREDICTION   │   │  SIMULATION LAYER   │
 │  Neo4j (KG)       │◄──────►│  Hybrid + Graph │ │  GNN + XGB    │   │  QE (DFT) /         │
 │  Qdrant (vectors) │        │  RAG + reranker │ │  + foundation │   │  GROMACS (MD)       │
 └────────▲─────────┘        └───────▲────────┘ │  MLIP (MACE)  │   │  on PARAM Shivay    │
          │                          │           └──────▲───────┘   └─────────▲──────────┘
          │                          │                  │                     │
 ┌────────┴──────────────────────────┴──────────────────┴─────────────────────┴──────────┐
 │                              EXTRACTION / ETL LAYER                                      │
 │  PDF→text (GROBID + Nougat) │ NER (MatSciBERT/OpenMed/ChemDataExtractor) │ Relation     │
 │  extraction (LLM structured) │ Units (pint) │ Table parsing │ Dedup/entity resolution  │
 └────────────────────────────────────────▲────────────────────────────────────────────────┘
                                           │
 ┌─────────────────────────────────────────┴──────────────────────────────────────────────┐
 │                              INGESTION LAYER                                              │
 │  Harvesters: OpenAlex, arXiv, Semantic Scholar, Crossref, PubMed, ChemRxiv, Materials    │
 │  Project API, OQMD. Dedup by DOI. Store raw PDFs + metadata in object store + Postgres.   │
 └───────────────────────────────────────────────────────────────────────────────────────────┘

 CROSS-CUTTING:
   • Provenance store (Postgres)        • Object store (MinIO/filesystem) for PDFs + sim outputs
   • Experiment tracking (MLflow/W&B)   • Workflow engine (Prefect/Airflow) for batch ETL
   • Message/queue (Redis) for jobs     • FastAPI gateway for UI + programmatic access
```

### Data + control flow (end to end)
1. **Harvest** new papers (cron via Prefect) → store PDF + metadata in Postgres/MinIO.
2. **Parse** PDF → structured XML/JSON (GROBID for layout, Nougat for math/tables).
3. **Extract** entities + relations + numeric facts → Pydantic objects → provenance store.
4. **Load** into Neo4j (graph) + Qdrant (chunk + entity embeddings).
5. **Build dataset**: materialize `(material, property, value, conditions)` tuples → Parquet.
6. **Train** GNN + tabular models on the dataset + DFT/MD outputs.
7. **Agent query** ("find better tetracycline adsorbents than g-C3N4"): GraphRAG retrieves context, GNN screens candidates, agent ranks.
8. **Simulate**: agent generates QE/GROMACS inputs for top candidates → SLURM submit → parse outputs back into KG.
9. **Active learning**: new sim results + new papers retrain models. Loop.

### Microservice boundaries (deployable units)
| Service | Tech | Responsibility |
|---|---|---|
| `ingest-svc` | Python + Prefect | Harvest, dedup, store |
| `parse-svc` | GROBID (Docker) + Nougat (GPU) | PDF → structured |
| `extract-svc` | FastAPI + transformers + vLLM | NER + relation + numeric extraction |
| `kg-svc` | Neo4j + FastAPI | Graph CRUD + Cypher queries |
| `vector-svc` | Qdrant | Embedding store + ANN search |
| `predict-svc` | FastAPI + PyTorch + DGL | GNN/XGB inference + training jobs |
| `sim-svc` | FastAPI + SLURM REST/ssh | Input gen + job submit + output parse |
| `agent-svc` | LangGraph + vLLM (Qwen2.5) | Planner + tool router |
| `gateway` | FastAPI + React | Auth, UI, API |

## SECTION 2 — Knowledge graph design (Neo4j)

### Node labels
- `Paper {doi, title, year, venue, authors[], abstract, source, url}`
- `Material {id, formula, name, mp_id, space_group, structure_hash, dimensionality}`
- `Compound {id, name, smiles, inchikey, pubchem_cid, mol_formula}` (drugs/molecules/adsorbates, e.g. tetracycline)
- `Property {id, name, kind}`  (e.g. adsorption_energy, diffusion_coeff, bandgap)
- `Measurement {id, value, unit, value_si, uncertainty, method}`  (a single observed/computed datum)
- `Condition {id, temperature_K, pressure_Pa, pH, solvent, concentration}`
- `Method {id, name, kind}`  (DFT, MD, experiment) with sub-props
- `DFTParams {functional, pseudopotential, ecutwfc, ecutrho, kpoints, vdw, ucell}`
- `MDParams {forcefield, ensemble, timestep_fs, steps, thermostat, barostat, water_model}`
- `Author {id, name, orcid}` , `Method`, `Functional`, `Forcefield`, `Site/Facet {miller}`

### Relationship types (with properties carrying provenance)
```
(Paper)-[:REPORTS]->(Measurement)
(Measurement)-[:OF_PROPERTY]->(Property)
(Measurement)-[:FOR_MATERIAL]->(Material)
(Measurement)-[:OF_ADSORBATE]->(Compound)        // adsorption energy of X on Y
(Measurement)-[:UNDER_CONDITION]->(Condition)
(Measurement)-[:VIA_METHOD]->(Method)
(Measurement)-[:PROVENANCE {page, sentence, char_span, extractor, confidence}]->(Paper)
(Material)-[:ADSORBS {energy_eV, ref}]->(Compound)
(Material)-[:SIMILAR_TO {score, basis}]->(Material)   // from embeddings / structure
(Material)-[:DERIVED_FROM]->(Material)                // doping/defect/heterostructure
(Compound)-[:INTERACTS_WITH]->(Compound)
(Paper)-[:CITES]->(Paper)
(Author)-[:AUTHORED]->(Paper)
(Method)-[:USED_PARAMS]->(DFTParams|MDParams)
```

### Why this shape
- **Measurement as a first-class node** (not an edge property) lets one observation connect material + adsorbate + conditions + method + provenance simultaneously — essential for adsorption where energy depends on facet, coverage, solvent, functional.
- Enables queries like *"adsorption energy of tetracycline on g-C3N4 derivatives computed with vdW-DF functionals at neutral pH."*

### Key constraints / indexes (Cypher)
```cypher
CREATE CONSTRAINT paper_doi IF NOT EXISTS FOR (p:Paper) REQUIRE p.doi IS UNIQUE;
CREATE CONSTRAINT mat_id   IF NOT EXISTS FOR (m:Material) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT cmp_ikey IF NOT EXISTS FOR (c:Compound) REQUIRE c.inchikey IS UNIQUE;
CREATE INDEX meas_value    IF NOT EXISTS FOR (x:Measurement) ON (x.value_si);
CREATE INDEX prop_name     IF NOT EXISTS FOR (p:Property) ON (p.name);
```

### Example discovery query
```cypher
// Best (most negative) adsorption energies for tetracycline on g-C3N4-like materials
MATCH (c:Compound {name:'tetracycline'})<-[:OF_ADSORBATE]-(m:Measurement)
      -[:OF_PROPERTY]->(:Property {name:'adsorption_energy'}),
      (m)-[:FOR_MATERIAL]->(mat:Material)
WHERE mat.formula CONTAINS 'C3N4' OR (mat)-[:DERIVED_FROM*1..2]->(:Material {name:'g-C3N4'})
RETURN mat.formula, m.value_si AS Eads_eV, m.method, m.confidence
ORDER BY Eads_eV ASC LIMIT 25;
```

### Entity resolution (dedup) before insert
- Materials: canonicalize via `pymatgen` composition + structure matcher → `structure_hash`.
- Compounds: RDKit → canonical SMILES → InChIKey as the dedup key.
- Authors: ORCID > fuzzy name+affiliation.
- Measurements: dedup by `(material, adsorbate, property, value_si±tol, method, paper)`.

## SECTION 3 — Vector database design (Qdrant)

### Collections
| Collection | Vector | Payload (filters) | Purpose |
|---|---|---|---|
| `paper_chunks` | 768/1024-d | doi, year, section, has_table, source | Passage retrieval for RAG |
| `entity_cards` | 768-d | type(material/compound), formula, inchikey | Entity-centric retrieval / linking |
| `material_struct` | composition+structure emb (e.g. MatGL/M3GNet latent) | mp_id, dimensionality | Structure similarity search |
| `figures_tables` | CLIP/Nougat text emb | doi, caption | Find adsorption isotherm/RDF figures |

### Chunking strategy
- Parse to sections (Intro/Methods/Results). Chunk by **semantic units** (≈512 tokens, 64 overlap), but keep **tables and equations as atomic chunks** (don't split a table). Tag each chunk with section + whether it contains a numeric result.
- Store `entity_card` per resolved Material/Compound: a synthesized text blob (name, synonyms, formula, known properties, key sentences) → great for entity linking + GraphRAG hops.

### Embedding models (pick by collection)
- **Scientific text:** `BAAI/bge-m3` (multilingual, long-context, strong retrieval) or `intfloat/e5-large-v2`. For domain nuance: `allenai/specter2` (paper-level), `m3rg-iitd/matscibert` (materials text).
- **Chemistry-aware text:** `recobo/chemical-bert-uncased` or SciBERT as fallback.
- **Structures:** latent vectors from `M3GNet`/`MatGL` or `CGCNN` graph embedding.
- Run embeddings on PARAM Shivay GPU nodes in batch; cache to avoid recompute.

### Hybrid search config
- Dense (bge-m3) + sparse (BM25 via Qdrant `sparse vectors` / SPLADE) → fuse with RRF.
- Then **rerank top-50 → top-8** with a cross-encoder: `BAAI/bge-reranker-v2-m3` or `mixedbread-ai/mxbai-rerank-large-v1`.
- Always carry `doi`+`char_span` payload so the LLM can cite.

## SECTION 4 — Entity schema (Pydantic, the contract for all extraction)

```python
# schemas/entities.py
from enum import Enum
from typing import Optional, Literal
from pydantic import BaseModel, Field

class Provenance(BaseModel):
    paper_doi: str
    page: Optional[int] = None
    section: Optional[str] = None
    sentence: Optional[str] = None
    char_start: Optional[int] = None
    char_end: Optional[int] = None
    extractor: str                     # "matscibert-ner" | "qwen-structured" | "chemdataextractor"
    confidence: float = Field(ge=0, le=1)

class MaterialEntity(BaseModel):
    surface_form: str                  # text as written in paper
    formula: Optional[str] = None      # normalized via pymatgen
    name: Optional[str] = None         # e.g. "graphitic carbon nitride"
    mp_id: Optional[str] = None        # Materials Project id if linked
    dimensionality: Optional[Literal["0D","1D","2D","3D"]] = None
    dopants: list[str] = []
    facet: Optional[str] = None        # "(001)"
    provenance: Provenance

class CompoundEntity(BaseModel):
    surface_form: str
    name: Optional[str] = None
    smiles: Optional[str] = None
    inchikey: Optional[str] = None
    pubchem_cid: Optional[int] = None
    role: Literal["adsorbate","drug","solvent","electrolyte","catalyst","other"] = "other"
    provenance: Provenance

class PhysQuantity(BaseModel):
    raw_text: str                      # "-1.82 eV"
    value: float
    unit: str                          # original unit
    value_si: float                    # converted via pint
    unit_si: str
    uncertainty: Optional[float] = None

class Condition(BaseModel):
    temperature_K: Optional[float] = None
    pressure_Pa: Optional[float] = None
    pH: Optional[float] = None
    solvent: Optional[str] = None
    concentration_molar: Optional[float] = None
    coverage: Optional[float] = None

class MethodSpec(BaseModel):
    kind: Literal["DFT","MD","experiment"]
    # DFT
    functional: Optional[str] = None        # "PBE", "vdW-DF2", "HSE06"
    pseudopotential: Optional[str] = None
    ecutwfc_Ry: Optional[float] = None
    ecutrho_Ry: Optional[float] = None
    kpoints: Optional[str] = None           # "4x4x1"
    vdw_correction: Optional[str] = None    # "DFT-D3", "Grimme"
    # MD
    forcefield: Optional[str] = None        # "OPLS-AA", "CHARMM36", "GAFF"
    ensemble: Optional[str] = None          # "NVT","NPT"
    timestep_fs: Optional[float] = None
    n_steps: Optional[int] = None
    water_model: Optional[str] = None       # "SPC/E","TIP3P"

class PropertyType(str, Enum):
    adsorption_energy = "adsorption_energy"
    binding_energy = "binding_energy"
    diffusion_coeff = "diffusion_coeff"
    rdf_peak = "rdf_peak"
    msd_slope = "msd_slope"
    bandgap = "bandgap"
    formation_energy = "formation_energy"
    capacity = "adsorption_capacity"

class Measurement(BaseModel):
    property: PropertyType
    quantity: PhysQuantity
    material: Optional[MaterialEntity] = None
    adsorbate: Optional[CompoundEntity] = None
    condition: Condition = Condition()
    method: Optional[MethodSpec] = None
    provenance: Provenance
```

This schema is the single source of truth: NER/relation/LLM extractors must emit `Measurement` objects; the KG loader and dataset builder consume them. Validation failures are logged, never silently dropped.

## SECTION 5 — Paper ingestion pipeline

### Sources & APIs (all open / free for academics)
| Source | What | Access |
|---|---|---|
| **OpenAlex** | 250M+ works metadata + abstracts + OA links | REST, no key, polite pool with email |
| **arXiv** | cond-mat, physics, q-bio preprints + PDFs | OAI-PMH + bulk via Kaggle/S3 |
| **Semantic Scholar (S2)** | metadata, citations, TLDRs, embeddings | API key (free) |
| **Crossref** | DOI metadata, references | REST |
| **PubMed / PMC** | biomed full text (OA subset) | E-utilities |
| **ChemRxiv / bioRxiv** | preprints | API |
| **Materials Project** | computed properties + structures | API key (free) |
| **OQMD / AFLOW / NOMAD** | DFT datasets | API/bulk |

### Pipeline stages (Prefect flow)
```
harvest → dedup(DOI/title) → download_pdf → parse(GROBID) → math/table(Nougat)
  → segment(sections) → extract(NER+relation+numeric) → validate(Pydantic)
  → resolve(entities) → load(Neo4j + Qdrant) → dataset_build(Parquet) → notify
```

1. **Harvest** (`ingest/harvesters/*.py`): query each source by topic (`tetracycline adsorption`, `g-C3N4`, `electrolyte diffusion`, `DFT adsorption energy`). Save `RawPaper{doi,title,abstract,pdf_url,source,license}` to Postgres.
2. **Dedup**: normalize DOI; fuzzy title match (`rapidfuzz`) for preprint↔published pairs.
3. **Download**: respect licenses; OA PDFs to MinIO `pdfs/{doi}.pdf`. Keep license flag (only mine OA/your-entitled).
4. **Parse layout**: **GROBID** → TEI XML (title, sections, refs, affiliations). Robust, fast, CPU.
5. **Parse math/tables**: **Nougat** (Meta) on GPU for equations + tables → Markdown. Use for Results/SI tables where adsorption energies live.
6. **Segment**: map TEI/Markdown to `Section{type, text}`. Tag Methods vs Results.
7. **Extract** (Section 6/10): run NER + numeric + LLM structured extraction → `Measurement[]`.
8. **Validate + resolve**: Pydantic + pymatgen/RDKit canonicalization + dedup.
9. **Load**: upsert into Neo4j and Qdrant in one transaction-ish batch (idempotent on doi).
10. **Dataset build**: append validated tuples to versioned Parquet (Section 11).

### Throughput target
- GROBID: ~1–3 s/paper (CPU, parallel). Nougat: ~5–20 s/page (GPU) — only run on result pages, not whole PDF.
- On PARAM Shivay: parse 10k papers in a few hours with array jobs.

## SECTION 6 — NER models to use

Use a **layered ensemble** (each is good at different entity types). Run all, then merge spans by priority + confidence.

| Layer | Model / tool | Entities | Notes |
|---|---|---|---|
| Materials | `m3rg-iitd/matscibert` + MatSciBERT-NER (SOFC/Matscholar tags) | materials, properties, descriptors, apparatus | Best for inorganic/materials text |
| Materials | **MatBERT** (LBNL) | materials NER | Alternative encoder, strong on solid-state |
| Chemistry | **ChemDataExtractor 2** | chemical names, properties, units, **table parsing** | Rule+ML; excellent at numeric+unit+spec |
| Chemistry | `pruas/BENT-PubMedBERT-NER-Chemical` / ChemBERTa NER | chemical mentions | |
| Bio/drug | **BERN2** (or scispaCy `en_ner_bc5cdr_md`) | disease, drug, gene, chemical | For drug-discovery branch |
| General sci | scispaCy `en_core_sci_lg` | scientific noun phrases, abbreviations | Abbreviation resolution |
| Quantities | **quantulum3** + `pint` | numeric quantity + unit detection | Feeds PhysQuantity |
| Fallback | **Qwen2.5 structured extraction** | everything, relation-aware | When rule/NER misses; emits JSON |

**Merge policy:** ChemDataExtractor for chemical+quantity tables, MatSciBERT for materials/property mentions, scispaCy for abbreviation expansion, Qwen2.5 to assemble relations into `Measurement` objects and fill gaps. De-conflict overlapping spans by `confidence × layer_priority`.

**Entity linking after NER:** materials → Materials Project (`mp_id`); compounds → PubChem CID + RDKit InChIKey; properties → controlled vocabulary (your `PropertyType` enum).

## SECTION 7 — Best OpenMed models

OpenMed publishes 380+ specialized clinical/biomedical NER models on Hugging Face under the `OpenMed/` org (Apache-2.0). For the drug-discovery branch, pull these:

- `OpenMed/OpenMed-NER-PharmaDetect-*` — drug / pharmacologic substance NER.
- `OpenMed/OpenMed-NER-ChemicalDetect-*` — chemical entity NER (BC5CDR-style).
- `OpenMed/OpenMed-NER-DiseaseDetect-*` — disease/condition NER.
- `OpenMed/OpenMed-NER-GeneDetect-*` / `ProteinDetect` — gene/protein for target work.
- `OpenMed/OpenMed-NER-AnatomyDetect-*`, `SpeciesDetect-*` — context entities.

They come in size tiers (PubMedBERT/BioClinicalBERT/DeBERTa backbones). Strategy: use the **DeBERTa/large tier for accuracy in batch ETL**, the **base/PubMedBERT tier for low-latency interactive** queries. Combine with `bs4`/HF `pipeline("token-classification", aggregation_strategy="simple")`. Validate exact model card names on HF before pinning (versions change).

> For your **materials/adsorption** core, OpenMed is secondary — its strength is biomedical. Lead with MatSciBERT + ChemDataExtractor for materials; use OpenMed for the drug branch (tetracycline-as-pharmaceutical, toxicity, targets).

## SECTION 8 — Best open-source scientific models

### Language / text understanding
- **Qwen2.5-72B-Instruct** (you have it) — planner + structured extraction + reasoning. Serve with **vLLM**. Use `Qwen2.5-7B/14B` for cheap high-throughput extraction.
- **MatSciBERT**, **SciBERT**, **MatBERT** — encoders for materials/science NER + embeddings.
- **SPECTER2** (allenai) — paper-level embeddings for recommendation/dedup.
- **Galactica-6.7B** (optional) — scientific text; use cautiously, prefer Qwen2.5 for reliability.
- **Nougat** (facebook/nougat-base) — scientific PDF → markdown (math/tables).
- **GROBID** — bibliographic + layout parsing.

### Chemistry / molecules
- **ChemBERTa-2** (`DeepChem/ChemBERTa-77M-MLM`) — molecular property pretraining.
- **Uni-Mol / Uni-Mol2** — 3D molecular representation (binding, properties).
- **RDKit** — cheminformatics backbone (canonical SMILES, descriptors, fingerprints).
- **DeepChem** — molecular ML toolkit (GraphConv, AttentiveFP, splitters).

### Materials / interatomic potentials (the prediction engine core)
- **MACE** (`mace-mp-0` foundation MLIP) — universal ML force field; near-DFT energies/forces for screening + MD pre-relaxation. **This is your DFT accelerator.**
- **CHGNet** — universal MLIP w/ charge, great for relaxations.
- **M3GNet / MatGL** — MLIP + property models + structure embeddings.
- **ALIGNN** (NIST JARVIS) — SOTA crystal-graph property predictor.
- **CGCNN / MEGNet** — crystal graph property prediction baselines.
- **OCP / FairChem models** (Open Catalyst: GemNet-OC, EquiformerV2) — **directly relevant to adsorption energy** on surfaces; pretrained on OC20/OC22 adsorption data.

> **Key insight for you:** the Open Catalyst Project (FairChem) models are literally trained to predict **adsorption energies of adsorbates on catalyst surfaces** — start there for the adsorption-energy predictor and fine-tune on your g-C3N4/tetracycline data.

## SECTION 9 — RAG architecture (GraphRAG + hybrid)

```
User/Agent question
   │
   ▼
Query understanding (Qwen2.5): classify intent → {fact lookup | candidate search | synthesis}
   │                              extract entities → link to KG nodes
   ├──────────────► KG retrieval (Cypher): pull subgraph around linked entities
   │                  (materials, measurements, conditions, neighbors)
   ├──────────────► Vector retrieval (Qdrant hybrid dense+sparse) → top-50 chunks
   │                              │
   │                              ▼  rerank (bge-reranker-v2-m3) → top-8
   ▼
Context assembler: merge KG facts (as structured triples) + reranked passages
   │   (dedupe, sort by relevance + recency, attach citations doi+span)
   ▼
Generator (Qwen2.5-72B): answer ONLY from context, cite [doi], emit structured result if asked
   │
   ▼
Verifier pass: check every numeric claim has provenance; flag unsupported → re-retrieve
```

**Why GraphRAG, not plain RAG:** adsorption questions are multi-hop ("materials *derived from* g-C3N4 that adsorb *molecules similar to* tetracycline under *neutral pH*"). The KG answers the structured/relational part; vectors answer the fuzzy/textual part. Fuse both.

**Implementation:** LangGraph nodes for each box; retrievers as tools; enforce a JSON citation schema; cache embeddings + retrieval results in Redis.

## SECTION 10 — Automatic extraction of adsorption energy, RDF peaks, MSD, diffusion coefficients, temperatures

**Three-pass strategy per paper:**
1. **Rule/regex + units** (high precision, cheap) — catch canonical phrasings.
2. **NER + table parsing** (ChemDataExtractor / Nougat tables) — structured numerics.
3. **LLM structured extraction** (Qwen2.5) — context, relations, gap-filling — emits `Measurement`.

Then **normalize units with `pint`** and validate physical ranges.

### 10.1 Adsorption energy (E_ads)
- **Cues:** "adsorption energy", "binding energy", "E_ads", "ΔE_ads", "−1.82 eV", "kJ/mol", "kcal/mol".
- **Regex seed:**
```python
import re
E_ADS = re.compile(
  r"(?:adsorption|binding)\s+energ(?:y|ies)[^.\n]{0,60}?"
  r"(-?\d+\.?\d*)\s*(eV|kJ\s*/?\s*mol|kcal\s*/?\s*mol)", re.I)
```
- **Relation step (LLM):** given the sentence + table, fill `{adsorbate, material, facet, functional, vdw, value, unit}`. Convert to eV (`pint`: 1 eV = 96.485 kJ/mol).
- **Sanity range:** physisorption ~ −0.1 to −0.6 eV; chemisorption ~ −0.6 to −5 eV. Flag |E|>10 eV.

### 10.2 RDF peaks (g(r))
- **Cues:** "radial distribution function", "g(r)", "first peak at", "Å", "coordination number".
- Extract `{pair (e.g. O–H), r_peak_angstrom, g_max, coordination_number}`.
```python
RDF = re.compile(r"g\(r\)[^.\n]{0,80}?(?:peak|maximum)[^.\n]{0,40}?(\d+\.?\d*)\s*(Å|nm|angstrom)", re.I)
```
- **From your own MD (preferred ground truth):** compute with **MDAnalysis** `InterRDF` from GROMACS trajectories — don't rely only on paper text for your data.

### 10.3 MSD (mean squared displacement)
- **Cues:** "mean squared displacement", "MSD", "slope", "linear regime", "ps/ns".
- Extract `{species, msd_slope, time_units, fit_range}`.
- **From MD:** MDAnalysis `EinsteinMSD`; slope of MSD vs t in the linear regime.

### 10.4 Diffusion coefficient (D)
- **Cues:** "diffusion coefficient", "self-diffusion", "D =", "×10⁻⁹ m²/s", "cm²/s".
- **Relation:** D = slope/(2·d_dim) (Einstein), d_dim = 3 for bulk. Extract `{species, D, unit, temperature_K, method}`.
```python
DIFF = re.compile(r"diffusion\s+coefficient[^.\n]{0,60}?(\d+\.?\d*)\s*[x×]?\s*10\^?(-?\d+)?\s*(cm\^?2/s|m\^?2/s)", re.I)
```
- Normalize all to m²/s. Tie to temperature (Arrhenius later).

### 10.5 Temperature & conditions
- **Cues:** "at 298 K", "300 K", "25 °C", "NPT", "NVT", "1 bar", "pH 7".
- Convert °C→K. Attach to the parent `Measurement.condition`.
```python
TEMP = re.compile(r"(\d{2,4}(?:\.\d+)?)\s*(K|°?C)\b")
```

### 10.6 DFT / MD parameters (Methods section mining)
- DFT: functional (PBE/vdW-DF/HSE), `ecutwfc`, k-points ("4×4×1"), pseudopotential, vdW (D3).
- MD: forcefield (OPLS/CHARMM/GAFF), ensemble, timestep, water model, steps.
- These populate `MethodSpec` → critical for comparing apples-to-apples adsorption energies.

### 10.7 Extraction QA
- Hold out 50 hand-annotated papers → measure precision/recall per property.
- Keep only `confidence ≥ τ` (tune per property) into the *training* dataset; keep lower-confidence in KG flagged `provisional`.

## SECTION 11 — Building a scientific dataset from papers

### Target table (the "fact table", versioned Parquet via DVC)
```
adsorption_dataset.parquet
─────────────────────────────────────────────────────────────────────
material_formula | material_mp_id | adsorbate_inchikey | adsorbate_name |
property         | value_si | unit_si | uncertainty |
temperature_K | pH | solvent | coverage |
method_kind | functional | vdw | ecutwfc_Ry | kpoints |
forcefield | ensemble | water_model |
source(paper|dft|md|exp) | paper_doi | confidence | extracted_at | provenance_id
```

### Pipeline
1. Materialize from Neo4j: `MATCH (m:Measurement)-...-> RETURN flattened rows`.
2. **Featurize materials** (`matminer` + `pymatgen`): composition descriptors (Magpie), structure features (if structure known), or graph (for GNN).
3. **Featurize adsorbates** (RDKit): descriptors + Morgan fingerprints + (optional) Uni-Mol 3D embeddings.
4. **Clean:** unit normalization, dedup, outlier flags, missing-value strategy.
5. **Split smartly:** scaffold split (molecules) / composition or structure-based split (materials) to avoid leakage — never random for materials.
6. **Provenance join:** keep `provenance_id` to trace any row back to a sentence.

### Multi-fidelity labels
Tag each row with fidelity: `experiment > high-level DFT (HSE/vdW) > PBE > MLIP > literature-text`. Train multi-fidelity models or weight by fidelity + confidence.

### Data sources to merge with literature
- **Open Catalyst (OC20/OC22)** — millions of adsorption-energy DFT labels (huge head start).
- **Materials Project / OQMD / JARVIS** — formation energies, bandgaps, structures.
- **Your own DFT (QE) + MD (GROMACS)** outputs — the highest-value, in-domain labels.

## SECTION 12 — Training predictive models

### Model zoo (train all, ensemble)
1. **Tabular baseline:** XGBoost/LightGBM on matminer+RDKit features → fast, interpretable, strong baseline for E_ads regression.
2. **Crystal GNN:** ALIGNN / CGCNN / M3GNet for structure→property.
3. **Adsorption-specific GNN:** fine-tune **FairChem (GemNet-OC / EquiformerV2)** on OC20 → fine-tune on your data.
4. **Molecular GNN:** AttentiveFP / Uni-Mol for adsorbate-side representation.
5. **Foundation MLIP:** **MACE-MP-0 / CHGNet** for energies/forces (screening + relaxations), no task-specific training needed initially.

### Training recipe (adsorption-energy regressor)
- Loss: MAE/Huber on E_ads (eV). Target MAE < 0.2 eV to be DFT-useful.
- Normalize per fidelity; include condition features (T, pH, functional one-hot).
- **Cross-validation:** group K-fold by material family (no leakage across doped variants).
- **Uncertainty:** deep ensembles (5 seeds) or MC-dropout / evidential regression → needed for active learning.
- Track with **MLflow/W&B**: hyperparams, splits, metrics, model artifacts, data version (DVC hash).

### Active learning loop (the self-improvement engine)
```
candidates → GNN predicts E_ads + uncertainty
           → acquisition (e.g. expected improvement or high-uncertainty-near-good)
           → top-k → QE DFT (ground truth)
           → add labels → retrain GNN → repeat
```
This is exactly how you "rank candidates before expensive DFT" (Section requirement 11) and "continuously improve" (12).

### Transfer learning path
OC20-pretrained → fine-tune on g-C3N4 surfaces → few-shot adapt to tetracycline/adsorbates. Freeze backbone early, unfreeze gradually.

## SECTION 13 — Graph Neural Network architecture

### Recommended primary: ALIGNN-style (line graph + atom graph) for crystals, plus a dual-graph for adsorbate@surface.

```
INPUT: atomic structure (surface slab + adsorbate) → graph G
  nodes = atoms (features: Z, electronegativity, group, period, oxidation, init charge)
  edges = bonds/neighbors within r_cut (features: distance via RBF expansion, optional angles)

(1) Atom graph G  +  (2) Line graph L(G) (nodes=bonds, edges=bond-pairs sharing an atom → angles)

For l in layers (4–6):
    ALIGNN block:
        edge-gated graph conv on L(G)  → update angle/bond features
        edge-gated graph conv on G     → update atom/bond features (uses updated bonds)
        residual + batchnorm + SiLU

Global pooling (mean/attention over atoms)
   → MLP head → E_ads (scalar)   [+ optional forces head]
   → uncertainty via deep ensemble / evidential layer
```

### For adsorption specifically (use this in production)
Adopt **EquiformerV2 / GemNet-OC** (equivariant) from FairChem:
- E(3)-equivariant message passing handles 3D geometry + forces correctly.
- Inputs: adsorbate placed on surface; outputs energy (+ forces → relaxation).
- Pretrained on OC20 (relaxed adsorption energies) → fine-tune.

### Encoders feeding the agent / KG
- The GNN's **pooled graph embedding** also goes into Qdrant `material_struct` for similarity search ("find materials structurally similar to best adsorbents").

### Frameworks
- **DGL** or **PyG** (PyTorch Geometric). FairChem uses PyG. JARVIS-ALIGNN has its own package. Use **`alignn`**, **`fairchem-core`**, **`matgl`** (for M3GNet/MEGNet) directly rather than reimplementing.

### Hyperparameters (starting point)
- r_cut = 8 Å (surfaces), max_neighbors = 12, RBF bins = 80, hidden = 256, layers = 4, lr = 5e-4 (cosine), batch = 32, epochs = 100–300, early stop on val MAE.

## SECTION 14 — Combining Knowledge Graph + RAG + LLM + DFT + MD

The agent is a **tool-using planner** (LangGraph) over these tools:

```python
TOOLS = {
  "kg_query":        cypher_search,          # structured facts / relationships
  "doc_retrieve":    graphrag_retrieve,      # passages + citations
  "predict_eads":    gnn_predict,            # GNN ensemble: value + uncertainty
  "screen_candidates": ml_screen,            # XGB/GNN over candidate generator
  "gen_qe_input":    make_qe_deck,           # build pw.x input from structure+params
  "submit_dft":      slurm_submit_qe,        # PARAM Shivay job
  "parse_dft":       parse_qe_output,        # → Measurement → KG
  "gen_gromacs":     make_gmx_inputs,        # topology+mdp from structure
  "submit_md":       slurm_submit_gmx,
  "analyze_md":      mdanalysis_rdf_msd,     # RDF, MSD, D → Measurement → KG
}
```

### Canonical agent workflow: "Find a better tetracycline adsorbent than g-C3N4"
```
1. PLAN (Qwen2.5): decompose → (a) get baseline E_ads(g-C3N4, tetracycline) from KG,
                                (b) propose candidate modifications, (c) screen, (d) DFT-verify.
2. kg_query: baseline E_ads + conditions + provenance.
3. doc_retrieve: literature on g-C3N4 doping/heterostructures for adsorption.
4. candidate generation: enumerate dopants/defects/heterojunctions (rules + LLM + KG analogs).
5. predict_eads (GNN ensemble): rank candidates by predicted E_ads, keep uncertainty.
6. acquisition: pick top-k by (predicted improvement, uncertainty).
7. gen_qe_input + submit_dft: QE relax + adsorption-energy calc for top-k on PARAM Shivay.
8. parse_dft → write Measurements to KG (provenance = "agent-dft-run-{id}").
9. For best DFT hits: gen_gromacs + submit_md → analyze_md (RDF/MSD/D in solvent).
10. retrain GNN with new DFT labels (active learning). Report ranked candidates + evidence + sim decks.
```

### State & memory
- Short-term: LangGraph state (current goal, intermediate results).
- Long-term: KG (facts) + Qdrant (text) + MLflow (models) + object store (sim outputs).
- Every agent action that produces a number writes a provenanced `Measurement`.

## SECTION 15 — Using PARAM Shivay efficiently

PARAM Shivay (IIT BHU, C-DAC): CPU nodes (2× Intel Xeon, ~40 cores) + GPU nodes (NVIDIA V100). SLURM scheduler, module environment, Lustre scratch. Plan around that.

### Partitioning the workload
| Workload | Where | How |
|---|---|---|
| GROBID parsing | CPU nodes | array jobs, 1 paper/task, embarrassingly parallel |
| Nougat OCR | GPU nodes | batch pages; only result/SI pages |
| LLM extraction (Qwen2.5) | GPU nodes (V100) | vLLM server; 7B/14B for throughput, 72B sharded for hard cases |
| Embeddings | GPU nodes | batched bge-m3 |
| GNN training | GPU nodes | DDP across GPUs; mixed precision |
| QE (DFT) | CPU nodes (MPI) | `pw.x` with MPI+OpenMP; many independent jobs = array |
| GROMACS (MD) | GPU nodes | GPU-accelerated mdrun + MPI |

### SLURM patterns
**DFT array job (screen many candidates):**
```bash
#!/bin/bash
#SBATCH -J qe_screen
#SBATCH -p standard            # CPU partition
#SBATCH -N 1 --ntasks-per-node=40
#SBATCH -t 12:00:00
#SBATCH --array=0-199%20       # 200 candidates, 20 concurrent
module load qe/7.2 intel-oneapi-mpi
CAND=$(sed -n "$((SLURM_ARRAY_TASK_ID+1))p" candidates.list)
cd runs/$CAND
mpirun -np 40 pw.x -in scf.in > scf.out
mpirun -np 40 pw.x -in relax.in > relax.out
```

**GROMACS GPU job:**
```bash
#!/bin/bash
#SBATCH -J gmx_md -p gpu --gres=gpu:1
#SBATCH -N 1 --ntasks-per-node=8 -t 24:00:00
module load gromacs/2023-gpu cuda
gmx grompp -f md.mdp -c npt.gro -p topol.top -o md.tpr
gmx mdrun -deffnm md -nb gpu -bonded gpu -pme gpu -ntmpi 1 -ntomp 8
```

**vLLM serving (extraction/agent):**
```bash
#SBATCH -p gpu --gres=gpu:2 -t 48:00:00
module load cuda python/3.11
vllm serve Qwen/Qwen2.5-14B-Instruct --tensor-parallel-size 2 --port 8000 --max-model-len 32768
```

### Efficiency rules
- **MLIP pre-relax before DFT:** relax structures with MACE/CHGNet (seconds) → start QE near the minimum → cut DFT steps 2–5×.
- **GNN screen first:** only DFT the top ~1–5% of candidates. This is the whole point of the funnel.
- **Convergence tests once:** fix `ecutwfc`/k-points per material family, reuse — don't reconverge every job.
- **Scratch hygiene:** run on Lustre `$SCRATCH`, archive only parsed results + final structures back to project store.
- **Checkpoint everything** (QE restart, GROMADS `cpt`, training ckpts) — respect wall-time limits with requeue.
- **Job DB:** track every SLURM job in Postgres `(job_id, candidate, status, paths, provenance)` so the agent can poll and parse on completion.

## SECTION 16 — How many papers before training

Depends on the target, not a single number. Concrete thresholds:

| Milestone | Papers (full-text mined) | Extracted labeled rows | What you can do |
|---|---|---|---|
| KG + RAG bootstrap | 300–1,000 | ~1–3k facts | Working GraphRAG, entity linking, demo |
| First tabular E_ads model | ~2,000–5,000 | 3k–8k clean E_ads rows | XGBoost baseline, MAE ~0.3–0.5 eV |
| First useful GNN (in-domain) | 5,000–15,000 | 10k–30k rows | ALIGNN/fine-tuned FairChem, MAE → ~0.2 eV |
| Robust screening model | 20,000+ | 50k+ rows | Reliable ranking, active learning pays off |

**Critical shortcut:** you do **not** need literature alone. **OC20/OC22 (millions of adsorption labels)** + Materials Project + JARVIS give you a pretrained model *today*; literature mining (hundreds–thousands of papers) is for **in-domain fine-tuning** on g-C3N4/tetracycline where a few hundred high-quality rows materially help. And **your own QE/MD runs** are the highest-value labels — 200–1000 well-chosen DFT points via active learning often beats 10k noisy literature rows.

**Rule of thumb:** start GraphRAG at ~500 papers; start fine-tuning once you have ~1–2k *clean, provenanced* in-domain labels; rely on active-learning DFT to push accuracy after that.

## SECTION 17 — Roadmap

### Week 1 — Skeleton + ingestion proof
- Stand up Neo4j, Qdrant, Postgres, MinIO (docker-compose locally).
- `ingest-svc`: OpenAlex + arXiv harvester for your topics → 500 papers.
- GROBID parsing + section segmentation working.
- Pydantic `Measurement` schema + regex extractors for E_ads/T (Section 10).
- Load 500 papers into KG + Qdrant. Basic GraphRAG answer with citations.
- **Deliverable:** ask "what's the reported adsorption energy of tetracycline on g-C3N4?" and get cited answers.

### Month 1 — Extraction + RAG + baseline model
- Add Nougat (tables/math), ChemDataExtractor, MatSciBERT NER ensemble.
- LLM structured extraction via Qwen2.5 (vLLM on Shivay). 2–5k papers ingested.
- Entity resolution (pymatgen/RDKit/Materials Project linking).
- Build first `adsorption_dataset.parquet`; train XGBoost E_ads baseline.
- Full GraphRAG agent (LangGraph) with kg_query + doc_retrieve tools.
- **Deliverable:** dataset + baseline model + agent that answers multi-hop questions.

### Month 3 — Prediction + simulation integration
- Fine-tune FairChem/ALIGNN on OC20 → your data; deep-ensemble uncertainty.
- `sim-svc`: auto-generate QE inputs from structures + params; SLURM submit + parse back to KG.
- MACE/CHGNet pre-relaxation in the loop.
- Candidate generation (dopants/defects/heterostructures) + GNN screening + ranking.
- First **active-learning DFT cycle** on PARAM Shivay.
- **Deliverable:** agent proposes + ranks candidates, runs DFT on top-k, ingests results.

### Month 6 — Autonomous loop + publishable system
- GROMACS MD integration (RDF/MSD/D via MDAnalysis → KG).
- Closed active-learning loop (retrain on new DFT/MD automatically).
- Multi-fidelity modeling; benchmark vs held-out experiments.
- Web UI (FastAPI + React) dashboards: KG explorer, candidate leaderboard, provenance viewer.
- Write up: methods + benchmark + a discovered candidate validated by DFT/MD.
- **Deliverable:** end-to-end autonomous discovery demo + paper draft + startup-ready MVP.

## SECTION 18 — Folder structure

```
scidiscovery/
├── README.md
├── pyproject.toml                 # uv/poetry; pinned deps
├── docker-compose.yml             # neo4j, qdrant, postgres, minio, redis, grobid
├── .env.example
├── configs/
│   ├── sources.yaml               # OpenAlex/arXiv/S2 queries + topics
│   ├── extraction.yaml            # thresholds, model names
│   ├── dft/qe_defaults.yaml       # ecutwfc, kpoints, pseudos per family
│   ├── md/gromacs_defaults.yaml
│   └── hpc/slurm.yaml             # partitions, accounts, modules
├── schemas/
│   ├── entities.py                # Pydantic (Section 4)
│   └── kg_schema.cypher           # constraints/indexes (Section 2)
├── src/scidiscovery/
│   ├── ingest/
│   │   ├── harvesters/{openalex.py,arxiv.py,s2.py,crossref.py,pubmed.py}
│   │   ├── dedup.py
│   │   └── store.py               # Postgres + MinIO
│   ├── parse/
│   │   ├── grobid_client.py
│   │   ├── nougat_runner.py
│   │   └── segment.py
│   ├── extract/
│   │   ├── ner_ensemble.py        # MatSciBERT/OpenMed/scispaCy
│   │   ├── chemdataextractor_adapter.py
│   │   ├── numeric.py             # regex + quantulum3 + pint
│   │   ├── llm_structured.py      # Qwen2.5 → Measurement JSON
│   │   └── resolve.py             # pymatgen/RDKit/MP/PubChem linking
│   ├── kg/
│   │   ├── loader.py              # upsert to Neo4j
│   │   └── queries.py             # Cypher templates
│   ├── vector/
│   │   ├── embed.py               # bge-m3 / specter2 / matscibert
│   │   ├── index.py               # Qdrant collections
│   │   └── hybrid_search.py       # dense+sparse+rerank
│   ├── rag/
│   │   ├── graphrag.py
│   │   └── verifier.py
│   ├── dataset/
│   │   ├── build.py               # KG → Parquet (DVC tracked)
│   │   ├── featurize.py           # matminer + RDKit + graphs
│   │   └── splits.py              # scaffold/structure splits
│   ├── models/
│   │   ├── tabular.py             # XGBoost/LightGBM
│   │   ├── gnn_alignn.py
│   │   ├── fairchem_adapter.py    # OC20 fine-tune
│   │   ├── mlip.py                # MACE/CHGNet wrappers
│   │   └── uncertainty.py
│   ├── sim/
│   │   ├── qe/{input_gen.py,parse.py,pseudos.py}
│   │   ├── gromacs/{input_gen.py,parse.py}
│   │   ├── mdanalysis_metrics.py  # RDF/MSD/D
│   │   └── slurm.py               # submit/poll/parse
│   ├── agent/
│   │   ├── planner.py             # LangGraph
│   │   ├── tools.py               # tool registry (Section 14)
│   │   └── candidate_gen.py
│   └── api/
│       ├── main.py                # FastAPI gateway
│       └── routers/
├── workflows/                     # Prefect flows
│   ├── ingest_flow.py
│   ├── extract_flow.py
│   └── active_learning_flow.py
├── hpc/
│   ├── slurm/{qe_array.sbatch,gmx_md.sbatch,vllm_serve.sbatch,grobid_array.sbatch}
│   └── env/modules.sh
├── data/                          # DVC-tracked; raw stays in MinIO
│   ├── raw/  ├── parsed/  ├── datasets/  └── runs/
├── notebooks/                     # EDA, benchmark, figures
├── tests/
└── docs/
```

## SECTION 19 — Exact Python stack

```toml
# pyproject.toml (key deps; pin exact versions when installing)
[project]
requires-python = ">=3.11"
dependencies = [
  # ingestion / parsing
  "pyalex", "arxiv", "habanero", "biopython", "requests", "rapidfuzz",
  "grobid-client-python", "nougat-ocr", "unstructured", "pymupdf", "lxml",
  # NLP / extraction
  "transformers", "torch", "sentence-transformers", "spacy", "scispacy",
  "chemdataextractor2", "quantulum3", "pint", "rdkit", "datasets", "accelerate",
  "vllm",                                  # serve Qwen2.5
  # knowledge graph / vectors / storage
  "neo4j", "qdrant-client", "sqlalchemy", "psycopg2-binary", "minio", "redis",
  # agent / RAG
  "langgraph", "langchain", "langchain-community", "tiktoken",
  # materials / chemistry ML
  "pymatgen", "matminer", "ase", "matgl", "alignn", "fairchem-core",
  "mace-torch", "chgnet", "dgl", "torch-geometric", "deepchem",
  # MD analysis
  "MDAnalysis", "mdtraj",
  # modeling / tracking / workflow
  "scikit-learn", "xgboost", "lightgbm", "numpy", "pandas", "polars",
  "mlflow", "wandb", "dvc", "prefect",
  # api
  "fastapi", "uvicorn", "pydantic>=2",
]
```
Infra (Docker): Neo4j 5.x, Qdrant, Postgres 16, MinIO, Redis, GROBID 0.8.x.
HPC modules: `qe/7.x`, `gromacs/2023-gpu`, `cuda`, `intel-oneapi-mpi`, `python/3.11`.

## SECTION 20 — Exact repos & models to use today

### Models (Hugging Face)
- `Qwen/Qwen2.5-72B-Instruct`, `Qwen/Qwen2.5-14B-Instruct`, `Qwen/Qwen2.5-7B-Instruct` — agent + extraction.
- `m3rg-iitd/matscibert` — materials encoder/NER.
- `allenai/scibert_scivocab_uncased`, `allenai/specter2_base` — sci text + paper embeddings.
- `BAAI/bge-m3` + `BAAI/bge-reranker-v2-m3` — retrieval + rerank.
- `facebook/nougat-base` — PDF→markdown (math/tables).
- `DeepChem/ChemBERTa-77M-MLM` — molecular pretraining.
- `OpenMed/OpenMed-NER-PharmaDetect-*`, `...-ChemicalDetect-*`, `...-DiseaseDetect-*` — drug branch NER.
- `pruas/BENT-PubMedBERT-NER-Chemical`, scispaCy `en_core_sci_lg` + `en_ner_bc5cdr_md`.

### Repos / packages
- **PDF/parse:** `kermitt2/grobid`, `facebookresearch/nougat`, `Unstructured-IO/unstructured`.
- **Chem extraction:** `CambridgeMolecularEngineering/chemdataextractor2`, `rdkit/rdkit`.
- **Materials ML:** `materialsvirtuallab/matgl` (M3GNet/MEGNet), `usnistgov/alignn`, `txie-93/cgcnn`, `FAIR-Chem/fairchem` (OC20/22 GemNet-OC, EquiformerV2), `ACEsuit/mace`, `CederGroupHub/chgnet`.
- **Materials data:** `materialsproject/api` (mp-api), `hackingmaterials/matminer`, `materialsproject/pymatgen`, JARVIS-Tools (`usnistgov/jarvis`), OC datasets via fairchem.
- **MD analysis:** `MDAnalysis/mdanalysis`, `mdtraj/mdtraj`.
- **Agent/RAG:** `langchain-ai/langgraph`, `qdrant/qdrant`, `neo4j/neo4j`.
- **Serving/HPC:** `vllm-project/vllm`, `PrefectHQ/prefect`, `iterative/dvc`, `mlflow/mlflow`.
- **Datasets to download now:** Open Catalyst OC20/OC22 (adsorption energies), Materials Project, OQMD, JARVIS-DFT.

### Day-1 action list
1. `docker compose up` Neo4j + Qdrant + Postgres + MinIO + GROBID + Redis.
2. Harvest 500 papers (OpenAlex: "tetracycline adsorption", "g-C3N4 adsorption", "electrolyte diffusion DFT").
3. GROBID-parse → segment → run E_ads/T regex + Qwen2.5 structured extraction → load KG/Qdrant.
4. Wire LangGraph agent with `kg_query` + `doc_retrieve`; verify cited multi-hop answers.
5. `pip install fairchem-core`, load an OC20-pretrained model, predict E_ads on a g-C3N4 slab + tetracycline as a smoke test.
6. Write your first QE input generator + a 1-candidate SLURM array job on PARAM Shivay.

---

## Research / startup framing
- **Novel contribution (publishable):** an autonomous, provenance-grounded GraphRAG + active-learning loop that couples literature mining to DFT/MD for adsorption discovery — benchmark extraction F1, GNN MAE vs DFT, and #DFT-runs-saved by ML pre-screening.
- **Moat (startup):** the curated, provenanced adsorption KG + in-domain fine-tuned models + the automated QE/GROMACS deck generator. Data + workflow compounding over time.
- **First wins to show:** (1) reproduce a known g-C3N4/tetracycline E_ads from literature via the agent; (2) propose a doped/heterostructured variant the GNN ranks better; (3) confirm with a DFT run on Shivay. That triad is a demo *and* a paper figure.

