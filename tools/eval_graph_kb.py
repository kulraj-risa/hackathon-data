"""Head-to-head: does the graph KB beat content-word overlap? + graph DB3.

Run:  python eval_graph_kb.py [--n 3000] [--k 25]

Part A — Coverage matcher lift
  For a balanced sample of historic PAs we extract each case's supportive /
  contradictory facts, then score readiness two ways:
    * baseline  = criteria_kb.match_case   (content-word overlap)
    * graph     = graph_kb.match_case      (semantic + negation/contradiction)
  A good readiness signal should be *higher for approved cases*. We report the
  AUC of (readiness -> approved) for each — a direct, model-free measure of how
  much real signal the matcher's coverage score carries.

Part B — Graph DB3 (explainable similar-patient retrieval)
  We build a patient-similarity graph over the historic cases (TF-IDF k-NN on
  facts+drug+payer) and predict approval by neighbor vote. This is an
  *explainable* alternative/complement to the opaque XGBoost: every prediction
  comes with the actual neighbor cases that drove it.
"""

from __future__ import annotations

import argparse
import re
import sys

import numpy as np
import pandas as pd

DATA = "data/training_data.parquet"
_QUOTED = re.compile(r"'([^']*)'|\"([^\"]*)\"")


def _facts(blob) -> list[str]:
    """Pull individual fact strings out of a numpy-array-style repr string."""
    if blob is None:
        return []
    s = str(blob)
    out = [a or b for a, b in _QUOTED.findall(s)]
    return [f.strip() for f in out if f and f.strip() and f.strip() != "[]"]


def case_facts(questions) -> tuple[list[str], list[str]]:
    sup: list[str] = []
    con: list[str] = []
    if questions is None:
        return sup, con
    for q in list(questions):
        if not isinstance(q, dict):
            continue
        api = q.get("api_response") or {}
        facts = api.get("facts") or {}
        sup += _facts(facts.get("supportive_facts"))
        con += _facts(facts.get("contradictory_facts"))
        # the question text + chosen answer is itself weak evidence
        if q.get("question") and q.get("answer"):
            sup.append(f"{q['question']} -> {q['answer']}")
    return sup, con


def auc(scores: list[float], labels: list[int]) -> float:
    try:
        from sklearn.metrics import roc_auc_score
        if len(set(labels)) < 2:
            return float("nan")
        return float(roc_auc_score(labels, scores))
    except Exception:
        return float("nan")


def balanced_sample(df: pd.DataFrame, n: int, seed: int = 0) -> pd.DataFrame:
    appr = df[df.response_status == "Approved"]
    deny = df[df.response_status == "Denied"]
    half = n // 2
    parts = [
        appr.sample(min(half, len(appr)), random_state=seed),
        deny.sample(min(half, len(deny)), random_state=seed),
    ]
    return pd.concat(parts).sample(frac=1, random_state=seed).reset_index(drop=True)


def part_a(df: pd.DataFrame) -> None:
    from denial_engine.knowledge import criteria_kb
    from denial_engine.knowledge import graph_kb

    g = graph_kb.get_graph()
    base_scores, graph_scores, signal_scores, labels = [], [], [], []
    in_kb = 0
    for _, row in df.iterrows():
        drug = graph_kb._norm_drug(row["medication_name"])
        if graph_kb.get_graph().nodes.get(f"Drug:{drug}") is None:
            continue
        in_kb += 1
        sup, con = case_facts(row["questions"])
        label = 1 if row["response_status"] == "Approved" else 0
        b = criteria_kb.match_case(drug, sup, con)
        gm = g.match_case(drug, sup, con)
        if not b or not gm:
            continue
        base_scores.append(b["readiness_pct"])
        graph_scores.append(gm["readiness_pct"])
        signal_scores.append(gm["coverage_signal"])
        labels.append(label)

    n = len(labels)
    print("\n" + "=" * 64)
    print("PART A  Coverage-matcher signal (readiness -> approval)")
    print("=" * 64)
    print(f"cases scored (drug in KB): {n}  ({in_kb} matched a KB drug)")
    if n:
        ba = auc(base_scores, labels)
        ga = auc(graph_scores, labels)
        gs = auc(signal_scores, labels)
        print(f"  baseline  content-overlap (readiness)   AUC = {ba:.3f}")
        print(f"  graph     semantic   (readiness bins)   AUC = {ga:.3f}")
        print(f"  graph     semantic   (analog signal)    AUC = {gs:.3f}   <- continuous")
        if ba == ba and gs == gs:
            delta = (gs - ba)
            print(f"  delta (graph analog - baseline)         = {delta:+.3f}  "
                  f"({'graph better' if delta > 0 else 'baseline better' if delta < 0 else 'tie'})")
        ap = [s for s, l in zip(graph_scores, labels) if l == 1]
        dn = [s for s, l in zip(graph_scores, labels) if l == 0]
        print(f"  graph readiness  approved μ={np.mean(ap):.1f}  denied μ={np.mean(dn):.1f}  "
              f"(separation {np.mean(ap) - np.mean(dn):+.1f} pts)")
        ap = [s for s, l in zip(base_scores, labels) if l == 1]
        dn = [s for s, l in zip(base_scores, labels) if l == 0]
        print(f"  base  readiness  approved μ={np.mean(ap):.1f}  denied μ={np.mean(dn):.1f}  "
              f"(separation {np.mean(ap) - np.mean(dn):+.1f} pts)")


