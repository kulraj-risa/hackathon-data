const http = require("http");
const https = require("https");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");

const PORT = 3002;

const MIME_TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".csv": "text/csv",
  ".json": "application/json",
  ".txt": "text/plain",
  ".html": "text/html",
  ".xml": "application/xml",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || null;
}
const PROJECT = "rapids-platform";
const FIRESTORE_DB = process.env.FIRESTORE_DB || "(default)";
const STORAGE_BUCKET = "rapids-platform.firebasestorage.app";
const BQ_URL = `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT}/queries`;

const auth = new GoogleAuth({
  scopes: [
    "https://www.googleapis.com/auth/bigquery",
    "https://www.googleapis.com/auth/devstorage.read_only",
    "https://www.googleapis.com/auth/datastore",
  ],
});

async function getToken() {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

function flattenValue(val, field) {
  if (val === null || val === undefined) return null;

  const isRepeated = field.mode === "REPEATED";
  const isRecord = field.type === "RECORD" || field.type === "STRUCT";

  if (isRepeated) {
    if (!Array.isArray(val)) return [];
    return val.map((item) => {
      if (isRecord) {
        return flattenRecord(item.v, field.fields);
      }
      return item.v;
    });
  }

  if (isRecord) {
    if (!val || !val.f) return null;
    return flattenRecord(val, field.fields);
  }

  return val;
}

function flattenRecord(recordVal, subFields) {
  if (!recordVal || !recordVal.f) return null;
  const obj = {};
  subFields.forEach((sf, i) => {
    obj[sf.name] = flattenValue(recordVal.f[i].v, sf);
  });
  return obj;
}

function transformBqResponse(bqData) {
  // DML response (UPDATE/INSERT/DELETE) — no rows returned
  if (bqData.numDmlAffectedRows !== undefined || (!bqData.schema && !bqData.rows)) {
    return {
      success: true,
      dml: true,
      numDmlAffectedRows: parseInt(bqData.numDmlAffectedRows || "0", 10),
      rows: [],
      row_count: 0,
      total_count: 0,
    };
  }

  const fields = bqData.schema?.fields || [];
  const rawRows = bqData.rows || [];
  const rows = rawRows.map((row) => {
    const obj = {};
    fields.forEach((field, i) => {
      obj[field.name] = flattenValue(row.f[i].v, field);
    });
    return obj;
  });
  return {
    success: true,
    rows,
    row_count: rows.length,
    total_count: parseInt(bqData.totalRows || rows.length, 10),
  };
}

function extractFirestoreValue(v) {
  if (v === null || v === undefined) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(extractFirestoreValue);
  if ("mapValue" in v) {
    const obj = {};
    for (const [k, mv] of Object.entries(v.mapValue.fields || {})) {
      obj[k] = extractFirestoreValue(mv);
    }
    return obj;
  }
  return v;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Firebase Hosting forwards the full original path (e.g. /api/firestore/...).
  // Strip a leading /api segment so route matching works whether the proxy is
  // reached directly or behind the hosting rewrite.
  if (req.url === "/api") {
    req.url = "/";
  } else if (req.url && req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  }

  // ── Storage proxy: GET /storage?path=onco_emr/... ──
  if (req.url && req.url.startsWith("/storage")) {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const filePath = urlObj.searchParams.get("path");
    if (!filePath) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing ?path= parameter" }));
      return;
    }

    (async () => {
      try {
        const token = await getToken();
        const encodedPath = encodeURIComponent(filePath);
        const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;

        const gcsReq = https.request(
          gcsUrl,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
          (gcsRes) => {
            if (gcsRes.statusCode !== 200) {
              let errBody = "";
              gcsRes.on("data", (c) => (errBody += c));
              gcsRes.on("end", () => {
                res.writeHead(gcsRes.statusCode, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `GCS returned ${gcsRes.statusCode}`, details: errBody }));
              });
              return;
            }
            const gcsContentType = gcsRes.headers["content-type"] || "application/octet-stream";
            const contentType = getMimeType(filePath) || gcsContentType;
            res.writeHead(200, {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600",
            });
            gcsRes.pipe(res);
          },
        );
        gcsReq.on("error", (err) => {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        });
        gcsReq.end();
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    })();
    return;
  }

  // ── Firestore proxy: GET /firestore/<collection-path> ──
  if (req.method === "GET" && req.url && req.url.startsWith("/firestore/")) {
    const collPath = decodeURIComponent(req.url.replace("/firestore/", ""));
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${FIRESTORE_DB}/documents/${collPath}`;

    (async () => {
      try {
        const token = await getToken();
        const fsReq = https.request(
          fsUrl,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } },
          (fsRes) => {
            let data = "";
            fsRes.on("data", (c) => (data += c));
            fsRes.on("end", () => {
              try {
                const parsed = JSON.parse(data);
                if (fsRes.statusCode !== 200) {
                  res.writeHead(fsRes.statusCode, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ success: false, error: data }));
                  return;
                }
                const docs = (parsed.documents || []).map((d) => {
                  const id = d.name.split("/").pop();
                  const fields = {};
                  for (const [k, v] of Object.entries(d.fields || {})) {
                    fields[k] = extractFirestoreValue(v);
                  }
                  return { id, ...fields };
                });
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, documents: docs }));
              } catch (e) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
          },
        );
        fsReq.on("error", (err) => {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
        fsReq.end();
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    })();
    return;
  }

  // ── BigQuery proxy ──
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      const query =
        parsed.query ||
        `SELECT * FROM \`${PROJECT}.pharma_demo.demo_env_single_table\``;
      const pageSize = parsed.page_size || 100;

      const token = await getToken();
      const bqBody = JSON.stringify({
        query,
        useLegacySql: false,
        maxResults: pageSize,
      });

      const bqReq = https.request(
        BQ_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Length": Buffer.byteLength(bqBody),
          },
        },
        (bqRes) => {
          let data = "";
          bqRes.on("data", (chunk) => (data += chunk));
          bqRes.on("end", () => {
            try {
              const bqData = JSON.parse(data);
              if (bqData.error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: false,
                    error: bqData.error.message,
                  }),
                );
                return;
              }
              const result = transformBqResponse(bqData);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result));
            } catch (e) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ success: false, error: e.message }),
              );
            }
          });
        },
      );

      bqReq.on("error", (err) => {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });

      bqReq.write(bqBody);
      bqReq.end();
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`BigQuery proxy on http://localhost:${PORT} -> ${PROJECT}`);
});
