"""De-identify the training data BEFORE it ever leaves your machine.

Produces ``data/training_data_deid.parquet`` that is safe(r) to upload to a
shared cluster (e.g. PARAM Shivay) for the ClinicalBERT experiment. Two layers
of protection:

1. **Minimize.** Keep ONLY the fields the model needs (label, counts, drug
   class, payer, and the supportive/contradictory facts + AI answer that get
   embedded). Everything else is dropped, including direct identifiers
   (``identifier``, ``covermymed_id``), timestamps, raw question text, and the
   free-form ``api_response.thinking`` reasoning.
2. **Scrub.** Every remaining free-text string is passed through regex filters
   for HIPAA Safe-Harbor identifiers (dates, phone/fax, SSN, MRN/record ids,
   email, URL, IP, ages > 89, long digit runs, titled names).

⚠️ This REDUCES risk; it is not a compliance guarantee. Names embedded mid-
sentence are hard to catch with regex. Still get data-governance sign-off before
upload, and run the verification report this script prints. ICD-10 codes (e.g.
``F41.9``) are clinical content, NOT identifiers, so they are intentionally kept.

Run locally:
    ./venv/bin/python deidentify.py
"""

from __future__ import annotations

import re
from typing import Any

import pandas as pd

from denial_engine.core.config import DATA_DIR

SRC = DATA_DIR / "training_data.parquet"
OUT = DATA_DIR / "training_data_deid.parquet"

_MONTHS = (
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|"
    r"January|February|March|April|June|July|August|September|October|November|December)"
)

