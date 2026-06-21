"""Prompt templates for LLM-based scientific measurement extraction."""

ALLOWED_PROPERTIES = [
    "adsorption_energy",
    "rdf_peak",
    "diffusion_coefficient",
    "msd",
    "temperature",
    "dft_functional",
    "forcefield",
]

SYSTEM_PROMPT = (
    "You are a meticulous scientific information-extraction engine for materials "
    "science and molecular simulation literature (adsorption, DFT, molecular dynamics). "
    "You read a passage of a paper and extract structured measurements. "
    "You output ONLY valid JSON. You never invent values: if a value is not explicitly "
    "stated in the passage, you do not emit it. Every emitted measurement must be supported "
    "by an exact quote from the passage in the 'evidence' field."
)

# Note: braces in the JSON examples are intentional literal braces (not f-string).
USER_TEMPLATE = """Extract scientific measurements from the passage below.

Only extract these property types:
- "adsorption_energy"      : adsorption or binding energy (units: eV, kJ/mol, kcal/mol)
- "rdf_peak"               : radial distribution function g(r) peak position (units: Angstrom, nm)
- "diffusion_coefficient"  : diffusion / self-diffusion coefficient (units: cm^2/s, m^2/s)
- "msd"                    : mean squared displacement value/slope (units: nm^2, Angstrom^2, or nm^2/ns)
- "temperature"            : simulation/experiment temperature (units: K, C)
- "dft_functional"         : DFT exchange-correlation functional NAME (e.g. PBE, HSE06, vdW-DF2). value=name, unit=null
- "forcefield"             : MD force field NAME (e.g. OPLS-AA, CHARMM36, GAFF). value=name, unit=null

Rules:
1. Return a JSON array of objects. If nothing is found, return [].
2. Each object MUST have keys:
   "property", "value", "unit", "material", "adsorbate", "temperature_K", "evidence", "confidence"
3. "value": number for numeric properties; the name string for dft_functional/forcefield.
4. "unit": original unit string, or null for functional/forcefield.
5. "material": the material/surface the value refers to (e.g. "g-C3N4"), else null.
6. "adsorbate": the adsorbed molecule/ion (e.g. "tetracycline"), else null.
7. "temperature_K": associated temperature in Kelvin if stated nearby, else null.
8. "evidence": an EXACT substring quote from the passage supporting this measurement.
9. "confidence": float 0-1, your confidence the extraction is correct and unambiguous.
10. Do NOT extract page numbers, reference indices, equation numbers, or axis labels as temperatures.

Example output:
[
  {"property": "adsorption_energy", "value": -1.82, "unit": "eV", "material": "g-C3N4",
   "adsorbate": "tetracycline", "temperature_K": null,
   "evidence": "the adsorption energy of tetracycline on g-C3N4 was calculated to be -1.82 eV",
   "confidence": 0.93},
  {"property": "dft_functional", "value": "vdW-DF2", "unit": null, "material": null,
   "adsorbate": null, "temperature_K": null,
   "evidence": "exchange-correlation was described by the vdW-DF2 functional", "confidence": 0.9}
]

PASSAGE:
\"\"\"
{passage}
\"\"\"

Return ONLY the JSON array."""


def build_messages(passage: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_TEMPLATE.replace("{passage}", passage)},
    ]
