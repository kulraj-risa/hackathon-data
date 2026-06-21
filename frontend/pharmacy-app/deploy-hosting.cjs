#!/usr/bin/env node

/**
 * Deploy build/ to Firebase Hosting (pharmacy-dash-demo) using REST API.
 * No Firebase CLI needed — uses gcloud ADC token.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const zlib = require("zlib");

const SITE = "pharmacy-dash-demo";
const BUILD_DIR = path.join(__dirname, "build");

function getToken() {
  return execSync("gcloud auth print-access-token", { encoding: "utf-8" }).trim();
}

function api(method, urlPath, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "firebasehosting.googleapis.com",
      path: urlPath,
      method,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        "x-goog-user-project": "rapids-platform",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...extraHeaders,
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function uploadFile(uploadUrl, token, hash, gzippedContent) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${uploadUrl}/${hash}`);
    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Content-Length": gzippedContent.length,
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(gzippedContent);
    req.end();
  });
}

function getAllFiles(dir, prefix = "") {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const webPath = prefix + "/" + entry.name;
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, webPath));
    } else {
      results.push({ filePath: fullPath, webPath });
    }
  }
  return results;
}

async function main() {
  console.log("1/6 Collecting files from build/...");
  const files = getAllFiles(BUILD_DIR);
  console.log(`   Found ${files.length} files`);

  console.log("2/6 Hashing files...");
  const fileMap = {};
  const hashToFile = {};
  for (const f of files) {
    const content = fs.readFileSync(f.filePath);
    const gzipped = zlib.gzipSync(content);
    const hash = crypto.createHash("sha256").update(gzipped).digest("hex");
    fileMap[f.webPath] = hash;
    hashToFile[hash] = { gzipped, filePath: f.filePath };
  }

  console.log("3/6 Creating new version...");
  const versionConfig = {
    config: {
      rewrites: [
        {
          glob: "/api",
          run: {
            serviceId: "pharmacy-dash-proxy",
            region: "us-central1",
          },
        },
        {
          glob: "/api/**",
          run: {
            serviceId: "pharmacy-dash-proxy",
            region: "us-central1",
          },
        },
        { glob: "**", path: "/index.html" },
      ],
      headers: [
        {
          glob: "**",
          headers: {
            "X-Frame-Options": "DENY",
          },
        },
      ],
    },
  };
  const version = await api(
    "POST",
    `/v1beta1/sites/${SITE}/versions`,
    versionConfig
  );
  if (version.error) {
    console.error("Failed to create version:", JSON.stringify(version.error, null, 2));
    process.exit(1);
  }
  const versionName = version.name;
  console.log(`   Version: ${versionName}`);

  console.log("4/6 Populating files...");
  const populateRes = await api(
    "POST",
    `/v1beta1/${versionName}:populateFiles`,
    { files: fileMap }
  );
  if (populateRes.error) {
    console.error("Failed to populate:", JSON.stringify(populateRes.error, null, 2));
    process.exit(1);
  }

  const uploadUrl = populateRes.uploadUrl;
  const requiredHashes = populateRes.uploadRequiredHashes || [];
  console.log(`   ${requiredHashes.length} files need uploading (${files.length - requiredHashes.length} already cached)`);

  if (requiredHashes.length > 0) {
    console.log("5/6 Uploading files...");
    const token = getToken();
    let uploaded = 0;
    for (const hash of requiredHashes) {
      const fileData = hashToFile[hash];
      if (!fileData) {
        console.warn(`   WARNING: No file found for hash ${hash}`);
        continue;
      }
      await uploadFile(uploadUrl, token, hash, fileData.gzipped);
      uploaded++;
      if (uploaded % 50 === 0) {
        console.log(`   Uploaded ${uploaded}/${requiredHashes.length}...`);
      }
    }
    console.log(`   Uploaded ${uploaded} files`);
  } else {
    console.log("5/6 All files already cached, skipping upload");
  }

  console.log("6/6 Finalizing version and releasing...");
  const finalizeRes = await api(
    "PATCH",
    `/v1beta1/${versionName}?updateMask=status`,
    { status: "FINALIZED" }
  );
  if (finalizeRes.error) {
    console.error("Failed to finalize:", JSON.stringify(finalizeRes.error, null, 2));
    process.exit(1);
  }

  const releaseRes = await api(
    "POST",
    `/v1beta1/sites/${SITE}/releases?versionName=${encodeURIComponent(versionName)}`,
    {}
  );
  if (releaseRes.error) {
    console.error("Failed to release:", JSON.stringify(releaseRes.error, null, 2));
    process.exit(1);
  }

  console.log(`\nDeployed! Live at https://pharmacy-dash-demo.web.app`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
