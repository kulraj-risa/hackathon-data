"""Graph-backed Criteria Knowledge Base — a PMG-compatible upgrade path.

Why this exists
---------------
Our serving matcher (`criteria_kb.match_case`) scores a case's evidence against a
drug's criteria checklist with *content-word overlap* — a transparent heuristic
that is brittle: synonyms miss, negations slip through, and a 2-word overlap
threshold both over- and under-fires.

RISA already ships a far better substrate: the **Patient Memory Graph (PMG)** — a
Neo4j knowledge graph with FHIR-coded patient nodes (Drug/Condition/LabResult/
PriorAuthRequest/OntologyConcept) and a hybrid GraphRAG retriever. PMG is entirely
*patient-side*; it has **no Criterion / CoveragePolicy / Payer-requirement nodes**.

This module is the missing half: a small, dependency-light **clinical knowledge
graph** that
  1. loads our mined criteria + payer policies into typed, PMG-style nodes,
  2. matches evidence to criteria with *semantic* similarity + negation/
     contradiction awareness (a faithful, in-memory stand-in for PMG's
     vector_search + graph_expansion), and
  3. exposes a `Neo4jPMGAdapter` that emits the exact Cypher to fold this
     subgraph onto a live PMG instance via shared Drug/Condition nodes.

It is deliberately runnable today (no Neo4j, no network) so we can *measure* the
lift over content-word overlap before committing to the full graph backend.
See `eval_graph_kb.py` for the head-to-head evaluation, and
`docs/GRAPH_KB_RESEARCH.md` for the architecture + open-source research behind it.
"""

from __future__ import annotations

import json
import math
import re
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

try:
    from denial_engine.core.config import APP_DATA_DIR
except Exception:  # pragma: no cover - allow standalone use
    APP_DATA_DIR = Path(__file__).resolve().parent / "app_data"

_KB_PATH = APP_DATA_DIR / "criteria_kb_merged.json"

# --------------------------------------------------------------------------- #
# PMG-compatible graph primitives                                             #
# --------------------------------------------------------------------------- #
# Labels intentionally mirror the live PMG schema where they overlap (Drug,
# Condition, Payer, PriorAuthRequest) and *extend* it with the coverage layer
# PMG lacks (CoveragePolicy, Criterion). This is what makes the graph a drop-in.
PATIENT_LABELS = {"Patient", "Drug", "Condition", "LabResult", "PriorAuthRequest"}
COVERAGE_LABELS = {"Payer", "CoveragePolicy", "Criterion"}


@dataclass
class Node:
    uid: str
    label: str
    props: dict[str, Any] = field(default_factory=dict)


@dataclass
class Edge:
    src: str
    rel: str
    dst: str
    props: dict[str, Any] = field(default_factory=dict)


# --------------------------------------------------------------------------- #
# Lightweight text vectorizer (TF-IDF cosine) with graceful fallback          #
# --------------------------------------------------------------------------- #
_NEG = re.compile(
    r"\b(no|not|never|without|denies|denied|negative|absence|absent|ruled out|"
    r"r/o|free of|none|non[- ]?)\b",
    re.I,
)
_WORD = re.compile(r"[a-z][a-z0-9\-]{2,}")
_STOP = {
    "the", "and", "for", "with", "that", "this", "are", "has", "have", "was",
    "will", "drug", "patient", "request", "requested", "least", "used", "use",
    "been", "from", "any", "all", "not", "does", "did", "per", "via", "into",
    "your", "their", "its", "than", "when", "what", "which", "would", "could",
    "should", "must", "each", "such", "also", "more", "most", "some", "other",
    "being", "they", "them", "member", "drugs", "yes", "applies",
}


def _toks(text: str) -> list[str]:
    return [t for t in _WORD.findall(str(text).lower()) if t not in _STOP]


