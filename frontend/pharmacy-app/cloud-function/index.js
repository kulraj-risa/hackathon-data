const http = require("http");
const https = require("https");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");

const ALLOWED_ORIGINS = [
  "https://pharmacy-dash-demo.web.app",
  "https://pharmacy-dash-demo.firebaseapp.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

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
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || null;
}

const PROJECT = "rapids-platform";
const STORAGE_BUCKET = "rapids-platform.firebasestorage.app";
const BQ_URL = `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT}/queries`;

const auth = new GoogleAuth({
  scopes: [
    "https://www.googleapis.com/auth/bigquery",
    "https://www.googleapis.com/auth/devstorage.read_only",
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
      if (isRecord) return flattenRecord(item.v, field.fields);
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
  if (
    bqData.numDmlAffectedRows !== undefined ||
    (!bqData.schema && !bqData.rows)
  ) {
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

function setCors(req, res) {
  const origin = req.headers.origin || req.headers["origin"];
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: "GET", headers }, (res) => {
      if (res.statusCode !== 200) {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          reject(new Error(`GCS returned ${res.statusCode}: ${body}`))
        );
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ buffer: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on("error", reject);
    req.end();
  });
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: "POST", headers }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// HTTP server for Cloud Run
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin || req.headers["origin"];
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const cleanPath = req.url.replace(/^\/api/, "");

  // Storage proxy
  if (cleanPath === "/storage" || cleanPath.startsWith("/storage")) {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const filePath = urlObj.searchParams.get("path");
    if (!filePath) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing ?path= parameter" }));
      return;
    }
    try {
      const token = await getToken();
      const encodedPath = encodeURIComponent(filePath);
      const gcsUrl = `https://storage.googleapis.com/storage/v1/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
      const result = await httpsGet(gcsUrl, {
        Authorization: `Bearer ${token}`,
      });
      const contentType =
        getMimeType(filePath) ||
        result.headers["content-type"] ||
        "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      });
      res.end(result.buffer);
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // BigQuery proxy
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

      const result = await httpsPost(
        BQ_URL,
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Length": Buffer.byteLength(bqBody),
        },
        bqBody
      );

      const bqData = JSON.parse(result.body);
      if (bqData.error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: bqData.error.message }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(transformBqResponse(bqData)));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
