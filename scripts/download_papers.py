#!/usr/bin/env python3
"""Download open-access scientific papers for the Scientific Discovery Agent.

Sources:
  - OpenAlex (metadata + open-access PDF links, no API key)
  - arXiv    (preprint PDFs for cond-mat / physics / chem)

Only downloads papers with an open-access / freely available PDF.
Saves PDFs to papers/<topic_slug>/ and writes a manifest CSV with metadata.

Usage:
  python3 scripts/download_papers.py --per-topic 15
  python3 scripts/download_papers.py --per-topic 25 --topics "g-C3N4 adsorption" "tetracycline removal"
"""
from __future__ import annotations

import argparse
import csv
import re
import time
from pathlib import Path

import requests

# Be a polite OpenAlex citizen: put a contact email in the query.
CONTACT_EMAIL = "researcher@example.com"
OPENALEX = "https://api.openalex.org/works"
ARXIV = "http://export.arxiv.org/api/query"

DEFAULT_TOPICS = [
    "tetracycline adsorption",
    "graphitic carbon nitride g-C3N4 adsorption",
    "g-C3N4 photocatalysis DFT",
    "adsorption energy DFT density functional theory",
    "electrolyte diffusion coefficient molecular dynamics",
    "radial distribution function molecular dynamics electrolyte",
    "antibiotic adsorption water treatment",
    "mean squared displacement diffusion simulation",
]

HEADERS = {"User-Agent": f"SciDiscoveryAgent/1.0 (mailto:{CONTACT_EMAIL})"}


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", text.strip().lower())
    return re.sub(r"_+", "_", s).strip("_")[:50]


def safe_name(text: str, max_len: int = 80) -> str:
    s = re.sub(r"[^a-zA-Z0-9._-]+", "_", text)
    return re.sub(r"_+", "_", s).strip("_")[:max_len] or "paper"


def download_pdf(url: str, dest: Path, timeout: int = 60) -> bool:
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout, stream=True, allow_redirects=True)
        ctype = r.headers.get("Content-Type", "").lower()
        if r.status_code != 200:
            return False
        # Accept explicit PDFs or responses that start with the PDF magic bytes.
        first = next(r.iter_content(chunk_size=1024), b"")
        if "pdf" not in ctype and not first.startswith(b"%PDF"):
            return False
        with open(dest, "wb") as f:
            if first:
                f.write(first)
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return dest.stat().st_size > 2048
    except Exception:
        return False


def reconstruct_abstract(inv_index: dict | None) -> str:
    if not inv_index:
        return ""
    positions: list[tuple[int, str]] = []
    for word, idxs in inv_index.items():
        for i in idxs:
            positions.append((i, word))
    positions.sort()
    return " ".join(w for _, w in positions)[:4000]


def fetch_openalex(topic: str, per_topic: int) -> list[dict]:
    params = {
        "search": topic,
        "filter": "is_oa:true,has_fulltext:true",
        "sort": "cited_by_count:desc",
        "per-page": min(per_topic * 2, 50),
        "mailto": CONTACT_EMAIL,
    }
    out: list[dict] = []
    try:
        r = requests.get(OPENALEX, params=params, headers=HEADERS, timeout=40)
        r.raise_for_status()
        for w in r.json().get("results", []):
            loc = w.get("best_oa_location") or w.get("primary_location") or {}
            pdf_url = loc.get("pdf_url")
            if not pdf_url:
                continue
            out.append({
                "source": "openalex",
                "id": (w.get("doi") or w.get("id") or "").replace("https://doi.org/", ""),
                "title": w.get("title") or "untitled",
                "year": w.get("publication_year"),
                "venue": (w.get("primary_location") or {}).get("source", {}).get("display_name") if w.get("primary_location") else "",
                "cited_by": w.get("cited_by_count", 0),
                "pdf_url": pdf_url,
                "abstract": reconstruct_abstract(w.get("abstract_inverted_index")),
            })
    except Exception as e:
        print(f"   [openalex error] {e}")
    return out


def fetch_arxiv(topic: str, per_topic: int) -> list[dict]:
    params = {
        "search_query": f"all:{topic}",
        "start": 0,
        "max_results": per_topic,
        "sortBy": "relevance",
    }
    out: list[dict] = []
    try:
        r = requests.get(ARXIV, params=params, headers=HEADERS, timeout=40)
        r.raise_for_status()
        text = r.text
        entries = re.findall(r"<entry>(.*?)</entry>", text, re.S)
        for e in entries:
            tid = re.search(r"<id>(.*?)</id>", e)
            title = re.search(r"<title>(.*?)</title>", e, re.S)
            summary = re.search(r"<summary>(.*?)</summary>", e, re.S)
            published = re.search(r"<published>(\d{4})", e)
            if not tid:
                continue
            arxiv_id = tid.group(1).strip().split("/abs/")[-1]
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}"
            out.append({
                "source": "arxiv",
                "id": arxiv_id,
                "title": (title.group(1).strip().replace("\n", " ") if title else "untitled"),
                "year": published.group(1) if published else "",
                "venue": "arXiv",
                "cited_by": "",
                "pdf_url": pdf_url,
                "abstract": (summary.group(1).strip().replace("\n", " ")[:4000] if summary else ""),
            })
    except Exception as e:
        print(f"   [arxiv error] {e}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-topic", type=int, default=15, help="target PDFs per topic")
    ap.add_argument("--topics", nargs="*", default=None)
    ap.add_argument("--outdir", default="papers")
    args = ap.parse_args()

    topics = args.topics or DEFAULT_TOPICS
    outroot = Path(args.outdir)
    outroot.mkdir(parents=True, exist_ok=True)

    manifest_path = outroot / "manifest.csv"
    seen_ids: set[str] = set()
    rows: list[dict] = []
    total_downloaded = 0

    for topic in topics:
        slug = slugify(topic)
        tdir = outroot / slug
        tdir.mkdir(parents=True, exist_ok=True)
        print(f"\n=== Topic: {topic} ===")

        candidates = fetch_openalex(topic, args.per_topic) + fetch_arxiv(topic, args.per_topic)
        got = 0
        for c in candidates:
            if got >= args.per_topic:
                break
            key = (c["id"] or c["pdf_url"]).lower()
            if key in seen_ids:
                continue
            seen_ids.add(key)
            fname = f"{c['source']}_{safe_name(c['id'] or c['title'])}.pdf"
            dest = tdir / fname
            if dest.exists():
                continue
            ok = download_pdf(c["pdf_url"], dest)
            status = "OK " if ok else "skip"
            print(f"   [{status}] {c['title'][:70]}")
            if ok:
                got += 1
                total_downloaded += 1
                rows.append({
                    "topic": topic,
                    "source": c["source"],
                    "id": c["id"],
                    "title": c["title"],
                    "year": c["year"],
                    "venue": c["venue"],
                    "cited_by": c["cited_by"],
                    "pdf_url": c["pdf_url"],
                    "local_path": str(dest),
                    "abstract": c["abstract"],
                })
            time.sleep(0.6)  # be polite

    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "topic", "source", "id", "title", "year", "venue",
            "cited_by", "pdf_url", "local_path", "abstract",
        ])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. Downloaded {total_downloaded} PDFs into '{outroot}/'.")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