class _TfidfCosine:
    """Tiny TF-IDF + cosine. Uses sklearn when present, else a pure-python IDF.

    Kept self-contained so graph_kb works in the slim serving container even if
    sklearn is unavailable; sklearn is only a speed/quality nicety here.
    """

    def __init__(self) -> None:
        self._sk = None
        self._matrix = None
        self._idf: dict[str, float] = {}
        self._docs: list[dict[str, float]] = []

    def fit(self, corpus: list[str]) -> "_TfidfCosine":
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer

            self._sk = TfidfVectorizer(
                tokenizer=_toks, preprocessor=lambda x: x, token_pattern=None,
                ngram_range=(1, 2), min_df=1, sublinear_tf=True,
            )
            self._matrix = self._sk.fit_transform(corpus)
        except Exception:
            self._sk = None
            n = len(corpus) or 1
            df: dict[str, int] = {}
            tokenised = [set(_toks(d)) for d in corpus]
            for s in tokenised:
                for t in s:
                    df[t] = df.get(t, 0) + 1
            self._idf = {t: math.log((1 + n) / (1 + c)) + 1 for t, c in df.items()}
            self._docs = [self._vec(d) for d in corpus]
        return self

    def _vec(self, text: str) -> dict[str, float]:
        counts: dict[str, float] = {}
        for t in _toks(text):
            counts[t] = counts.get(t, 0.0) + 1.0
        vec = {t: (1 + math.log(c)) * self._idf.get(t, 1.0) for t, c in counts.items()}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {t: v / norm for t, v in vec.items()}

    def similarity(self, query: str, doc_indices: Iterable[int]) -> dict[int, float]:
        """Cosine similarity of `query` against the fitted docs at doc_indices."""
        doc_indices = list(doc_indices)
        if self._sk is not None:
            from sklearn.metrics.pairwise import cosine_similarity

            qv = self._sk.transform([query])
            sims = cosine_similarity(qv, self._matrix[doc_indices])[0]
            return {idx: float(s) for idx, s in zip(doc_indices, sims)}
        qv = self._vec(query)
        out: dict[int, float] = {}
        for idx in doc_indices:
            dv = self._docs[idx]
            small, big = (qv, dv) if len(qv) < len(dv) else (dv, qv)
            out[idx] = float(sum(v * big.get(t, 0.0) for t, v in small.items()))
        return out


