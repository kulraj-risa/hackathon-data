#!/usr/bin/env python3
"""Layer Cigna payer-policy criteria onto the Criteria KB.

Adds a third evidence source (payer medical policy) on top of historical PA
cases + FDA labels. Criteria/URLs extracted from Cigna's public coverage
policy PDFs (static.cigna.com). Re-runnable: skips duplicate statements.
"""
import datetime
import json
from pathlib import Path

KB = Path("app_data/criteria_kb_merged.json")
BASE = "https://static.cigna.com/assets/chcp/pdf/coveragePolicies"

# drug -> policy meta + structured criteria (statement, critical, evidence)
POLICIES = {
    "Aranesp": {
        "policy_number": "IP0293", "title": "Erythropoiesis-Stimulating Agents \u2013 Aranesp",
        "url": f"{BASE}/pharmacy/ip_0293_coveragepositioncriteria_esa_aranesp.pdf",
        "indications": ["Anemia in CKD on dialysis (approve 3y)", "Anemia in CKD not on dialysis", "Chemotherapy-induced anemia", "MDS / myelofibrosis"],
        "step_therapy": "Preferred ESA product criteria; iron therapy or adequate iron stores documented",
        "not_covered": "Uses outside listed indications considered not medically necessary.",
        "criteria": [
            ("PA required (non-dialysis-CKD uses); covered for an FDA-approved ESA indication (CKD anemia, chemotherapy-induced anemia, MDS).", True),
            ("Hemoglobin threshold met (e.g., < 10 g/dL adult for CKD not on dialysis) AND iron status documented (currently on iron therapy or adequate iron stores).", True),
            ("Preferred ESA product criteria met.", False),
        ],
    },
    "Prolia": {
        "policy_number": "IP0331", "title": "Bone Modifiers \u2013 Denosumab Products (Prolia)",
        "url": f"{BASE}/pharmacy/ip_0331_coveragepositioncriteria_denosumab_prolia.pdf",
        "indications": ["Osteoporosis (postmenopausal, men, glucocorticoid-induced)", "Bone loss with aromatase inhibitor (breast cancer)", "Bone loss with androgen-deprivation therapy (prostate cancer)"],
        "step_therapy": "\u2265 12-month trial of an oral bisphosphonate (inadequate efficacy / intolerance / contraindication) for osteoporosis",
        "not_covered": "Concurrent use with other bone modifiers / other uses not medically necessary.",
        "criteria": [
            ("PA required; covered for an FDA-approved indication (osteoporosis at high fracture risk, or cancer-therapy-induced bone loss).", True),
            ("Prerequisite: \u2265 12 months of an oral bisphosphonate with inadequate efficacy, intolerance, or contraindication (osteoporosis indication).", True),
            ("High fracture risk documented (e.g., prior osteoporotic fracture or low bone mineral density).", False),
        ],
    },
    "Xgeva": {
        "policy_number": "IP0332", "title": "Denosumab (Xgeva)",
        "url": f"{BASE}/pharmacy/ip_0332_coveragepositioncriteria_denosumab_Xgeva.pdf",
        "indications": ["Bone metastases from solid tumors (prevent skeletal-related events)", "Giant cell tumor of bone", "Hypercalcemia of malignancy", "Multiple myeloma"],
        "step_therapy": "Inadequate response/contraindication to zoledronic acid (where required); prostate cancer requires prior hormonal therapy",
        "not_covered": "Osteoporosis (use Prolia) and other uses not medically necessary.",
        "criteria": [
            ("PA required; covered for an oncology indication (bone metastases, giant cell tumor of bone, hypercalcemia of malignancy, or multiple myeloma).", True),
            ("Prescribed by or in consultation with an oncologist or hematologist.", True),
            ("Inadequate response/intolerance/contraindication to zoledronic acid documented where required; prostate cancer must have had \u2265 1 prior hormonal therapy.", False),
        ],
    },
    "Repatha": {
        "policy_number": "CNF_605", "title": "Hyperlipidemia \u2013 PCSK9 Inhibitors \u2013 Repatha",
        "url": f"{BASE}/cnf/cnf_605_coveragepositioncriteria_proprotein_convertase_subtilisin_kexin_type_9_inhibitors_repatha_pa.pdf",
        "indications": ["Reduce major adverse cardiovascular events (established CVD)", "Primary hyperlipidemia incl. HeFH and HoFH"],
        "step_therapy": "Trial of maximally tolerated high-intensity statin, or documented statin intolerance/contraindication",
        "not_covered": "Use without established CVD/familial hypercholesterolemia not medically necessary.",
        "criteria": [
            ("PA required; patient \u2265 18 with established cardiovascular disease OR familial hypercholesterolemia (HeFH/HoFH).", True),
            ("Trial of a maximally tolerated high-intensity statin, OR documented statin intolerance/contraindication.", True),
            ("LDL-C remains inadequately controlled despite optimized lipid-lowering therapy.", False),
        ],
    },
    "Ozempic": {
        "policy_number": "CNF_360", "title": "Diabetes \u2013 Glucagon-Like Peptide-1 Agonists",
        "url": f"{BASE}/cnf/cnf_360_coveragepositioncriteria_glucagon-like_peptide-1_agonists_pa.pdf",
        "indications": ["Type 2 diabetes mellitus (\u2265 18y)", "CV risk reduction in T2DM with established CVD", "CKD in T2DM"],
        "step_therapy": "Trial of metformin / first-line oral antidiabetic typically required unless contraindicated",
        "not_covered": "Weight loss, Type 1 diabetes, and diabetes prevention are not covered.",
        "criteria": [
            ("PA required; documented Type 2 diabetes mellitus and patient \u2265 18 years of age.", True),
            ("Step therapy: trial of metformin or another first-line antidiabetic agent (unless contraindicated).", False),
            ("NOT covered for weight loss, Type 1 diabetes, or diabetes prevention.", True),
        ],
    },
    "Mounjaro": {
        "policy_number": "CNF_749", "title": "Diabetes \u2013 Mounjaro",
        "url": f"{BASE}/cnf/cnf_749_coveragepositioncriteria_diabetes_mounjaro_pa.pdf",
        "indications": ["Type 2 diabetes mellitus (\u2265 18y)"],
        "step_therapy": "Trial of metformin / first-line oral antidiabetic typically required unless contraindicated",
        "not_covered": "Weight loss, Type 1 diabetes, and diabetes prevention are not covered.",
        "criteria": [
            ("PA required; documented Type 2 diabetes mellitus and patient \u2265 18 years of age.", True),
            ("Step therapy: trial of metformin or another first-line antidiabetic agent (unless contraindicated).", False),
            ("NOT covered for weight loss (BMI \u2265 27/30 without T2DM), Type 1 diabetes, or diabetes prevention.", True),
        ],
    },
    "Wegovy": {
        "policy_number": "IP0206", "title": "Weight Loss \u2013 Glucagon-Like Peptide-1 Agonists",
        "url": f"{BASE}/pharmacy/ip_0206_coveragepositioncriteria_weight_loss_glp1.pdf",
        "indications": ["Chronic weight management", "CV risk reduction in established CVD with overweight/obesity"],
        "step_therapy": "Behavioral modification / reduced-calorie diet for \u2265 3 months; reauth requires \u2265 5% weight loss",
        "not_covered": "Coverage is excluded entirely under many employer plans (benefit exclusion).",
        "criteria": [
            ("PA required; patient \u2265 18 used with a reduced-calorie diet and increased physical activity.", True),
            ("Baseline BMI \u2265 30, OR BMI \u2265 27 with at least one weight-related comorbidity (HTN, T2DM, dyslipidemia, OSA, etc.).", True),
            ("Documented behavioral modification / reduced-calorie diet for \u2265 3 months.", True),
            ("Reauthorization: documented loss of \u2265 5% of baseline body weight.", False),
        ],
    },
    "Zepbound": {
        "policy_number": "IP0206", "title": "Weight Loss \u2013 Glucagon-Like Peptide-1 Agonists",
        "url": f"{BASE}/pharmacy/ip_0206_coveragepositioncriteria_weight_loss_glp1.pdf",
        "indications": ["Chronic weight management", "Moderate-to-severe obstructive sleep apnea in obesity"],
        "step_therapy": "Behavioral modification / reduced-calorie diet for \u2265 3 months; reauth requires \u2265 5% weight loss",
        "not_covered": "Coverage is excluded entirely under many employer plans (benefit exclusion).",
        "criteria": [
            ("PA required; patient \u2265 18 used with a reduced-calorie diet and increased physical activity.", True),
            ("Baseline BMI \u2265 30, OR BMI \u2265 27 with at least one weight-related comorbidity.", True),
            ("Documented behavioral modification / reduced-calorie diet for \u2265 3 months.", True),
            ("Reauthorization: documented loss of \u2265 5% of baseline body weight.", False),
        ],
    },
    "Lupron": {
        "policy_number": "IP0109", "title": "Gonadotropin-Releasing Hormone Agonists \u2013 Lupron Depot",
        "url": f"{BASE}/pharmacy/ip_0109_coveragepositioncriteria_leuprolide_la.pdf",
        "indications": ["Endometriosis", "Uterine fibroids", "Prostate cancer", "Central precocious puberty"],
        "step_therapy": "Endometriosis: prior contraceptive, oral progesterone, or depo-medroxyprogesterone (unless prior GnRH agonist/antagonist)",
        "not_covered": "Infertility addressed under a separate policy.",
        "criteria": [
            ("PA required; covered FDA indication (endometriosis, uterine fibroids, prostate cancer, or central precocious puberty).", True),
            ("Endometriosis: prior trial of a contraceptive, oral progesterone, or depo-medroxyprogesterone (unless prior GnRH agonist/antagonist use).", True),
            ("Prostate cancer: prescribed by or in consultation with an oncologist and preferred-product criteria met.", False),
        ],
    },
    "Gemtesa": {
        "policy_number": "CNF_069", "title": "Step Therapy \u2013 Overactive Bladder Medications",
        "url": f"{BASE}/cnf/cnf_069_coveragepositioncriteria_overactive_bladder_medications_st.pdf",
        "indications": ["Overactive bladder (urge incontinence, urgency, frequency)"],
        "step_therapy": "Gemtesa is a Step 2 product \u2013 trial of one Step 1 OAB product required first",
        "not_covered": "Use without trying a Step 1 product (other than listed exceptions) not medically necessary.",
        "criteria": [
            ("Step therapy: documented trial of at least one Step 1 overactive-bladder product before Gemtesa.", True),
            ("Exception: patient \u2265 65 years of age may be approved for Gemtesa directly.", False),
            ("Overactive bladder diagnosis documented (urge incontinence, urgency, urinary frequency).", False),
        ],
    },
    "Akynzeo": {
        "policy_number": "PH_1705", "title": "Antiemetic Therapy",
        "url": f"{BASE}/pharmacy/ph_1705_coveragepositioncriteria_antiemetics.pdf",
        "indications": ["Prevention of chemotherapy-induced nausea and vomiting (CINV)"],
        "step_therapy": "Used in combination with dexamethasone; IV antineoplastic therapy of high/moderate emetic risk",
        "not_covered": "Quantity beyond 4 capsules per 28 days not covered.",
        "criteria": [
            ("Adult, used in combination with dexamethasone for prevention of chemotherapy-induced nausea and vomiting.", True),
            ("Receiving IV antineoplastic therapy of high or moderate emetic risk.", True),
            ("Quantity limit: maximum of 4 capsules per 28 days.", False),
        ],
    },
    "Udenyca": {
        "policy_number": "IP0070", "title": "Colony Stimulating Factors \u2013 Pegfilgrastim Products",
        "url": f"{BASE}/pharmacy/ip_0070_coveragepositioncriteria_pegfilgrastim.pdf",
        "indications": ["Prophylaxis of febrile neutropenia in myelosuppressive chemotherapy", "Hematopoietic subsyndrome of acute radiation syndrome"],
        "step_therapy": "Preferred pegfilgrastim product (Fulphila or Ziextenzo) on some formularies; Udenyca is non-preferred (PSM CNF_266)",
        "not_covered": "Use outside listed indications not medically necessary.",
        "criteria": [
            ("PA required; cancer patient receiving myelosuppressive chemotherapy with \u2265 20% febrile-neutropenia risk (or prior neutropenic complication).", True),
            ("Preferred-product step therapy: trial of Fulphila or Ziextenzo (Udenyca is non-preferred on some formularies).", True),
            ("Dosing per label (e.g., 6 mg per chemotherapy cycle ~24h after chemo).", False),
        ],
    },
}

