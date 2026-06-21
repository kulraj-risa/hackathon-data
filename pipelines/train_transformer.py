"""Experimental branch: ClinicalBERT embeddings -> XGBoost denial head.

This swaps the deployed TF-IDF text channel for **contextual clinical
embeddings** and feeds them, alongside the SAME numeric features, into the SAME
XGBoost head. It exists to answer one question: *do clinical embeddings beat the
0.83 TF-IDF model?* It is NOT wired into the Cloud Run serving image (the
embedding model is ~440 MB) — it's an offline research script meant to run on
the PARAM Shivay HPC cluster.

Pipeline:
    data/training_data.parquet
        -> FeatureEngineer            (28 numeric features, reused as-is)
        -> ClinicalBERT mean-pooled   (768-d evidence embedding per case)
        -> hstack -> XGBoost          (same head, same split/seed)
        -> metrics vs. baselines, saved to models/denial_transformer.pkl

Run (on a compute node, see docs/TRANSFORMER_BRANCH.md):
    python train_transformer.py --model emilyalsentzer/Bio_ClinicalBERT

Embeddings are cached to data/ so re-runs (e.g. XGBoost tuning) skip the GPU
pass. Heavy deps (torch/transformers) are imported lazily so the rest of the
repo doesn't need them.
"""

from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, hstack
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from denial_engine.core.config import DATA_DIR, MODELS_DIR, RANDOM_SEED, TEST_SIZE, XGBOOST_PARAMS
from denial_engine.ml.feature_engineer import (
    FeatureEngineer,
    answers_from_questions,
    fact_strings_from_questions,
)

DEFAULT_MODEL = os.getenv("TRANSFORMER_MODEL", "emilyalsentzer/Bio_ClinicalBERT")


def case_text(questions) -> str:
    """Natural-language evidence summary for one case (polarity preserved)."""
    sup, con = fact_strings_from_questions(questions)
    ans = answers_from_questions(questions)
    parts: list[str] = []
    if ans:
        parts.append("Answers: " + "; ".join(ans) + ".")
    if sup:
        parts.append("Supportive evidence: " + " ".join(_dot(s) for s in sup))
    if con:
        parts.append("Contradictory evidence: " + " ".join(_dot(c) for c in con))
    return " ".join(parts) or "No evidence recorded."


def _dot(s: str) -> str:
    s = s.strip()
    return s if s.endswith((".", "!", "?")) else s + "."


