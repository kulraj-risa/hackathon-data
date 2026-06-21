"""Feature engineering for PA denial prediction (adapted to the REAL schema).

The implementation guide assumed per-question `confidence`, `evidence_quality`,
`category`, `icd10_code`, `recency` fields. The actual BigQuery data does NOT
have those:

  - `api_response.confidence` is 100% null  -> unusable
  - evidence quality lives as fact *counts*: `api_response.facts.supportive_facts`
    and `api_response.facts.contradictory_facts` (arrays)
  - `medication_class` / `payer_name` are ~91% null

So features are built from signals that are actually populated and predictive
(verified: denial rate rises 26% -> 53% as contradictory facts increase):

  question counts, answered/completeness, supportive & contradictory fact totals
  (and ratios), drug class, and payer.

Crucially, training and serving use the SAME small set of inputs
(see `CASE_INPUTS`) so the FastAPI `/api/predict` endpoint can reproduce the
exact feature vector the model was trained on.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

# Raw inputs a single case must provide (everything else is derived from these).
CASE_INPUTS = (
    "total_questions",
    "answered_questions",
    "supportive_facts",
    "contradictory_facts",
    "medication_class",
    "payer_name",
)

MED_CLASSES = ("Brand", "Generic", "Unknown")


def _num(x: Any) -> float:
    """Coerce possibly-NA / None / nan values to a float (default 0.0)."""
    if x is None:
        return 0.0
    try:
        if pd.isna(x):
            return 0.0
    except (TypeError, ValueError):
        pass
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def _arr_len(x: Any) -> int:
    if x is None:
        return 0
    try:
        return len(x)
    except TypeError:
        return 0


def aggregates_from_questions(questions: Any) -> dict[str, float]:
    """Sum supportive / contradictory facts across a case's questions array."""
    sup = con = 0
    if questions is not None and _arr_len(questions) > 0:
        for q in questions:
            if not isinstance(q, dict):
                continue
            api = q.get("api_response") or {}
            facts = api.get("facts") or {}
            sup += _arr_len(facts.get("supportive_facts"))
            con += _arr_len(facts.get("contradictory_facts"))
    return {"supportive_facts": float(sup), "contradictory_facts": float(con)}


def _iter(x: Any):
    """Yield items from a list / numpy array, tolerating None and scalars."""
    if x is None:
        return
    try:
        for item in x:
            yield item
    except TypeError:
        yield x


def fact_strings_from_questions(questions: Any) -> tuple[list[str], list[str]]:
    """Collect supportive / contradictory fact strings across a case's questions."""
    sup: list[str] = []
    con: list[str] = []
    if questions is not None and _arr_len(questions) > 0:
        for q in questions:
            if not isinstance(q, dict):
                continue
            api = q.get("api_response") or {}
            facts = api.get("facts") or {}
            for s in _iter(facts.get("supportive_facts")):
                if s is not None and str(s).strip():
                    sup.append(str(s).strip())
            for c in _iter(facts.get("contradictory_facts")):
                if c is not None and str(c).strip():
                    con.append(str(c).strip())
    return sup, con


def answers_from_questions(questions: Any) -> list[str]:
    """Per-question AI answers (e.g. YES / NO) — a cheap, predictive signal."""
    out: list[str] = []
    for q in _iter(questions):
        if not isinstance(q, dict):
            continue
        api = q.get("api_response") or {}
        a = api.get("answer")
        if a is not None and str(a).strip():
            out.append(str(a).strip())
    return out


def build_fact_text(
    sup_texts: list[str], con_texts: list[str], answers: list[str] | None = None
) -> str:
    """Compose the bag-of-words document the TF-IDF model is trained/served on.

    Supportive / contradictory facts are prefixed so the vectorizer can tell a
    statement appearing as *support* apart from the same statement appearing as
    a *contradiction* (the polarity is what carries the denial signal).
    """
    parts: list[str] = []
    for a in answers or []:
        parts.append("ANS " + str(a))
    for s in sup_texts:
        parts.append("SUP " + str(s))
    for c in con_texts:
        parts.append("CON " + str(c))
    return " ".join(parts)


def case_fact_strings(case: dict[str, Any]) -> tuple[list[str], list[str], list[str]]:
    """Pull (supportive, contradictory, answers) text from a single-case payload.

    Accepts either rich text (``supportive_texts`` / ``contradictory_texts`` lists,
    or a full ``questions`` array) or nothing (counts-only case -> empty text).
    """
    if case.get("questions"):
        sup, con = fact_strings_from_questions(case["questions"])
        return sup, con, answers_from_questions(case["questions"])
    sup = [str(s).strip() for s in _iter(case.get("supportive_texts")) if str(s).strip()]
    con = [str(c).strip() for c in _iter(case.get("contradictory_texts")) if str(c).strip()]
    ans = [str(a).strip() for a in _iter(case.get("answers")) if str(a).strip()]
    return sup, con, ans