# Order matters: specific patterns first, generic digit runs last.
SCRUBBERS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "[EMAIL]"),
    (re.compile(r"\bhttps?://\S+\b"), "[URL]"),
    (re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b"), "[IP]"),
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[SSN]"),
    (re.compile(r"\b(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b"), "[PHONE]"),
    # Labeled record/account/member identifiers. The trailing token MUST contain
    # a digit so we don't eat ordinary words (e.g. "member will...").
    (re.compile(r"\b(?:MRN|MR#|medical\s+record(?:\s*(?:no\.?|number|#))?|record\s*(?:no\.?|number|#)"
                r"|acct\.?|account(?:\s*(?:no\.?|number|#))?|member\s*id|patient\s*id|subscriber\s*id"
                r"|group\s*(?:no\.?|number|#))\b[:#]?\s*[A-Za-z-]*\d[\w-]*", re.I), "[ID]"),
    # Dates: numeric, ISO, MM/YYYY, and month-name forms.
    (re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"), "[DATE]"),
    (re.compile(r"\b\d{4}-\d{1,2}-\d{1,2}\b"), "[DATE]"),
    (re.compile(r"\b\d{1,2}/\d{4}\b"), "[DATE]"),
    (re.compile(rf"\b{_MONTHS}\.?\s+\d{{1,2}}(?:st|nd|rd|th)?,?\s+\d{{2,4}}\b", re.I), "[DATE]"),
    (re.compile(rf"\b\d{{1,2}}(?:st|nd|rd|th)?\s+{_MONTHS}\.?,?\s+\d{{2,4}}\b", re.I), "[DATE]"),
    (re.compile(rf"\b{_MONTHS}\.?\s+\d{{2,4}}\b", re.I), "[DATE]"),
    # Ages over 89 (Safe Harbor) — keep younger ages as clinical context.
    (re.compile(r"\b(?:9\d|1\d{2})\s*[-\s]?(?:years?|yrs?|y/?o)\b", re.I), "[AGE]"),
    # Titled names (best-effort).
    (re.compile(r"\b(?:Dr|Mr|Mrs|Ms|Miss|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?"), "[NAME]"),
    # Any remaining long digit run (>=6) -> likely an id. Short numbers (doses,
    # labs, small counts) are preserved as clinical signal.
    (re.compile(r"\b\d{6,}\b"), "[ID]"),
]

# Patterns the verification pass flags as "still looks like an identifier".
RESIDUAL_CHECKS: list[tuple[str, re.Pattern[str]]] = [
    ("date", re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b")),
    ("iso-date", re.compile(r"\b\d{4}-\d{1,2}-\d{1,2}\b")),
    ("email", re.compile(r"@[\w-]+\.[\w.-]+")),
    ("ssn", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("long-digits", re.compile(r"\b\d{6,}\b")),
]


def scrub(text: Any) -> str:
    if text is None:
        return ""
    s = str(text)
    for pat, repl in SCRUBBERS:
        s = pat.sub(repl, s)
    return re.sub(r"\s+", " ", s).strip()


def _scrub_list(items: Any) -> list[str]:
    out: list[str] = []
    if items is None:
        return out
    try:
        for it in items:
            if it is not None and str(it).strip():
                out.append(scrub(it))
    except TypeError:
        if str(items).strip():
            out.append(scrub(items))
    return out


def slim_questions(questions: Any) -> list[dict]:
    """Rebuild a minimal questions array: only the scrubbed fields we embed."""
    slim: list[dict] = []
    if questions is None:
        return slim
    try:
        iterable = list(questions)
    except TypeError:
        return slim
    for q in iterable:
        if not isinstance(q, dict):
            continue
        api = q.get("api_response") or {}
        facts = api.get("facts") or {}
        slim.append(
            {
                "api_response": {
                    "answer": scrub(api.get("answer")),
                    "facts": {
                        "supportive_facts": _scrub_list(facts.get("supportive_facts")),
                        "contradictory_facts": _scrub_list(facts.get("contradictory_facts")),
                    },
                }
            }
        )
    return slim


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"❌ {SRC} not found.")
    print(f"📂 Loading {SRC} ...")
    df = pd.read_parquet(SRC)
    print(f"   {len(df):,} rows · dropping {len(df.columns)} cols down to the essentials")

    keep_cols = ["response_status", "medication_class", "payer_name",
                 "total_questions", "answered_questions"]
    slim = pd.DataFrame({c: df[c] for c in keep_cols if c in df.columns})
    slim["questions"] = [slim_questions(q) for q in df["questions"]]

    slim.to_parquet(OUT, index=False)
    print(f"💾 Wrote de-identified data -> {OUT}")

    # ---- verification report ----------------------------------------------
    print("\n🔎 Verification (scanning scrubbed text for residual identifiers):")
    all_text: list[str] = []
    for qs in slim["questions"]:
        for q in qs:
            api = q["api_response"]
            all_text.append(api["answer"])
            all_text.extend(api["facts"]["supportive_facts"])
            all_text.extend(api["facts"]["contradictory_facts"])
    corpus = "\n".join(all_text)
    total_residual = 0
    for name, pat in RESIDUAL_CHECKS:
        hits = pat.findall(corpus)
        total_residual += len(hits)
        flag = "✅" if not hits else "⚠️ "
        print(f"   {flag} {name:12s}: {len(hits)} match(es)" + (f"  e.g. {hits[:3]}" if hits else ""))
    print(f"   dropped columns (not uploaded): {sorted(set(df.columns) - set(slim.columns))}")

    # ---- before/after sample ----------------------------------------------
    print("\n🧪 Sample (original vs scrubbed contradictory facts):")
    shown = 0
    for orig_q in df["questions"]:
        if orig_q is None or shown >= 3:
            continue
        for q in list(orig_q):
            if not isinstance(q, dict):
                continue
            con = ((q.get("api_response") or {}).get("facts") or {}).get("contradictory_facts")
            con_list = list(con) if con is not None and len(con) else []
            for c in con_list:
                scrubbed = scrub(c)
                if scrubbed != str(c).strip():
                    print(f"   - BEFORE: {str(c)[:90]}")
                    print(f"     AFTER : {scrubbed[:90]}")
                    shown += 1
                    break
            if shown >= 3:
                break

    print("\n✅ Done. Upload ONLY data/training_data_deid.parquet, then run:")
    print("     python train_transformer.py --data data/training_data_deid.parquet")
    if total_residual:
        print("   ⚠️  Residual matches found above — review before upload.")


if __name__ == "__main__":
    main()
