#!/usr/bin/env bash
# Run this ON THE LOGIN NODE (which has internet) BEFORE submitting the job.
# It downloads the embedding model into the HF cache so the compute node — which
# is typically offline — can load it with HF_HUB_OFFLINE=1.
set -euo pipefail

source ~/.conda/etc/profile.d/conda.sh 2>/dev/null || true
conda activate llm

export HF_HOME="${HF_HOME:-$HOME/.cache/huggingface}"
MODEL="${TRANSFORMER_MODEL:-emilyalsentzer/Bio_ClinicalBERT}"

echo "Prefetching $MODEL into $HF_HOME ..."
python - "$MODEL" <<'PY'
import sys
from transformers import AutoModel, AutoTokenizer
m = sys.argv[1]
AutoTokenizer.from_pretrained(m)
AutoModel.from_pretrained(m)
print("OK: cached", m)
PY
echo "Done. You can now: sbatch scripts/train_transformer.sbatch"
