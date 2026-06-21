#!/usr/bin/env python3
"""Extract scientific facts from downloaded PDFs (Section 10 of the blueprint).

Pulls, with provenance (paper, page, sentence snippet):
  - adsorption / binding energy  (normalized to eV)
  - diffusion coefficient        (normalized to m^2/s)
  - RDF first-peak position      (normalized to Angstrom)
  - MSD mentions
  - temperatures                 (normalized to K)
  - DFT params  (functional, ecutwfc, k-points, vdW correction)
  - MD params   (forcefield, ensemble, timestep, water model)

Outputs:
  data/extracted_facts.jsonl   one JSON fact per line
  data/extracted_facts.csv     flat table
  prints a summary to stdout

Usage:
  python3 scripts/extract_facts.py
  python3 scripts/extract_facts.py --papers papers --limit 0
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

# ---------- unit normalization ----------
EV_PER_KJMOL = 1.0 / 96.485
EV_PER_KCALMOL = 1.0 / 23.061


def to_eV(value: float, unit: str) -> float | None:
    u = unit.lower().replace(" ", "")
    if u == "ev":
        return value
    if u.startswith("kj"):
        return value * EV_PER_KJMOL
    if u.startswith("kcal"):
        return value * EV_PER_KCALMOL
    return None


def diff_to_m2s(mantissa: float, exp: str | None, unit: str) -> float | None:
    val = mantissa * (10 ** int(exp)) if exp not in (None, "") else mantissa
    u = unit.lower().replace(" ", "").replace("^", "")
    if u in ("m2/s",):
        return val
    if u in ("cm2/s",):
        return val * 1e-4
    return None


def angstrom(value: float, unit: str) -> float:
    u = unit.lower()
    if u.startswith("nm"):
        return value * 10.0
    return value  # Angstrom


def temp_to_K(value: float, unit: str) -> float:
    return value + 273.15 if "c" in unit.lower() else value

# ---------- regex patterns ----------
NUM = r"-?\d+(?:\.\d+)?"

PATTERNS = {
    "adsorption_energy": re.compile(
        r"(?:adsorption|binding)\s+energ(?:y|ies)[^.\n]{0,80}?"
        rf"({NUM})\s*(eV|kJ\s*/?\s*mol|kcal\s*/?\s*mol)", re.I),
    "diffusion_coeff": re.compile(
        rf"diffusion\s+coefficient[^.\n]{{0,80}}?({NUM})\s*(?:[x×]\s*10\s*[\^]?\s*(-?\d+))?\s*"
        r"(cm\s*\^?2\s*/\s*s|m\s*\^?2\s*/\s*s)", re.I),
    "rdf_peak": re.compile(
        r"(?:radial distribution function|g\(r\))[^.\n]{0,90}?(?:peak|maximum|first)[^.\n]{0,40}?"
        rf"({NUM})\s*(Å|A|nm|angstrom)", re.I),
    "msd": re.compile(r"mean\s+squared?\s+displacement|\bMSD\b", re.I),
    "temperature": re.compile(rf"\b({NUM})\s*(K|°\s*C|deg\s*C)\b"),
    # DFT params
    "dft_functional": re.compile(r"\b(PBE(?:sol)?|PW91|BLYP|B3LYP|HSE06|HSE|vdW-DF2?|optB88|SCAN|RPBE)\b"),
    "dft_ecutwfc": re.compile(rf"(?:cut[- ]?off|ecutwfc|kinetic energy cut[- ]?off)[^.\n]{{0,40}}?({NUM})\s*(Ry|eV)", re.I),
    "dft_kpoints": re.compile(r"(\d{1,2}\s*[x×]\s*\d{1,2}\s*[x×]\s*\d{1,2})\s*(?:Monkhorst|k[- ]?point|mesh|grid)?", re.I),
    "dft_vdw": re.compile(r"\b(DFT-D3|DFT-D2|Grimme|Tkatchenko[- ]?Scheffler|TS|vdW correction)\b", re.I),
    # MD params
    "md_forcefield": re.compile(r"\b(OPLS-AA|OPLS|CHARMM(?:36|27)?|AMBER|GAFF2?|GROMOS|ReaxFF|COMPASS)\b"),
    "md_ensemble": re.compile(r"\b(NVT|NPT|NVE)\b"),
    "md_timestep": re.compile(rf"time\s*step[^.\n]{{0,30}}?({NUM})\s*(fs|ps)", re.I),
    "md_water": re.compile(r"\b(SPC/E|SPC|TIP3P|TIP4P(?:/2005)?|TIP5P)\b"),
}

# Physical sanity bounds (after normalization)
def sane_eV(x: float) -> bool: return -12.0 <= x <= 5.0
def sane_temp(x: float) -> bool: return 1.0 <= x <= 5000.0


def snippet(text: str, start: int, end: int, pad: int = 90) -> str:
    s = max(0, start - pad)
    e = min(len(text), end + pad)
    return re.sub(r"\s+", " ", text[s:e]).strip()


def load_manifest(papers_dir: Path) -> dict[str, dict]:
    mp = {}
    mf = papers_dir / "manifest.csv"
    if mf.exists():
        with open(mf, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                lp = row.get("local_path", "")
                if lp:
                    mp[str(Path(lp).resolve())] = row
    return mp


def extract_pdf(path: Path, meta: dict) -> list[dict]:
    facts: list[dict] = []
    try:
        doc = fitz.open(path)
    except Exception as e:
        print(f"   [open error] {path.name}: {e}", file=sys.stderr)
        return facts
    doi = (meta.get("id") or "") if meta else ""
    title = (meta.get("title") or path.stem) if meta else path.stem
    topic = (meta.get("topic") or path.parent.name) if meta else path.parent.name

    for pno, page in enumerate(doc, start=1):
        try:
            text = page.get_text()
        except Exception:
            continue
        if not text:
            continue
        for prop, rx in PATTERNS.items():
            for m in rx.finditer(text):
                fact = {
                    "paper_file": path.name, "doi": doi, "title": title,
                    "topic": topic, "page": pno, "property": prop,
                    "raw": re.sub(r"\s+", " ", m.group(0)).strip(),
                    "value": None, "unit": None, "value_si": None, "unit_si": None,
                    "sentence": snippet(text, m.start(), m.end()),
                }
                try:
                    if prop == "adsorption_energy":
                        v = float(m.group(1)); ev = to_eV(v, m.group(2))
                        if ev is None or not sane_eV(ev):
                            continue
                        fact.update(value=v, unit=m.group(2), value_si=round(ev, 4), unit_si="eV")
                    elif prop == "diffusion_coeff":
                        v = float(m.group(1)); si = diff_to_m2s(v, m.group(2), m.group(3))
                        fact.update(value=v, unit=m.group(3), value_si=si, unit_si="m^2/s")
                    elif prop == "rdf_peak":
                        v = float(m.group(1))
                        fact.update(value=v, unit=m.group(2), value_si=round(angstrom(v, m.group(2)), 3), unit_si="Angstrom")
                    elif prop == "temperature":
                        v = float(m.group(1)); k = temp_to_K(v, m.group(2))
                        if not sane_temp(k):
                            continue
                        fact.update(value=v, unit=m.group(2), value_si=round(k, 2), unit_si="K")
                    elif prop == "dft_ecutwfc":
                        fact.update(value=float(m.group(1)), unit=m.group(2))
                    else:
                        fact.update(value=m.group(1) if m.groups() else m.group(0))
                except Exception:
                    continue
                facts.append(fact)
    doc.close()
    return facts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--papers", default="papers")
    ap.add_argument("--outdir", default="data")
    ap.add_argument("--limit", type=int, default=0, help="0 = all")
    args = ap.parse_args()

    papers_dir = Path(args.papers)
    outdir = Path(args.outdir); outdir.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest(papers_dir)
    pdfs = sorted(papers_dir.rglob("*.pdf"))
    if args.limit:
        pdfs = pdfs[: args.limit]

    print(f"Parsing {len(pdfs)} PDFs ...")
    all_facts: list[dict] = []
    papers_with_eads = set()
    for i, pdf in enumerate(pdfs, 1):
        meta = manifest.get(str(pdf.resolve()), {})
        facts = extract_pdf(pdf, meta)
        all_facts.extend(facts)
        if any(f["property"] == "adsorption_energy" for f in facts):
            papers_with_eads.add(pdf.name)
        if i % 10 == 0 or i == len(pdfs):
            print(f"  [{i}/{len(pdfs)}] {pdf.name[:50]:50}  facts so far: {len(all_facts)}")

    # write outputs
    jsonl = outdir / "extracted_facts.jsonl"
    with open(jsonl, "w", encoding="utf-8") as f:
        for fact in all_facts:
            f.write(json.dumps(fact, ensure_ascii=False) + "\n")
    csvp = outdir / "extracted_facts.csv"
    cols = ["paper_file", "doi", "title", "topic", "page", "property", "raw", "value", "unit", "value_si", "unit_si", "sentence"]
    with open(csvp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader()
        for fact in all_facts:
            w.writerow({k: fact.get(k) for k in cols})

    # summary
    counts: dict[str, int] = {}
    for fact in all_facts:
        counts[fact["property"]] = counts.get(fact["property"], 0) + 1
    print("\n=== EXTRACTION SUMMARY ===")
    print(f"PDFs parsed:            {len(pdfs)}")
    print(f"Total facts extracted:  {len(all_facts)}")
    print(f"Papers w/ E_ads:        {len(papers_with_eads)}")
    print("\nFacts by property:")
    for k in sorted(counts, key=lambda x: -counts[x]):
        print(f"  {k:22} {counts[k]}")

    # show a few example adsorption energies
    eads = [f for f in all_facts if f["property"] == "adsorption_energy"][:8]
    if eads:
        print("\nSample adsorption energies (normalized to eV):")
        for f in eads:
            print(f"  {f['value_si']:>7} eV  | {f['paper_file'][:32]:32} p{f['page']} | {f['sentence'][:70]}")
    print(f"\nWrote:\n  {jsonl}\n  {csvp}")


if __name__ == "__main__":
    main()
