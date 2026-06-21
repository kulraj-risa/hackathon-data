const TARGET_TABLE =
  "rapids-platform.pharma_demo_hackathon.demo_env_single_table";

// Resolve the BigQuery proxy URL defensively. A localhost value (from a dev
// .env that leaked into a production build) must NEVER be used on a hosted
// origin, or every fetch fails with "Failed to fetch" / mixed-content. When
// we're not on localhost we always use the same-origin "/api" rewrite, which
// Firebase Hosting proxies to the Cloud Run BigQuery proxy.
const isLocalhost =
  typeof window !== "undefined" && window.location.hostname === "localhost";
const configuredProxy = process.env.REACT_APP_PROXY_URL || "";
const BQ_PROXY = isLocalhost
  ? configuredProxy || "http://localhost:3009"
  : configuredProxy && !configuredProxy.includes("localhost")
    ? configuredProxy
    : "/api";

export interface PaCasesResponse {
  success: boolean;
  rows: Record<string, any>[];
  row_count: number;
  total_count: number;
}

export async function fetchPaCasesFromBigQuery(
  page = 1,
  pageSize = 100,
): Promise<PaCasesResponse> {
  const response = await fetch(BQ_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `SELECT * FROM \`${TARGET_TABLE}\``,
      page_size: pageSize,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BigQuery fetch failed (${response.status}): ${text}`);
  }

  return response.json();
}

/** Fetch a single BigQuery record by its `identifier` field. Returns null if not found or on error. */
export async function fetchBqRecordByIdentifier(
  identifier: string,
): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(BQ_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `SELECT * FROM \`${TARGET_TABLE}\` WHERE identifier = '${identifier}' LIMIT 1`,
      }),
    });
    if (!response.ok) return null;
    const data: PaCasesResponse = await response.json();
    return data.rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export interface UpdateBqResult {
  success: boolean;
  query: string;
  numDmlAffectedRows?: number;
  error?: string;
}

/**
 * Build a BigQuery UPDATE query from a flat map of field-path -> new value.
 * Nested paths (e.g. "workflow.status") are supported via BigQuery dot-notation.
 */
export function buildUpdateQuery(
  identifier: string,
  updates: Record<string, string>,
): string {
  const setClauses = Object.entries(updates)
    .map(([field, value]) => {
      const escaped = value.replace(/'/g, "\\'");
      return `${field} = '${escaped}'`;
    })
    .join(",\n  ");
  return `UPDATE \`${TARGET_TABLE}\`\nSET\n  ${setClauses}\nWHERE identifier = '${identifier}'`;
}

/** Build a BigQuery INSERT for a flat map of top-level field → value */
export function buildInsertQuery(fields: Record<string, string>): string {
  const cols = Object.keys(fields).join(", ");
  const vals = Object.values(fields)
    .map((v) => `'${v.replace(/'/g, "\\'")}'`)
    .join(", ");
  return `INSERT INTO \`${TARGET_TABLE}\` (${cols}) VALUES (${vals})`;
}

export async function insertBigQueryRecord(
  fields: Record<string, string>,
): Promise<UpdateBqResult> {
  const query = buildInsertQuery(fields);
  const response = await fetch(BQ_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    return { success: false, query, error: data.error ?? "Unknown error" };
  }
  return { success: true, query, numDmlAffectedRows: data.numDmlAffectedRows };
}

export interface PaSearchFilters {
  first_name?: string;
  last_name?: string;
  dob?: string;
  drug?: string;
  provider_name?: string;
}

export async function searchPaCases(
  filters: PaSearchFilters,
): Promise<PaCasesResponse> {
  const conditions: string[] = [];
  if (filters.first_name)
    conditions.push(
      `LOWER(patient.first_name) LIKE '%${filters.first_name.toLowerCase().replace(/'/g, "\\'")}%'`,
    );
  if (filters.last_name)
    conditions.push(
      `LOWER(patient.last_name) LIKE '%${filters.last_name.toLowerCase().replace(/'/g, "\\'")}%'`,
    );
  if (filters.dob)
    conditions.push(`patient.dob = '${filters.dob.replace(/'/g, "\\'")}'`);
  if (filters.drug)
    conditions.push(
      `LOWER(drug.drug_name) LIKE '%${filters.drug.toLowerCase().replace(/'/g, "\\'")}%'`,
    );
  if (filters.provider_name)
    conditions.push(
      `LOWER(provider.full_name) LIKE '%${filters.provider_name.toLowerCase().replace(/'/g, "\\'")}%'`,
    );

  const where =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  const query = `SELECT * FROM \`${TARGET_TABLE}\`${where} LIMIT 200`;

  const response = await fetch(BQ_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BigQuery search failed (${response.status}): ${text}`);
  }
  return response.json();
}

export async function updateBigQueryRecord(
  identifier: string,
  updates: Record<string, string>,
): Promise<UpdateBqResult> {
  const query = buildUpdateQuery(identifier, updates);
  const response = await fetch(BQ_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    return { success: false, query, error: data.error ?? "Unknown error" };
  }
  return {
    success: true,
    query,
    numDmlAffectedRows: data.numDmlAffectedRows,
  };
}
