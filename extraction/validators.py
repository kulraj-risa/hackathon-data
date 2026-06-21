"""Validation + unit normalization for extracted scientific measurements.

Pure-Python (no third-party deps) so it runs anywhere. Converts every numeric
property to SI-ish canonical units and applies physical sanity bounds.
"""
from __future__ import annotations

import re
from typing import Any, Optional

# ---- unit conversion constants ----
EV_PER_KJMOL = 1.0 / 96.485
EV_PER_KCALMOL = 1.0 / 23.061

KNOWN_FUNCTIONALS = {
    "PBE", "PBESOL", "PW91", "BLYP", "B3LYP", "HSE06", "HSE", "VDW-DF", "VDW-DF2",
    "OPTB88", "OPTB86B", "SCAN", "RPBE", "PBE0", "LDA", "REVPBE", "BEEF-VDW",
}
KNOWN_FORCEFIELDS = {
    "OPLS-AA", "OPLS", "CHARMM36", "CHARMM27", "CHARMM", "AMBER", "GAFF", "GAFF2",
    "GROMOS", "REAXFF", "COMPASS", "TIP3P", "SPC/E", "SPC", "TIP4P", "TIP4P/2005",
}

CANONICAL = {
    "adsorption_energy": "eV",
    "rdf_peak": "Angstrom",
    "diffusion_coefficient": "m^2/s",
    "msd": "nm^2",
    "temperature": "K",
    "dft_functional": None,
    "forcefield": None,
}

VALID_PROPERTIES = set(CANONICAL.keys())


def _round_sig(x: float, sig: int = 6) -> float:
    if x == 0 or x != x:  # zero or NaN
        return x
    import math
    return round(x, -int(math.floor(math.log10(abs(x)))) + (sig - 1))


def _to_float(x: Any) -> Optional[float]:
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        m = re.search(r"-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", x.replace("×10", "e").replace("x10", "e"))
        if m:
            try:
                return float(m.group(0))
            except ValueError:
                return None
    return None


def _clean_unit(u: Any) -> str:
    if not u:
        return ""
    return str(u).lower().replace(" ", "").replace("^", "").replace("·", "")


def normalize(prop: str, value: Any, unit: Any) -> tuple[Optional[float], Optional[str], Optional[str]]:
    """Return (value_si, unit_si, normalized_string_value_for_categorical)."""
    if prop == "dft_functional":
        name = str(value).strip().upper()
        return None, None, name
    if prop == "forcefield":
        name = str(value).strip().upper()
        return None, None, name

    v = _to_float(value)
    if v is None:
        return None, None, None
    u = _clean_unit(unit)

    if prop == "adsorption_energy":
        if u in ("ev", ""):
            return v, "eV", None
        if u.startswith("kj"):
            return v * EV_PER_KJMOL, "eV", None
        if u.startswith("kcal"):
            return v * EV_PER_KCALMOL, "eV", None
        return None, None, None

    if prop == "rdf_peak":
        if u.startswith("nm"):
            return v * 10.0, "Angstrom", None
        return v, "Angstrom", None  # Angstrom / A / angstrom

    if prop == "diffusion_coefficient":
        # The LLM sometimes embeds the exponent in the unit, e.g. "x10-9m2/s".
        exp_match = re.search(r"(?:10|e)(-?\d+)", u)
        factor = 10.0 ** int(exp_match.group(1)) if exp_match else 1.0
        if "cm2/s" in u:
            return v * factor * 1e-4, "m^2/s", None
        if "m2/s" in u:
            return v * factor, "m^2/s", None
        return None, None, None

    if prop == "msd":
        if u.startswith("angstrom") or u in ("a2", "å2", "ang2"):
            return v / 100.0, "nm^2", None  # 1 nm^2 = 100 Angstrom^2
        return v, "nm^2", None

    if prop == "temperature":
        if "c" in u and "k" not in u:
            return v + 273.15, "K", None
        return v, "K", None

    return None, None, None


def sanity_ok(prop: str, value_si: Optional[float]) -> bool:
    if value_si is None:
        return True  # categorical handled elsewhere
    if prop == "adsorption_energy":
        return -12.0 <= value_si <= 5.0
    if prop == "rdf_peak":
        return 0.5 <= value_si <= 20.0
    if prop == "diffusion_coefficient":
        return 0.0 < value_si <= 1e-3
    if prop == "msd":
        return 0.0 <= value_si <= 1e5
    if prop == "temperature":
        return 1.0 <= value_si <= 5000.0
    return True


def validate(raw: dict, *, min_confidence: float = 0.4) -> Optional[dict]:
    """Validate one raw LLM measurement dict. Returns cleaned dict or None."""
    if not isinstance(raw, dict):
        return None
    prop = str(raw.get("property", "")).strip().lower()
    if prop not in VALID_PROPERTIES:
        return None

    try:
        conf = float(raw.get("confidence", 0.5))
    except (TypeError, ValueError):
        conf = 0.5
    if conf < min_confidence:
        return None

    evidence = (raw.get("evidence") or "").strip()
    if prop in ("adsorption_energy", "rdf_peak", "diffusion_coefficient", "msd", "temperature") and not evidence:
        return None

    value_si, unit_si, cat = normalize(prop, raw.get("value"), raw.get("unit"))

    if prop == "dft_functional":
        if not cat:
            return None
        base = cat.replace(" ", "")
        if base not in KNOWN_FUNCTIONALS and not any(k in base for k in KNOWN_FUNCTIONALS):
            return None
        value_out, unit_out = cat, None
    elif prop == "forcefield":
        if not cat:
            return None
        base = cat.replace(" ", "")
        if base not in KNOWN_FORCEFIELDS and not any(k in base for k in KNOWN_FORCEFIELDS):
            return None
        value_out, unit_out = cat, None
    else:
        if value_si is None or not sanity_ok(prop, value_si):
            return None
        value_out, unit_out = _round_sig(value_si, 6), unit_si

    temp_k = raw.get("temperature_K")
    temp_k = _to_float(temp_k) if temp_k is not None else None
    if temp_k is not None and not (1.0 <= temp_k <= 5000.0):
        temp_k = None

    return {
        "property": prop,
        "value_raw": raw.get("value"),
        "unit_raw": raw.get("unit"),
        "value_si": value_out,
        "unit_si": unit_out,
        "material": (raw.get("material") or None),
        "adsorbate": (raw.get("adsorbate") or None),
        "temperature_K": temp_k,
        "confidence": round(conf, 3),
        "evidence": evidence[:500],
    }


def dedup_key(m: dict, paper_file: str) -> tuple:
    return (
        paper_file,
        m["property"],
        m["value_si"] if m["value_si"] is not None else str(m["value_raw"]).upper(),
        (m["material"] or "").lower(),
        (m["adsorbate"] or "").lower(),
    )
