#!/usr/bin/env python3
"""Batch-extract scientific measurements from ./papers using local Qwen 2.5.

Reads PDFs (via PyMuPDF) and/or .txt files from ./papers, chunks each paper,
runs Qwen 2.5 extraction on every chunk, validates + dedups, and writes
data/measurements.csv.

Examples:
  python3 extraction/batch_runner.py
  QWEN_BACKEND=ollama QWEN_MODEL=qwen2.5:14b python3 extraction/batch_runner.py --limit 5
  python3 extraction/batch_runner.py --papers papers --out data/measurements.csv --workers 4
"""
from __future__ import annotations

import argparse
import csv
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import extract_measurements as em  # noqa: E402
import validators  # noqa: E402

CSV_COLUMNS = [
    "property", "value_si", "unit_si", "value_raw", "unit_raw",
    "material", "adsorbate", "temperature_K", "confidence",
    "paper_file", "doi", "title", "topic", "chunk", "evidence",
]


def read_pdf_text(path: Path) -> str:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("PyMuPDF (fitz) not installed; cannot read PDFs. `pip install pymupdf`", file=sys.stderr)
        return ""
    try:
        doc = fitz.open(path)
    except Exception as e:  # noqa: BLE001
        print(f"   [open error] {path.name}: {e}", file=sys.stderr)
        return ""
    parts = []
    for page in doc:
        try:
            parts.append(page.get_text())
        except Exception:  # noqa: BLE001
            continue
    doc.close()
    return "\n".join(parts)


def load_manifest(papers_dir: Path) -> dict:
    mp: dict[str, dict] = {}
    mf = papers_dir / "manifest.csv"
    if mf.exists():
        with open(mf, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                lp = row.get("local_path", "")
                if lp:
                    mp[str(Path(lp).resolve())] = row
    return mp


def gather_papers(papers_dir: Path) -> list[Path]:
    files = sorted(papers_dir.rglob("*.pdf")) + sorted(papers_dir.rglob("*.txt"))
    return files


def process_paper(path: Path, meta: dict, client: em.QwenClient,
                  max_chunks: int, min_conf: float) -> list[dict]:
    if path.suffix.lower() == ".pdf":
        text = read_pdf_text(path)
    else:
        text = path.read_text(encoding="utf-8", errors="ignore")
    if not text.strip():
        return []

    doi = (meta.get("id") or "") if meta else ""
    title = (meta.get("title") or path.stem) if meta else path.stem
    topic = (meta.get("topic") or path.parent.name) if meta else path.parent.name

    chunks = em.chunk_text(text)
    if max_chunks > 0:
        chunks = chunks[:max_chunks]

    seen: set = set()
    rows: list[dict] = []
    for ci, chunk in enumerate(chunks):
        try:
            measurements = em.extract_from_passage(client, chunk, min_confidence=min_conf)
        except Exception as e:  # noqa: BLE001
            print(f"   [extract error] {path.name} chunk {ci}: {e}", file=sys.stderr)
            continue
        for m in measurements:
            key = validators.dedup_key(m, path.name)
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                "property": m["property"],
                "value_si": m["value_si"],
                "unit_si": m["unit_si"],
                "value_raw": m["value_raw"],
                "unit_raw": m["unit_raw"],
                "material": m["material"],
                "adsorbate": m["adsorbate"],
                "temperature_K": m["temperature_K"],
                "confidence": m["confidence"],
                "paper_file": path.name,
                "doi": doi,
                "title": title,
                "topic": topic,
                "chunk": ci,
                "evidence": m["evidence"],
            })
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--papers", default="papers")
    ap.add_argument("--out", default="data/measurements.csv")
    ap.add_argument("--limit", type=int, default=0, help="0 = all papers")
    ap.add_argument("--max-chunks", type=int, default=12, help="max chunks per paper (0 = all)")
    ap.add_argument("--min-confidence", type=float, default=0.4)
    ap.add_argument("--workers", type=int, default=1, help=">1 to parallelize HTTP backends")
    args = ap.parse_args()

    papers_dir = Path(args.papers)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    manifest = load_manifest(papers_dir)
    papers = gather_papers(papers_dir)
    if args.limit:
        papers = papers[: args.limit]
    if not papers:
        print(f"No papers found in {papers_dir}/", file=sys.stderr)
        sys.exit(1)

    client = em.QwenClient()
    print(f"Backend={client.backend} model={client.model}")
    print(f"Extracting from {len(papers)} papers -> {out_path}")

    all_rows: list[dict] = []
    t0 = time.time()

    def _job(p: Path):
        meta = manifest.get(str(p.resolve()), {})
        return p, process_paper(p, meta, client, args.max_chunks, args.min_confidence)

    if args.workers > 1:
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(_job, p): p for p in papers}
            for i, fut in enumerate(as_completed(futs), 1):
                p, rows = fut.result()
                all_rows.extend(rows)
                print(f"  [{i}/{len(papers)}] {p.name[:48]:48} +{len(rows)} (total {len(all_rows)})")
    else:
        for i, p in enumerate(papers, 1):
            _, rows = _job(p)
            all_rows.extend(rows)
            print(f"  [{i}/{len(papers)}] {p.name[:48]:48} +{len(rows)} (total {len(all_rows)})")

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        w.writeheader()
        for r in all_rows:
            w.writerow(r)

    counts: dict[str, int] = {}
    for r in all_rows:
        counts[r["property"]] = counts.get(r["property"], 0) + 1
    dt = time.time() - t0
    print(f"\n=== DONE in {dt:.1f}s ===")
    print(f"Papers: {len(papers)}  Measurements: {len(all_rows)}")
    for k in sorted(counts, key=lambda x: -counts[x]):
        print(f"  {k:22} {counts[k]}")
    print(f"\nWrote {out_path}")


if __name__ == "__main__":
    main()
