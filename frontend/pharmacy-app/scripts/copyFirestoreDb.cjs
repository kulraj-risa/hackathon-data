#!/usr/bin/env node
/**
 * Recursively copies the pharmacy-app collections from the (default) Firestore
 * database into the dedicated `pharmacy` database within the same project.
 *
 *   - READ-ONLY on the source (default); writes only to the destination.
 *   - Discovers subcollections dynamically via :listCollectionIds, so nested
 *     data (onco_emr/{id}/..., orders/{id}/..., etc.) is copied faithfully.
 *   - Preserves raw Firestore field types verbatim (Timestamp, GeoPoint,
 *     reference, map, array, geo, bytes) by copying the REST `fields` payload.
 *   - Rewrites referenceValue paths from (default) -> pharmacy so intra-DB
 *     document references keep pointing within the new database.
 *
 * Auth: Application Default Credentials (gcloud auth application-default login).
 * Usage: node scripts/copyFirestoreDb.cjs [--dry] [--only collA,collB]
 */
const { GoogleAuth } = require("google-auth-library");

const PROJECT = "rapids-platform";
const SRC_DB = "(default)";
const DST_DB = "pharmacy";

// Pharmacy-app top-level collections (subcollections are auto-discovered).
const ROOT_COLLECTIONS = [
  "providers",
  "healthcare_facility",
  "healthcare_facility_invitation",
  "auth_config",
  "onco_emr",
  "orders",
  "medical_pa_orders",
  "configurations",
  "cmm_workflow",
  "cmm_events",
  "api_config",
  "nycbs_drug",
  "nycbs_medical_pa",
  "nycbs_claims_pa",
  "client",
  "dashboard_config",
];

const DRY = process.argv.includes("--dry");
const onlyIdx = process.argv.indexOf("--only");
const ONLY =
  onlyIdx !== -1 && process.argv[onlyIdx + 1]
    ? process.argv[onlyIdx + 1].split(",")
    : null;

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/datastore"],
});
let client;
async function token() {
  if (!client) client = await auth.getClient();
  const t = await client.getAccessToken();
  return t.token;
}

const base = (db) =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${encodeURIComponent(
    db,
  )}/documents`;

async function api(url, opts = {}) {
  const tok = await token();
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${tok}`,
      "x-goog-user-project": PROJECT,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${opts.method || "GET"} ${url} -> ${res.status}: ${body}`);
  }
  return res.json();
}

// List all documents in source collection at parentPath ('' for root).
// showMissing=true so "missing" parent docs (no fields, but containers for
// subcollections — e.g. auth_config/cmm_form_config) are returned and their
// subcollections get traversed. Missing docs have no `fields`/`createTime`.
async function listDocs(parentPath, collId) {
  const out = [];
  let pageToken = "";
  do {
    const segment = parentPath ? `${parentPath}/${collId}` : collId;
    const url =
      `${base(SRC_DB)}/${segment}?pageSize=300&showMissing=true` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const data = await api(url);
    (data.documents || []).forEach((d) => out.push(d));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return out;
}

const isMissing = (doc) => !doc.createTime && !doc.fields;

async function listSubcollections(docRelPath) {
  const url = `${base(SRC_DB)}/${docRelPath}:listCollectionIds`;
  const data = await api(url, { method: "POST", body: "{}" });
  return data.collectionIds || [];
}

// Deep-rewrite referenceValue db segment (default) -> pharmacy.
function rewriteRefs(fields) {
  const SRC_SEG = `/databases/${SRC_DB}/documents/`;
  const DST_SEG = `/databases/${DST_DB}/documents/`;
  const walk = (v) => {
    if (!v || typeof v !== "object") return v;
    if (typeof v.referenceValue === "string") {
      v.referenceValue = v.referenceValue.replace(SRC_SEG, DST_SEG);
    }
    if (v.mapValue?.fields) {
      Object.values(v.mapValue.fields).forEach(walk);
    }
    if (v.arrayValue?.values) {
      v.arrayValue.values.forEach(walk);
    }
    return v;
  };
  Object.values(fields || {}).forEach(walk);
  return fields;
}

async function writeDoc(relPath, fields) {
  if (DRY) return;
  const url = `${base(DST_DB)}/${relPath}`;
  await api(url, {
    method: "PATCH",
    body: JSON.stringify({ fields: rewriteRefs(fields || {}) }),
  });
}

const counts = {};
async function copyCollection(parentPath, collId) {
  const docs = await listDocs(parentPath, collId);
  const key = parentPath ? `${parentPath}/${collId}` : collId;
  let written = 0;
  for (const doc of docs) {
    const relPath = doc.name.split("/documents/")[1];
    // Only write real docs; "missing" parents have no fields but may still
    // own subcollections that must be traversed.
    if (!isMissing(doc)) {
      await writeDoc(relPath, doc.fields);
      written++;
    }
    const subs = await listSubcollections(relPath);
    for (const sub of subs) await copyCollection(relPath, sub);
  }
  counts[key] = (counts[key] || 0) + written;
  console.log(`  ${key}: ${written} docs${docs.length - written ? ` (+${docs.length - written} missing parents)` : ""}`);
}

(async () => {
  const list = ONLY || ROOT_COLLECTIONS;
  console.log(
    `${DRY ? "[DRY RUN] " : ""}Copying ${list.length} collections: ${SRC_DB} -> ${DST_DB}`,
  );
  for (const coll of list) {
    console.log(`Collection group: ${coll}`);
    await copyCollection("", coll);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\nDONE. Total documents ${DRY ? "found" : "copied"}: ${total}`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