# --------------------------------------------------------------------------- #
# The clinical knowledge graph                                                #
# --------------------------------------------------------------------------- #
class ClinicalKnowledgeGraph:
    """In-memory typed graph holding the *coverage* layer (Drug→Criterion→Payer).

    Mirrors PMG node/edge conventions so the same objects serialize straight to
    Cypher (see Neo4jPMGAdapter). Patient nodes are added per-match at query time.
    """

    def __init__(self) -> None:
        self.nodes: dict[str, Node] = {}
        self.edges: list[Edge] = []
        self._by_label: dict[str, list[str]] = {}
        # criterion uid -> index into the fitted vectorizer corpus
        self._crit_index: dict[str, int] = {}
        self._corpus: list[str] = []
        self._vec = _TfidfCosine()
        self._fitted = False

    # -- graph construction ------------------------------------------------- #
    def add_node(self, uid: str, label: str, **props: Any) -> Node:
        if uid not in self.nodes:
            self.nodes[uid] = Node(uid, label, dict(props))
            self._by_label.setdefault(label, []).append(uid)
        else:
            self.nodes[uid].props.update(props)
        return self.nodes[uid]

    def add_edge(self, src: str, rel: str, dst: str, **props: Any) -> None:
        self.edges.append(Edge(src, rel, dst, dict(props)))

    def nodes_with_label(self, label: str) -> list[Node]:
        return [self.nodes[u] for u in self._by_label.get(label, [])]

    def neighbors(self, uid: str, rel: str | None = None) -> list[Node]:
        return [
            self.nodes[e.dst]
            for e in self.edges
            if e.src == uid and (rel is None or e.rel == rel) and e.dst in self.nodes
        ]

    # -- loading our mined KB ---------------------------------------------- #
    def load_criteria_kb(self, kb: dict[str, Any] | None = None) -> "ClinicalKnowledgeGraph":
        kb = kb if kb is not None else (json.loads(_KB_PATH.read_text()) if _KB_PATH.exists() else {})
        for drug, entry in kb.items():
            drug_uid = f"Drug:{drug}"
            self.add_node(
                drug_uid, "Drug", name=drug,
                approval_rate=entry.get("approval_rate"),
                n_cases=entry.get("n_cases"),
                fda_indications=(entry.get("fda") or {}).get("indications", ""),
            )
            for i, c in enumerate(entry.get("criteria", [])):
                cu = f"Criterion:{drug}:{i}"
                ev = c.get("evidences") or {}
                self.add_node(
                    cu, "Criterion",
                    statement=c["statement"],
                    critical=bool(c.get("critical")),
                    source=c.get("source"),
                    positive_evidence=ev.get("positive", ""),
                    negative_evidence=ev.get("negative", ""),
                )
                self.add_edge(drug_uid, "REQUIRES", cu, critical=bool(c.get("critical")))
                # index the criterion text (+ its canonical positive evidence) for
                # semantic matching — this is the vector "anchor" for the node.
                anchor = f"{c['statement']} {ev.get('positive', '')}".strip()
                self._crit_index[cu] = len(self._corpus)
                self._corpus.append(anchor)
            # payer policy nodes (coverage layer PMG lacks)
            for pname, pol in (entry.get("payer_policies") or {}).items():
                pu = f"Payer:{pname}"
                self.add_node(pu, "Payer", name=pname)
                pol_uid = f"CoveragePolicy:{drug}:{pname}"
                self.add_node(
                    pol_uid, "CoveragePolicy", drug=drug, payer=pname,
                    policy_number=(pol or {}).get("policy_number"),
                    source_url=(pol or {}).get("source_url"),
                    step_therapy=(pol or {}).get("step_therapy"),
                )
                self.add_edge(pu, "PUBLISHES", pol_uid)
                self.add_edge(pol_uid, "FOR_DRUG", drug_uid)
        if self._corpus:
            self._vec.fit(self._corpus)
            self._fitted = True
        return self

    # -- the upgrade: semantic, contradiction-aware coverage match ---------- #
    # Thresholds calibrated on the historic set (see eval_graph_kb.py); a
    # criterion fires MET only on real semantic alignment, not 2 shared words.
    SIM_MET = 0.18
    SIM_TOUCH = 0.10

    def match_case(
        self,
        drug: str | None,
        supportive_texts: list[str] | None,
        contradictory_texts: list[str] | None,
        *,
        patient_uid: str | None = None,
    ) -> dict[str, Any] | None:
        """Graph coverage match. Drop-in compatible with criteria_kb.match_case
        but returns *scored, provenance-bearing* statuses instead of word counts.
        """
        if not drug or not self._fitted:
            return None
        drug = _norm_drug(drug)
        drug_uid = f"Drug:{drug}"
        if drug_uid not in self.nodes:
            return None

        sup = [t for t in (supportive_texts or []) if str(t).strip()]
        con = [t for t in (contradictory_texts or []) if str(t).strip()]
        crit_nodes = self.neighbors(drug_uid, "REQUIRES")

        # add an ephemeral Patient + Evidence subgraph (PMG-style) for provenance
        pu = patient_uid or "Patient:_query"
        self.add_node(pu, "Patient")
        self.add_edge(pu, "HAS_PA_REQUEST", drug_uid)

        items: list[dict[str, Any]] = []
        met = at_risk = 0
        weighted_sum = weight_tot = 0.0
        for cn in crit_nodes:
            idx = self._crit_index[cn.uid]
            sup_score, sup_fact = self._vec.similarity_best(sup, idx, self._vec) if sup else (0.0, "")
            con_score, con_fact = self._vec.similarity_best(con, idx, self._vec) if con else (0.0, "")
            statement = cn.props["statement"]
            critical = cn.props["critical"]
            # Exclusion criteria ("NOT covered for...", "contraindicated in...") are
            # satisfied by ABSENCE of evidence; a supportive-fact hit there is a risk,
            # not coverage. PMG would model these as CONTRAINDICATES edges.
            is_exclusion = bool(re.search(r"not covered|exclud|contraindicat|must not|ineligible", statement, re.I))
            # negation in a supportive fact that hits the criterion = unmet requirement
            negated = bool(sup_fact and _NEG.search(sup_fact)) and sup_score >= self.SIM_TOUCH

            if is_exclusion:
                # hitting an exclusion with patient evidence => AT_RISK; else neutral MET
                if sup_score >= self.SIM_MET and not negated:
                    status, evidence, score = "AT_RISK", sup_fact, sup_score
                    at_risk += 1
                else:
                    status, evidence, score = "MET", "", 0.0
                    met += 1
            elif con_score >= self.SIM_TOUCH and con_score >= sup_score:
                status, evidence, score = "AT_RISK", con_fact, con_score
                at_risk += 1
            elif negated:
                status, evidence, score = "AT_RISK", sup_fact, sup_score
                at_risk += 1
            elif sup_score >= self.SIM_MET:
                status, evidence, score = "MET", sup_fact, sup_score
                met += 1
            else:
                status, evidence, score = "UNVERIFIED", sup_fact if sup_score >= self.SIM_TOUCH else "", sup_score

            # continuous, critical-weighted coverage signal (kept analog, not binned):
            # supportive lift minus contradictory penalty per criterion.
            if not is_exclusion:
                contrib = max(sup_score, 0.0) - max(con_score, 0.0) - (0.15 if negated else 0.0)
                w = 2.0 if critical else 1.0
                weighted_sum += w * contrib
                weight_tot += w

            items.append({
                "criterion_uid": cn.uid,
                "statement": statement,
                "critical": critical,
                "source": cn.props.get("source"),
                "status": status,
                "evidence": evidence,
                "match_score": round(float(score), 3),
            })

        total = len(items) or 1
        critical_unmet = sum(1 for i in items if i["critical"] and i["status"] != "MET")
        coverage_signal = (weighted_sum / weight_tot) if weight_tot else 0.0
        return {
            "drug": drug,
            "engine": "graph_kb",
            "approval_rate": self.nodes[drug_uid].props.get("approval_rate"),
            "readiness_pct": round(met / total * 100),
            # analog signal in [~-1, 1] rescaled to 0-100; carries more order than MET-counts
            "coverage_signal": round(50 + 50 * max(-1.0, min(1.0, coverage_signal / 0.4)), 1),
            "met": met,
            "at_risk": at_risk,
            "unverified": total - met - at_risk,
            "total": total,
            "critical_unmet": critical_unmet,
            "criteria": items,
            "note": "Graph coverage match (semantic similarity + negation/contradiction/"
                    "exclusion awareness over a PMG-compatible Drug→Criterion subgraph).",
        }


