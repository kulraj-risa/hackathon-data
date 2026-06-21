"""Thin Anthropic client for the denial engine (stdlib only — no extra deps).

Reads ANTHROPIC_API_KEY from the environment, or from .env.engine.local at the
repo root for local dev. Every entry point degrades gracefully: if there is no
key, or the API errors/times out, the caller falls back to the deterministic
reasoning path so the demo never breaks.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from functools import lru_cache
from pathlib import Path

_API_URL = "https://api.anthropic.com/v1/messages"
# This module lives at <root>/src/denial_engine/core/llm.py → repo root is parents[3].
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env.engine.local"
# Sonnet 4.6 = strong reasoning at reasonable latency; override via env.
DEFAULT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")


@lru_cache(maxsize=1)
def _load_key() -> str | None:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key and key.strip() and "REPLACE_ME" not in key:
        return key.strip()
    # Fallback: parse .env.engine.local (local dev convenience).
    if _ENV_FILE.exists():
        for line in _ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line.startswith("ANTHROPIC_API_KEY="):
                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                if val and "REPLACE_ME" not in val:
                    return val
    return None


def available() -> bool:
    return _load_key() is not None


def complete(
    system: str,
    user: str,
    max_tokens: int = 1024,
    model: str | None = None,
    timeout: float = 30.0,
) -> str | None:
    """Single-turn completion. Returns the text, or None on any failure."""
    key = _load_key()
    if not key:
        return None
    body = json.dumps({
        "model": model or DEFAULT_MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }).encode()
    req = urllib.request.Request(
        _API_URL,
        data=body,
        method="POST",
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
        parts = data.get("content") or []
        return "".join(p.get("text", "") for p in parts if p.get("type") == "text") or None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError, KeyError):
        return None


def complete_json(
    system: str,
    user: str,
    max_tokens: int = 2048,
    model: str | None = None,
    timeout: float = 40.0,
) -> dict | None:
    """Completion that must return a JSON object. Tolerates code-fence wrapping."""
    text = complete(
        system + "\n\nRespond with ONLY a valid JSON object, no prose, no code fences.",
        user,
        max_tokens=max_tokens,
        model=model,
        timeout=timeout,
    )
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1] if text.count("```") >= 2 else text.strip("`")
        if text.lstrip().startswith("json"):
            text = text.lstrip()[4:]
    try:
        return json.loads(text)
    except ValueError:
        start, end = text.find("{"), text.rfind("}")
        if 0 <= start < end:
            try:
                return json.loads(text[start : end + 1])
            except ValueError:
                return None
        return None
