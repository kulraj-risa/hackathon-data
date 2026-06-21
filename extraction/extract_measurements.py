"""Local Qwen 2.5 inference client + single-passage measurement extraction.

Supports three backends (selected via env var QWEN_BACKEND):
  - "vllm" / "openai"  : OpenAI-compatible HTTP server (default; e.g. `vllm serve`)
  - "ollama"           : local Ollama daemon
  - "transformers"     : load the model in-process with HuggingFace transformers

Environment variables:
  QWEN_BACKEND   default "vllm"
  QWEN_BASE_URL  default "http://localhost:8000/v1"   (vllm/openai)
  QWEN_MODEL     default "Qwen/Qwen2.5-14B-Instruct"
  QWEN_API_KEY   default "EMPTY"
  OLLAMA_URL     default "http://localhost:11434"
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import prompts  # noqa: E402
import validators  # noqa: E402

DEFAULT_MODEL = os.environ.get("QWEN_MODEL", "Qwen/Qwen2.5-14B-Instruct")
BACKEND = os.environ.get("QWEN_BACKEND", "vllm").lower()


class QwenClient:
    def __init__(self, backend: str = BACKEND, model: str = DEFAULT_MODEL,
                 temperature: float = 0.0, max_tokens: int = 1536):
        self.backend = backend
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._hf = None
        if backend in ("vllm", "openai"):
            import requests  # noqa: F401
            self.base_url = os.environ.get("QWEN_BASE_URL", "http://localhost:8000/v1").rstrip("/")
            self.api_key = os.environ.get("QWEN_API_KEY", "EMPTY")
        elif backend == "ollama":
            self.ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
        elif backend == "transformers":
            self._init_transformers()
        else:
            raise ValueError(f"Unknown QWEN_BACKEND: {backend}")

    def _init_transformers(self):
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
        self._tok = AutoTokenizer.from_pretrained(self.model)
        self._model = AutoModelForCausalLM.from_pretrained(
            self.model, torch_dtype="auto", device_map="auto"
        )
        self._torch = torch

    def chat(self, messages: list[dict]) -> str:
        if self.backend in ("vllm", "openai"):
            return self._chat_openai(messages)
        if self.backend == "ollama":
            return self._chat_ollama(messages)
        return self._chat_transformers(messages)

    def _chat_openai(self, messages, retries: int = 3) -> str:
        import requests
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.model, "messages": messages,
            "temperature": self.temperature, "max_tokens": self.max_tokens,
        }
        last = None
        for attempt in range(retries):
            try:
                r = requests.post(url, headers=headers, json=payload, timeout=180)
                r.raise_for_status()
                return r.json()["choices"][0]["message"]["content"]
            except Exception as e:  # noqa: BLE001
                last = e
                time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"vLLM/OpenAI request failed: {last}")

    def _chat_ollama(self, messages, retries: int = 3) -> str:
        import requests
        url = f"{self.ollama_url}/api/chat"
        payload = {
            "model": self.model, "messages": messages, "stream": False,
            "options": {"temperature": self.temperature, "num_predict": self.max_tokens},
        }
        last = None
        for attempt in range(retries):
            try:
                r = requests.post(url, json=payload, timeout=300)
                r.raise_for_status()
                return r.json()["message"]["content"]
            except Exception as e:  # noqa: BLE001
                last = e
                time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"Ollama request failed: {last}")

    def _chat_transformers(self, messages) -> str:
        text = self._tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self._tok([text], return_tensors="pt").to(self._model.device)
        with self._torch.no_grad():
            out = self._model.generate(
                **inputs, max_new_tokens=self.max_tokens,
                do_sample=self.temperature > 0, temperature=max(self.temperature, 1e-5),
            )
        gen = out[0][inputs["input_ids"].shape[1]:]
        return self._tok.decode(gen, skip_special_tokens=True)


def _parse_json_array(text: str) -> list:
    """Robustly pull a JSON array out of an LLM response."""
    if not text:
        return []
    t = text.strip()
    t = re.sub(r"^```(?:json)?", "", t).strip()
    t = re.sub(r"```$", "", t).strip()
    try:
        obj = json.loads(t)
        return obj if isinstance(obj, list) else [obj]
    except json.JSONDecodeError:
        pass
    start = t.find("[")
    end = t.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            obj = json.loads(t[start:end + 1])
            return obj if isinstance(obj, list) else [obj]
        except json.JSONDecodeError:
            return []
    return []


def extract_from_passage(client: QwenClient, passage: str, *, min_confidence: float = 0.4) -> list[dict]:
    """Run one LLM call on a passage and return validated measurement dicts."""
    if not passage or not passage.strip():
        return []
    messages = prompts.build_messages(passage)
    raw_text = client.chat(messages)
    items = _parse_json_array(raw_text)
    out = []
    for it in items:
        cleaned = validators.validate(it, min_confidence=min_confidence)
        if cleaned:
            out.append(cleaned)
    return out


def chunk_text(text: str, chunk_chars: int = 3500, overlap: int = 300) -> list[str]:
    text = re.sub(r"[ \t]+", " ", text)
    chunks, i, n = [], 0, len(text)
    while i < n:
        chunks.append(text[i:i + chunk_chars])
        i += chunk_chars - overlap
    return chunks


if __name__ == "__main__":
    demo = (
        "All calculations used the PBE functional with DFT-D3 dispersion correction. "
        "The adsorption energy of tetracycline on g-C3N4 was -1.82 eV. MD simulations "
        "with the OPLS-AA force field at 298 K gave a self-diffusion coefficient of "
        "2.3 x 10^-9 m^2/s and a first g(r) peak at 2.8 Angstrom."
    )
    c = QwenClient()
    for m in extract_from_passage(c, demo):
        print(m)
