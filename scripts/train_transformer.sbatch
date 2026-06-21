#!/usr/bin/env bash
#SBATCH --job-name=risa-clinbert
#SBATCH --partition=gpu              # PARAM Shivay GPU partition (gpu[001-011])
#SBATCH --gres=gpu:1                 # 1 GPU; remove to fall back to CPU partition
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --time=00:30:00              # 30 min is ample for ~10k embeddings
#SBATCH --output=logs/clinbert_%j.log
#SBATCH --error=logs/clinbert_%j.log
# #SBATCH -A <your_account>          # <-- REQUIRED on PARAM Shivay: set your account

set -euo pipefail

# --- environment ----------------------------------------------------------
# Activate the conda env you already built (torch + transformers live here).
source ~/.conda/etc/profile.d/conda.sh 2>/dev/null || true
conda activate llm

# --- run OFFLINE ----------------------------------------------------------
# Compute nodes usually have NO internet. The model MUST already be in the HF
# cache (run scripts/prefetch_model.sh on the LOGIN node first). These flags
# make HF fail fast instead of hanging on a network call.
export HF_HOME="${HF_HOME:-$HOME/.cache/huggingface}"
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export TOKENIZERS_PARALLELISM=false
export OMP_NUM_THREADS="${SLURM_CPUS_PER_TASK:-8}"

cd "${SLURM_SUBMIT_DIR:-$PWD}"
mkdir -p logs

echo "Host: $(hostname)   Job: ${SLURM_JOB_ID:-local}"
nvidia-smi --query-gpu=name,memory.total --format=csv 2>/dev/null || echo "no GPU visible -> CPU"

python train_transformer.py \
  --model "${TRANSFORMER_MODEL:-emilyalsentzer/Bio_ClinicalBERT}" \
  --batch-size "${BATCH_SIZE:-32}" \
  --max-len "${MAX_LEN:-256}"

echo "Done."