def embed_texts(texts: list[str], model_id: str, batch_size: int, max_len: int) -> np.ndarray:
    """Mean-pooled ClinicalBERT embeddings. Uses GPU if available, else CPU."""
    import torch  # lazy: only needed on the cluster
    from transformers import AutoModel, AutoTokenizer

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"   device={device}  model={model_id}")
    tok = AutoTokenizer.from_pretrained(model_id)
    model = AutoModel.from_pretrained(model_id).to(device).eval()

    out: list[np.ndarray] = []
    with torch.no_grad():
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            enc = tok(
                batch,
                padding=True,
                truncation=True,
                max_length=max_len,
                return_tensors="pt",
            ).to(device)
            hidden = model(**enc).last_hidden_state            # (B, T, H)
            mask = enc["attention_mask"].unsqueeze(-1).float()  # (B, T, 1)
            pooled = (hidden * mask).sum(1) / mask.sum(1).clamp(min=1e-9)
            out.append(pooled.cpu().numpy())
            if (i // batch_size) % 20 == 0:
                print(f"     embedded {min(i + batch_size, len(texts)):,}/{len(texts):,}")
    return np.vstack(out).astype(np.float32)


def get_embeddings(texts: list[str], model_id: str, batch_size: int, max_len: int) -> np.ndarray:
    """Return cached embeddings if present (keyed by model + corpus hash)."""
    h = hashlib.sha1((model_id + "|" + "|".join(texts)).encode()).hexdigest()[:12]
    cache = DATA_DIR / f"emb_{model_id.split('/')[-1]}_{len(texts)}_{h}.npy"
    if cache.exists():
        print(f"♻️  Reusing cached embeddings -> {cache.name}")
        return np.load(cache)
    print("🧠 Computing embeddings (this is the GPU step)...")
    emb = embed_texts(texts, model_id, batch_size, max_len)
    np.save(cache, emb)
    print(f"💾 Cached embeddings -> {cache.name}  shape={emb.shape}")
    return emb


def main() -> None:
    ap = argparse.ArgumentParser(description="ClinicalBERT-embedding denial model")
    ap.add_argument("--model", default=DEFAULT_MODEL, help="HF model id or local path")
    ap.add_argument(
        "--data",
        default="data/training_data_deid.parquet",
        help="parquet to train on (default: the de-identified file from deidentify.py)",
    )
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--max-len", type=int, default=256)
    ap.add_argument("--max-rows", type=int, default=0, help="cap rows (0 = all) for quick tests")
    args = ap.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise SystemExit(
            f"❌ {data_path} not found.\n"
            "   Run `python deidentify.py` first (recommended for shared clusters),\n"
            "   or pass --data data/training_data.parquet to use the raw file."
        )
    print(f"📂 Loading training data from {data_path} ...")
    df = pd.read_parquet(data_path)
    if args.max_rows:
        df = df.head(args.max_rows).reset_index(drop=True)
    y = (df["response_status"] == "Denied").astype(int)
    print(f"   {len(df):,} cases  ({y.mean():.1%} denied)")

    fe = FeatureEngineer().fit(df)
    Xnum = fe.transform(df).values.astype(np.float32)
    texts = [case_text(q) for q in df.get("questions", pd.Series([None] * len(df)))]
    print(f"⚙️  Numeric features: {Xnum.shape[1]}  ·  building text for {len(texts):,} cases")

    emb = get_embeddings(texts, args.model, args.batch_size, args.max_len)
    assert emb.shape[0] == len(df), "embedding/row count mismatch"

    idx = np.arange(len(df))
    tr, te = train_test_split(idx, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y)

    X = hstack([csr_matrix(Xnum), csr_matrix(emb)]).tocsr()
    X_train, X_test = X[tr], X[te]
    y_train, y_test = y.iloc[tr], y.iloc[te]

    print("🚀 Training XGBoost on numeric + ClinicalBERT embeddings...")
    model = XGBClassifier(**XGBOOST_PARAMS)
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "model_id": args.model,
        "test_accuracy": float(accuracy_score(y_test, pred)),
        "test_precision": float(precision_score(y_test, pred, zero_division=0)),
        "test_recall": float(recall_score(y_test, pred, zero_division=0)),
        "test_f1": float(f1_score(y_test, pred, zero_division=0)),
        "test_roc_auc": float(roc_auc_score(y_test, proba)),
        "embedding_dim": int(emb.shape[1]),
        "n_train": int(X_train.shape[0]),
        "n_test": int(X_test.shape[0]),
    }

    print("\n" + "=" * 60)
    print("CLINICALBERT + XGBOOST — held-out test set")
    print("=" * 60)
    print(f"  ROC AUC  : {metrics['test_roc_auc']:.3f}")
    print(f"  Precision: {metrics['test_precision']:.3f}")
    print(f"  Recall   : {metrics['test_recall']:.3f}")
    print(f"  F1       : {metrics['test_f1']:.3f}")
    print(f"  Accuracy : {metrics['test_accuracy']:.3f}")
    print("-" * 60)
    print("  Compare against (deployed baselines):")
    print("    numeric-only ......... AUC 0.642")
    print("    numeric + TF-IDF ..... AUC 0.830   <-- currently deployed")
    print(f"    numeric + {args.model.split('/')[-1]} ... AUC {metrics['test_roc_auc']:.3f}")
    verdict = "BETTER — worth considering" if metrics["test_roc_auc"] > 0.83 else "not better — keep TF-IDF"
    print(f"  Verdict: {verdict}")
    print("=" * 60)

    MODELS_DIR.mkdir(exist_ok=True)
    out = MODELS_DIR / "denial_transformer.pkl"
    joblib.dump({"model": model, "feature_names": fe.feature_names, "metrics": metrics}, out)
    print(f"💾 Saved -> {out}  (gitignored; NOT shipped to Cloud Run)")


if __name__ == "__main__":
    main()