def part_b(df: pd.DataFrame, k: int) -> None:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.neighbors import NearestNeighbors

    docs, labels, meta = [], [], []
    for _, row in df.iterrows():
        sup, con = case_facts(row["questions"])
        doc = (f"{row['medication_name']} {row['payer_name']} "
               + " ".join(sup) + " NEG " + " ".join(con))
        docs.append(doc)
        labels.append(1 if row["response_status"] == "Approved" else 0)
        md = row["medication_name"] if isinstance(row["medication_name"], str) else "(unknown drug)"
        mp = row["payer_name"] if isinstance(row["payer_name"], str) else "(unknown payer)"
        meta.append((md, mp, row["response_status"]))
    labels = np.array(labels)

    split = int(len(docs) * 0.75)
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=40000, sublinear_tf=True)
    X = vec.fit_transform(docs)
    Xtr, Xte = X[:split], X[split:]
    ytr, yte = labels[:split], labels[split:]

    nn = NearestNeighbors(n_neighbors=min(k, split), metric="cosine").fit(Xtr)
    dist, idx = nn.kneighbors(Xte)
    sim = 1 - dist
    # similarity-weighted neighbor approval rate = predicted P(approve)
    w = np.clip(sim, 0, None)
    probs = (w * ytr[idx]).sum(1) / (w.sum(1) + 1e-9)
    preds = (probs >= 0.5).astype(int)

    acc = float((preds == yte).mean())
    print("\n" + "=" * 64)
    print(f"PART B  Graph DB3 — similar-patient retrieval (k={k}, cosine k-NN)")
    print("=" * 64)
    print(f"  train/test = {split}/{len(yte)}   test base rate approved = {yte.mean():.2f}")
    print(f"  accuracy (neighbor vote) = {acc:.3f}")
    print(f"  AUC      (neighbor prob) = {auc(list(probs), list(yte)):.3f}")

    # explainability: show a *named*, confident test case and the neighbors behind it
    test_meta = meta[split:]
    cand = [i for i in range(len(yte))
            if not test_meta[i][0].startswith("(unknown") and probs[i] >= 0.5]
    j = max(cand, key=lambda i: probs[i]) if cand else (
        int(np.argmax(probs >= 0.5)) if (probs >= 0.5).any() else 0)
    drug, payer, actual = meta[split + j]
    print(f"\n  Example — {drug} / {payer}: predicted P(approve)={probs[j]:.2f} "
          f"(pred {'APPROVE' if preds[j] else 'DENY'}, actual {actual})")
    print("  driven by nearest historic cases:")
    for rank, ni in enumerate(idx[j][:5]):
        md, mp, ms = meta[ni]
        print(f"    {rank+1}. sim={sim[j][rank]:.2f}  {md} / {mp} -> {ms}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=3000)
    ap.add_argument("--k", type=int, default=25)
    args = ap.parse_args()

    df = pd.read_parquet(DATA)
    sample = balanced_sample(df, args.n)
    print(f"loaded {len(df)} historic PAs; evaluating on balanced sample of {len(sample)}")
    part_a(sample)
    part_b(sample, args.k)


if __name__ == "__main__":
    sys.exit(main())
