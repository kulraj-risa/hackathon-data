# ClinicalBERT embedding branch — how to run it (safely) on PARAM Shivay

**Goal:** test whether contextual clinical embeddings beat the deployed TF-IDF
model (AUC 0.83). Same numeric features, same XGBoost head — only the text
channel changes (TF-IDF → ClinicalBERT mean-pooled embeddings).

**This branch is experimental and offline.** It is *not* part of the Cloud Run
serving image (the embedding model is ~440 MB). It produces a number and a
saved model in `models/` you can cite — nothing more.

Files:
- `train_transformer.py` — the trainer (embeddings → XGBoost).
- `scripts/prefetch_model.sh` — download the model on the **login node**.
- `scripts/train_transformer.sbatch` — the SLURM job for a **compute node**.
- `requirements-transformer.txt` — extra deps for your `llm` conda env.

---

## ⚠️ STEP 0 — Data governance (read before uploading anything)

`data/training_data.parquet` contains **real clinical evidence text** derived
from patient PAs. PARAM Shivay is a **shared academic cluster**. Do **not**
upload that file unless ALL of the following are true:

1. The data is **confirmed de-identified** (no names, MRNs, DOBs in the fact
   strings), **and**
2. Your RISA data-governance lead has **explicitly approved** storing it on
   IIT-BHU infrastructure.

**The safe path is now automated — run the de-identifier first (locally, on your Mac):**

```bash
./venv/bin/python deidentify.py
```

This produces `data/training_data_deid.parquet`, which:

- **Drops** every direct identifier column (`identifier`, `covermymed_id`,
  `created_at`, `submitted_at`, `medication_name`) and keeps only label, counts,
  drug class, payer, and the scrubbed facts/answers the model embeds.
- **Scrubs** all remaining free text for HIPAA Safe-Harbor identifiers — dates,
  phone/fax, SSN, MRN/member/record ids, email, URL, IP, ages > 89, long digit
  runs. ICD-10 codes (e.g. `F41.9`) and dosages (`300 mg`) are kept as clinical
  signal. The script prints a **verification report** (should show 0 residual
  dates/emails/ids) plus before/after samples.

Then **only upload `data/training_data_deid.parquet`** — never the raw file. And still:

- Keep it in your **private** `$HOME`/scratch (`chmod 700`), never group-readable.
- **Delete when done:** `rm data/training_data_deid.parquet data/emb_*.npy`.
- Bring back only the **model + metrics** (`models/denial_transformer.pkl`).
- **This reduces risk; it is not a compliance guarantee** (regex can't catch a
  name buried mid-sentence). Get data-governance sign-off before upload.

> The whole production design keeps PHI off third-party machines. This branch is
> the one exception, so gate it behind real approval — and the de-identifier.

---

## STEP 1 — One-time env setup (login node)

```bash
ssh <you>@paramshivay.iitbhu.ac.in
conda activate llm                       # the env you already built
cd ~/hackathon-risa                      # wherever you cloned the repo
pip install -r requirements-transformer.txt
```

## STEP 2 — Prefetch the model (login node — it has internet)

Compute nodes are usually **offline**, so cache the model first:

```bash
bash scripts/prefetch_model.sh
# downloads emilyalsentzer/Bio_ClinicalBERT into ~/.cache/huggingface
```

## STEP 3 — Run on a compute node (NOT the login node)

**Option A — batch (recommended).** Edit the `#SBATCH -A <your_account>` line
first, then:

```bash
sbatch scripts/train_transformer.sbatch
squeue -u $USER                          # watch it queue/run
tail -f logs/clinbert_*.log              # live output
```

**Option B — interactive** (good for debugging):

```bash
salloc -N1 -n8 --partition=gpu --gres=gpu:1 --time=00:30:00
hostname                                 # should print cnXXX / gpuXXX, not login2
conda activate llm
export HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1
python train_transformer.py              # add --max-rows 500 for a fast smoke test
exit                                     # release the node when done!
```

**No GPU / GPU queue full?** It runs on CPU too — drop `--gres=gpu:1` and use the
`cpu` partition. ~10k embeddings on CPU is a few minutes.

## STEP 4 — Read the result

The log ends with a comparison block:

```
numeric-only ......... AUC 0.642
numeric + TF-IDF ..... AUC 0.830   <-- currently deployed
numeric + Bio_ClinicalBERT ... AUC 0.8XX
Verdict: ...
```

- **If it beats 0.83** → great, cite it as a result; we can discuss promoting it
  (note: serving would then need an embedding step, so it stays a research result
  unless you want to add an embedding microservice).
- **If it doesn't** → also a real finding: "TF-IDF is competitive and cheaper" is
  a legitimate, defensible slide. Either way you have a genuine HPC experiment.

## STEP 5 — Clean up

```bash
exit                                     # free any salloc allocation
rm -f data/emb_*.npy                     # embedding cache (derived from text)
# and, if you uploaded it, remove the dataset per STEP 0
```

---

### Safety checklist
- [ ] Data clearance confirmed (STEP 0) before any upload
- [ ] Ran on `cnXXX`/`gpuXXX`, never `login2`
- [ ] `#SBATCH -A <account>` set
- [ ] Model prefetched on login node; job ran with `*_OFFLINE=1`
- [ ] Allocation released (`exit` / job completed)
- [ ] Caches/data cleaned up afterward