class FeatureEngineer:
    """Builds a fixed feature vector usable for both training and serving."""

    def __init__(self, top_payers: int = 10):
        self.n_top_payers = top_payers
        self.top_payers: list[str] = []
        self.feature_names: list[str] = []

    # ------------------------------------------------------------------ fit
    def fit(self, df: pd.DataFrame) -> "FeatureEngineer":
        payer = df.get("payer_name")
        if payer is not None:
            self.top_payers = (
                payer.dropna().value_counts().head(self.n_top_payers).index.tolist()
            )
        # Lock in the feature order from a single dummy row.
        self.feature_names = list(self._row_features(self._empty_agg()).keys())
        return self

    # ------------------------------------------------------- single-case API
    def features_from_case(self, case: dict[str, Any]) -> pd.DataFrame:
        agg = self._coerce_case(case)
        row = self._row_features(agg)
        X = pd.DataFrame([row])
        return X.reindex(columns=self.feature_names, fill_value=0.0)

    def fact_text_from_case(self, case: dict[str, Any]) -> str:
        sup, con, ans = case_fact_strings(case)
        return build_fact_text(sup, con, ans)

    # ----------------------------------------------------------- training API
    def fact_texts(self, df: pd.DataFrame) -> list[str]:
        """One bag-of-words document per case, for the TF-IDF text channel."""
        docs: list[str] = []
        for q in df.get("questions", pd.Series([None] * len(df))):
            sup, con = fact_strings_from_questions(q)
            docs.append(build_fact_text(sup, con, answers_from_questions(q)))
        return docs

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        rows = []
        for _, r in df.iterrows():
            facts = aggregates_from_questions(r.get("questions"))
            agg = {
                "total_questions": _num(r.get("total_questions")),
                "answered_questions": _num(r.get("answered_questions")),
                "supportive_facts": facts["supportive_facts"],
                "contradictory_facts": facts["contradictory_facts"],
                "medication_class": r.get("medication_class"),
                "payer_name": r.get("payer_name"),
            }
            rows.append(self._row_features(agg))
        X = pd.DataFrame(rows)
        if not self.feature_names:
            self.feature_names = list(X.columns)
        return X.reindex(columns=self.feature_names, fill_value=0.0)

    # ------------------------------------------------------------- internals
    @staticmethod
    def _empty_agg() -> dict[str, Any]:
        return {
            "total_questions": 0.0,
            "answered_questions": 0.0,
            "supportive_facts": 0.0,
            "contradictory_facts": 0.0,
            "medication_class": None,
            "payer_name": None,
        }

    @staticmethod
    def _coerce_case(case: dict[str, Any]) -> dict[str, Any]:
        agg = FeatureEngineer._empty_agg()
        for k in CASE_INPUTS:
            if case.get(k) is not None:
                agg[k] = case[k]
        # Fact counts may arrive as ints OR as lists of fact strings.
        for k in ("supportive_facts", "contradictory_facts"):
            if isinstance(agg[k], (list, tuple)):
                agg[k] = float(len(agg[k]))
        # Rich text lists override counts when present.
        if case.get("supportive_texts") is not None:
            agg["supportive_facts"] = float(_arr_len(case["supportive_texts"]))
        if case.get("contradictory_texts") is not None:
            agg["contradictory_facts"] = float(_arr_len(case["contradictory_texts"]))
        # A full `questions` array supersedes everything.
        if case.get("questions"):
            facts = aggregates_from_questions(case["questions"])
            agg["supportive_facts"] = facts["supportive_facts"]
            agg["contradictory_facts"] = facts["contradictory_facts"]
        for k in ("total_questions", "answered_questions", "supportive_facts", "contradictory_facts"):
            agg[k] = _num(agg[k])
        return agg

    def _row_features(self, agg: dict[str, Any]) -> dict[str, float]:
        nq = _num(agg["total_questions"])
        answered = _num(agg["answered_questions"])
        sup = _num(agg["supportive_facts"])
        con = _num(agg["contradictory_facts"])
        eps = 1e-6

        feats: dict[str, float] = {
            "total_questions": nq,
            "answered_questions": answered,
            "unanswered_questions": max(nq - answered, 0.0),
            "answer_completeness": answered / (nq + eps),
            "has_questionnaire": 1.0 if nq > 0 else 0.0,
            "supportive_facts": sup,
            "contradictory_facts": con,
            "supportive_per_q": sup / (nq + eps),
            "contradictory_per_q": con / (nq + eps),
            "contradictory_minus_supportive": con - sup,
            "contradictory_to_supportive_ratio": con / (sup + 1.0),
            "no_supportive_facts": 1.0 if (nq > 0 and sup == 0) else 0.0,
            "has_contradictions": 1.0 if con > 0 else 0.0,
        }

        med = agg.get("medication_class")
        for m in MED_CLASSES:
            feats[f"med_{m}"] = 1.0 if med == m else 0.0
        feats["has_med_info"] = 1.0 if med in MED_CLASSES else 0.0

        payer = agg.get("payer_name")
        for p in self.top_payers:
            feats[f"payer_{_slug(p)}"] = 1.0 if payer == p else 0.0
        feats["has_payer_info"] = 1.0 if (payer is not None and not _is_nan(payer)) else 0.0

        return feats


def _slug(s: str) -> str:
    return "".join(c if c.isalnum() else "_" for c in str(s))[:40]


def _is_nan(x: Any) -> bool:
    try:
        return bool(pd.isna(x))
    except (TypeError, ValueError):
        return False


if __name__ == "__main__":
    df = pd.read_parquet("data/training_data.parquet")
    fe = FeatureEngineer().fit(df)
    X = fe.transform(df)
    print(f"feature matrix: {X.shape}")
    print("features:", fe.feature_names)
    print(X.describe().T[["mean", "min", "max"]].round(3).to_string())
