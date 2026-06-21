#!/usr/bin/env python3
"""Deploy build/ to a Firebase Hosting site via the REST API.

Used because the local Firebase CLI login is expired, but gcloud is still
authenticated. Drives the Hosting API with a gcloud access token + quota
project header. Sets the /api -> Cloud Run proxy rewrites + SPA fallback.
"""
import gzip
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

SITE = os.environ.get("FB_SITE", "pharmacy-hackathon-demo")
PROJECT = os.environ.get("FB_PROJECT", "rapids-platform")
BUILD_DIR = os.environ.get("FB_BUILD", "build")
PROXY_SERVICE = os.environ.get("FB_PROXY_SERVICE", "pharmacy-hackathon-proxy")
REGION = os.environ.get("FB_REGION", "us-central1")
API = "https://firebasehosting.googleapis.com/v1beta1"

TOKEN = subprocess.check_output(
    ["gcloud", "auth", "print-access-token"], text=True
).strip()
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "X-Goog-User-Project": PROJECT,
    "Content-Type": "application/json",
}


def req(method, url, body=None, headers=None, raw=False):
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    h = dict(headers or HEADERS)
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode()) if not raw else resp.read()


def main():
    config = {
        # index.html must never be cached, otherwise a client holding a stale
        # index keeps requesting an old (now-deleted) main.<hash>.js, which the
        # SPA rewrite answers with index.html (text/html) → "Unexpected token '<'"
        # → blank screen. The hashed JS/CSS are immutable, so they cache forever.
        "headers": [
            {
                "glob": "/index.html",
                "headers": {"Cache-Control": "no-cache, max-age=0, must-revalidate"},
            },
            {
                "glob": "/",
                "headers": {"Cache-Control": "no-cache, max-age=0, must-revalidate"},
            },
            {
                "glob": "/static/**",
                "headers": {"Cache-Control": "public, max-age=31536000, immutable"},
            },
        ],
        "rewrites": [
            {"glob": "/api", "run": {"serviceId": PROXY_SERVICE, "region": REGION}},
            {"glob": "/api/**", "run": {"serviceId": PROXY_SERVICE, "region": REGION}},
            {"glob": "**", "path": "/index.html"},
        ],
    }
    print("Creating version…")
    version = req(
        "POST", f"{API}/sites/{SITE}/versions", {"config": config}
    )["name"]
    print("  ", version)

    # Hash every file (gzip then sha256 of the gzipped bytes).
    files = {}            # "/path" -> sha256
    payloads = {}         # sha256 -> gzipped bytes
    for root, _, names in os.walk(BUILD_DIR):
        for name in names:
            full = os.path.join(root, name)
            rel = "/" + os.path.relpath(full, BUILD_DIR).replace(os.sep, "/")
            gz = gzip.compress(open(full, "rb").read())
            digest = hashlib.sha256(gz).hexdigest()
            files[rel] = digest
            payloads[digest] = gz
    print(f"Hashed {len(files)} files")

    pop = req(
        "POST",
        f"{API}/{version}:populateFiles",
        {"files": files},
    )
    upload_url = pop["uploadUrl"]
    required = pop.get("uploadRequiredHashes", []) or []
    print(f"Uploading {len(required)} required files…")
    for i, h in enumerate(required, 1):
        up_headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/octet-stream",
        }
        req("POST", f"{upload_url}/{h}", payloads[h], headers=up_headers, raw=True)
        if i % 10 == 0 or i == len(required):
            print(f"  {i}/{len(required)}")

    print("Finalizing…")
    req(
        "PATCH",
        f"{API}/{version}?update_mask=status",
        {"status": "FINALIZED"},
    )
    print("Releasing…")
    req("POST", f"{API}/sites/{SITE}/releases?versionName={version}", {})
    print(f"\nDONE -> https://{SITE}.web.app")


if __name__ == "__main__":
    sys.exit(main())