# attach a helper to _TfidfCosine for best-of-many matching (kept here to avoid
# threading the corpus through the matcher signature)
def _similarity_best(self, facts: list[str], crit_idx: int, _self) -> tuple[float, str]:
    best, best_fact = 0.0, ""
    for f in facts:
        s = self.similarity(f, [crit_idx]).get(crit_idx, 0.0)
        if s > best:
            best, best_fact = s, f
    return best, best_fact


_TfidfCosine.similarity_best = _similarity_best  # type: ignore[attr-defined]


def _norm_drug(name: str) -> str:
    return re.split(r"[\s/0-9]", str(name).strip(), maxsplit=1)[0].title()


# --------------------------------------------------------------------------- #
# Neo4j / PMG drop-in adapter                                                 #
# --------------------------------------------------------------------------- #
class Neo4jPMGAdapter:
    """Emits Cypher that folds the coverage subgraph onto a live PMG instance.

    The coverage layer attaches to PMG's existing `(:Drug)` and `(:Condition)`
    nodes via shared keys, so a PA request in PMG can be matched against criteria
    with a single Cypher traversal instead of an app-side heuristic.
    """

    def __init__(self, graph: ClinicalKnowledgeGraph) -> None:
        self.graph = graph

    def schema_cypher(self) -> list[str]:
        return [
            "CREATE CONSTRAINT criterion_uid IF NOT EXISTS "
            "FOR (c:Criterion) REQUIRE c.uid IS UNIQUE;",
            "CREATE CONSTRAINT policy_uid IF NOT EXISTS "
            "FOR (p:CoveragePolicy) REQUIRE p.uid IS UNIQUE;",
        ]

    def upsert_cypher(self, limit: int | None = None) -> list[str]:
        out: list[str] = []
        for n in self.graph.nodes.values():
            if n.label not in COVERAGE_LABELS and n.label != "Drug":
                continue
            props = ", ".join(f"{k}: {json.dumps(v)}" for k, v in n.props.items() if v is not None)
            out.append(f"MERGE (n:{n.label} {{uid: {json.dumps(n.uid)}}}) SET n += {{{props}}};")
            if limit and len(out) >= limit:
                break
        for e in self.graph.edges:
            if e.rel in {"REQUIRES", "PUBLISHES", "FOR_DRUG"}:
                out.append(
                    f"MATCH (a {{uid: {json.dumps(e.src)}}}), (b {{uid: {json.dumps(e.dst)}}}) "
                    f"MERGE (a)-[:{e.rel}]->(b);"
                )
        return out

    @staticmethod
    def coverage_query_cypher() -> str:
        """The query that replaces app-side matching once data lives in PMG.

        Given a patient's PA request, pull the drug's criteria and the patient's
        coded evidence (conditions/labs/meds) in ONE traversal. Evidence→Criterion
        scoring then runs over PMG's native vector index (db.index.vector.*).
        """
        return (
            "MATCH (p:Patient {uid: $patient_uid})-[:HAS_PA_REQUEST]->(pa:PriorAuthRequest)\n"
            "MATCH (d:Drug {name: pa.drug_name})-[:REQUIRES]->(c:Criterion)\n"
            "OPTIONAL MATCH (p)-[:HAS_CONDITION|HAS_LAB|HAS_MEDICATION]->(e)\n"
            "WITH c, collect(e) AS evidence\n"
            "CALL db.index.vector.queryNodes('criterion_embeddings', 5, c.embedding)\n"
            "  YIELD node, score\n"
            "RETURN c.statement, c.critical, evidence, score ORDER BY c.critical DESC;"
        )