kb = json.loads(KB.read_text())
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
updated = []
for drug, p in POLICIES.items():
    if drug not in kb:
        print(f"  ! {drug} not in KB, skipping")
        continue
    entry = kb[drug]
    existing = {c["statement"] for c in entry.get("criteria", [])}
    new = []
    for stmt, critical in p["criteria"]:
        if stmt in existing:
            continue
        new.append({
            "statement": stmt, "critical": critical, "source": "payer_policy",
            "payer": "Cigna", "policy": p["policy_number"],
            "evidences": {"positive": "", "negative": ""},
        })
    entry.setdefault("criteria", []).extend(new)
    entry.setdefault("sources", {})["payer_policy"] = True
    entry.setdefault("payer_policies", {})["Cigna"] = {
        "policy_number": p["policy_number"], "title": p["title"], "source_url": p["url"],
        "pa_required": True, "covered_indications": p["indications"],
        "step_therapy": p["step_therapy"], "not_covered": p["not_covered"],
    }
    entry["criteria_count"] = len(entry["criteria"])
    entry["critical_count"] = sum(1 for c in entry["criteria"] if c.get("critical"))
    entry["updated_at"] = now
    updated.append(f"{drug} (+{len(new)})")

KB.write_text(json.dumps(kb, indent=2))
n_payer = sum(1 for d in kb.values() if d.get("sources", {}).get("payer_policy"))
print("Updated:", ", ".join(updated))
print(f"Drugs with Cigna payer policy now: {n_payer}/{len(kb)}")