# --------------------------------------------------------------------------- #
# Module-level singleton (mirrors criteria_kb._load)                          #
# --------------------------------------------------------------------------- #
_graph: ClinicalKnowledgeGraph | None = None
_glock = threading.Lock()


def get_graph() -> ClinicalKnowledgeGraph:
    global _graph
    if _graph is None:
        with _glock:
            if _graph is None:
                _graph = ClinicalKnowledgeGraph().load_criteria_kb()
    return _graph


def match_case(drug, supportive_texts, contradictory_texts, **kw):
    """Drop-in replacement for criteria_kb.match_case backed by the graph."""
    return get_graph().match_case(drug, supportive_texts, contradictory_texts, **kw)


if __name__ == "__main__":  # quick smoke test
    g = get_graph()
    print(f"graph: {len(g.nodes)} nodes, {len(g.edges)} edges")
    for lbl in sorted({n.label for n in g.nodes.values()}):
        print(f"  {lbl:16s} {len(g.nodes_with_label(lbl))}")
    demo = g.match_case(
        "Ozempic",
        ["Patient has type 2 diabetes mellitus, HbA1c 8.4%.",
         "Tried and failed metformin for 3 months."],
        ["No documented trial of GLP-1 alternative."],
    )
    if demo:
        print(f"\nOzempic demo: readiness={demo['readiness_pct']}% "
              f"met={demo['met']}/{demo['total']} at_risk={demo['at_risk']}")
        for it in demo["criteria"][:5]:
            print(f"  [{it['status']:10s} {it['match_score']:.2f}] {it['statement'][:70]}")
