import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildUpdateQuery,
  fetchPaCasesFromBigQuery,
  updateBigQueryRecord,
} from "../../../../api/bigQuery/paCasesBigQuery";
import {
  BQ_EDITABLE_FIELDS,
  BQ_READONLY_ARRAY_PATHS,
  BQ_SECTIONS,
  getByPath,
} from "../../../../utils/bqSchemaDefinition";

void buildUpdateQuery;
void fetchPaCasesFromBigQuery;
void updateBigQueryRecord;
void BQ_EDITABLE_FIELDS;
void BQ_READONLY_ARRAY_PATHS;
void BQ_SECTIONS;
void getByPath;

// ─── helpers ────────────────────────────────────────────────────────────────

const NAME_FIELDS = new Set([
  "patient.full_name",
  "patient.first_name",
  "patient.last_name",
  "provider.full_name",
  "provider.first_name",
  "provider.last_name",
]);

function titleCase(s: any): string {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getVal(obj: any, path: string): string {
  if (!obj || !path) return "";
  const v = path.split(".").reduce((cur: any, k: string) => cur?.[k], obj);
  if (v === null || v === undefined) return "";
  return NAME_FIELDS.has(path) ? titleCase(v) : String(v);
}

function flattenObj(
  obj: any,
  prefix = "",
  out: Record<string, string> = {},
): Record<string, string> {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    out[prefix] = JSON.stringify(obj);
    return out;
  }
  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      flattenObj(obj[k], prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  out[prefix] = obj === null ? "" : String(obj);
  return out;
}

function calcAge(dob: string): string {
  if (!dob) return "";
  const b = new Date(dob);
  if (isNaN(b.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return `${age} yrs`;
}

// ─── status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const lower = (status ?? "").toLowerCase();
  let bg = "#F5F5F5",
    color = "#0F0F0F";
  if (
    lower.includes("approved") ||
    lower.includes("verified") ||
    lower.includes("request response") ||
    lower.includes("auth not required") ||
    lower.includes("approval on file")
  ) {
    bg = "#E6F3F0";
    color = "#005D49";
  } else if (
    lower.includes("denied") ||
    lower.includes("denial on file") ||
    lower.includes("drug not covered") ||
    lower.includes("error")
  ) {
    bg = "#FFE8E8";
    color = "#CC0300";
  } else if (lower.includes("pending") || lower.includes("waiting")) {
    bg = "#FFF3E0";
    color = "#C24400";
  } else if (lower.includes("progress")) {
    bg = "#FFFCD6";
    color = "#665D00";
  } else if (lower.includes("new") || lower.includes("submitted")) {
    bg = "#EAF2FF";
    color = "#0056D6";
  }
  return (
    <span
      className="rounded px-2 py-0.5 text-overline font-semibold"
      style={{ background: bg, color }}
    >
      {status || "—"}
    </span>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

const EditRecordsConfig = () => {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState("patient");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [showQuery, setShowQuery] = useState(false);

  // ── load ──
  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetchPaCasesFromBigQuery();
      setRows(res.rows);
    } catch (e: any) {
      setFetchError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── selected raw row ──
  const selectedRow = useMemo(
    () => rows.find((r) => (r.identifier ?? r.case_id) === selectedId) ?? null,
    [rows, selectedId],
  );

  const flatOrig = useMemo(
    () => (selectedRow ? flattenObj(selectedRow) : {}),
    [selectedRow],
  );

  // reset edits when selection changes
  useEffect(() => {
    setEdits({});
    setSaveResult(null);
    setShowQuery(false);
  }, [selectedId]);

  // ── filtered list ──
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => {
      const name = String(r?.patient?.full_name ?? "").toLowerCase();
      const mrn = String(r?.patient?.patient_mrn ?? "").toLowerCase();
      const id = String(r?.identifier ?? "").toLowerCase();
      const drug = String(r?.drug?.drug_name_onco_emr ?? "").toLowerCase();
      const status = String(r?.workflow?.status ?? "").toLowerCase();
      return (
        name.includes(t) ||
        mrn.includes(t) ||
        id.includes(t) ||
        drug.includes(t) ||
        status.includes(t)
      );
    });
  }, [rows, search]);

  // ── edits helpers ──
  const getValue = (path: string) =>
    edits[path] !== undefined ? edits[path] : (flatOrig[path] ?? "");

  const handleChange = (path: string, value: string) => {
    setEdits((p) => ({ ...p, [path]: value }));
    setSaveResult(null);
  };

  const changedFields = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(edits)) {
      if (v !== (flatOrig[k] ?? "")) out[k] = v;
    }
    return out;
  }, [edits, flatOrig]);

  const hasChanges = Object.keys(changedFields).length > 0;
  const identifier = selectedRow?.identifier ?? selectedRow?.case_id ?? "";

  const generatedQuery = useMemo(
    () => (hasChanges ? buildUpdateQuery(identifier, changedFields) : ""),
    [hasChanges, identifier, changedFields],
  );

  // ── section fields (schema-driven) ──
  const sectionFields = useMemo(
    () => BQ_EDITABLE_FIELDS.filter((f) => f.section === activeSection),
    [activeSection],
  );

  // ── readonly array for the active section ──
  const readonlyArrayPath = BQ_READONLY_ARRAY_PATHS[activeSection] ?? null;
  const readonlyArrayData = useMemo(() => {
    if (!readonlyArrayPath || !selectedRow) return null;
    const val = getByPath(selectedRow, readonlyArrayPath);
    return val ? JSON.stringify(val, null, 2) : null;
  }, [readonlyArrayPath, selectedRow]);

  // ── save ──
  const handleSave = useCallback(async () => {
    if (!identifier || !hasChanges) return;
    setSaving(true);
    setSaveResult(null);
    const result = await updateBigQueryRecord(identifier, changedFields);
    setSaving(false);
    if (result.success) {
      setSaveResult({
        ok: true,
        msg: `Saved — ${result.numDmlAffectedRows ?? 1} row(s) updated.`,
      });
      setEdits({});
      load();
    } else {
      setSaveResult({ ok: false, msg: result.error ?? "Update failed." });
    }
  }, [identifier, hasChanges, changedFields, load]);

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="flex shrink-0 items-center justify-between border-b border-primaryGray-14 bg-white px-5 py-3">
        <div>
          <h2 className="text-h11 font-bold text-primaryGray-1">
            Edit Records
          </h2>
          <p className="mt-0.5 text-x-tiny text-primaryGray-6">
            Select a record from the list, edit fields, and save back to
            BigQuery.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 hover:text-tertiaryBlue-3 disabled:opacity-50"
        >
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {fetchError && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-2 text-x-tiny text-red-700">
          {fetchError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: record list ── */}
        <div className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-primaryGray-14">
          {/* Search */}
          <div className="shrink-0 border-b border-primaryGray-14 px-3 py-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, MRN, status…"
              className="w-full rounded border border-primaryGray-13 px-2.5 py-1.5 text-x-tiny text-primaryGray-1 outline-none focus:border-tertiaryBlue-5"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-x-tiny text-primaryGray-6">
                Loading records…
              </p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-x-tiny text-primaryGray-6">
                No records found.
              </p>
            ) : (
              filtered.map((r) => {
                const id = r.identifier ?? r.case_id ?? "";
                const name = r?.patient?.full_name ?? "Unknown Patient";
                const mrn = r?.patient?.patient_mrn ?? "";
                const dob = r?.patient?.dob ?? "";
                const status = r?.workflow?.status ?? "";
                const isSelected = selectedId === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedId(id)}
                    className={`w-full border-b border-primaryGray-14 px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "border-l-2 border-l-tertiaryBlue-5 bg-tertiaryBlue-13"
                        : "hover:bg-primaryGray-16"
                    }`}
                  >
                    <p
                      className={`truncate text-small font-semibold ${isSelected ? "text-tertiaryBlue-3" : "text-primaryGray-1"}`}
                    >
                      {name}
                    </p>
                    <p className="mt-0.5 truncate text-overline text-primaryGray-6">
                      {mrn ? `MRN: ${mrn}` : ""}
                      {mrn && dob ? "  ·  " : ""}
                      {dob ? calcAge(dob) : ""}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={status} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="shrink-0 border-t border-primaryGray-14 px-3 py-2 text-overline text-primaryGray-6">
            {filtered.length} of {rows.length} records
          </div>
        </div>

        {/* ── Right panel: edit form ── */}
        {!selectedRow ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto mb-3 h-12 w-12 text-primaryGray-11"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <p className="text-small font-medium text-primaryGray-4">
                Select a record to edit
              </p>
              <p className="mt-1 text-x-tiny text-primaryGray-6">
                Choose from the list on the left
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Edit header */}
            <div className="flex shrink-0 items-start justify-between border-b border-primaryGray-14 bg-white px-5 py-3">
              <div>
                <p className="text-small font-bold text-primaryGray-1">
                  {selectedRow?.patient?.full_name ?? identifier}
                </p>
                <p className="mt-0.5 text-x-tiny text-primaryGray-6">
                  ID:{" "}
                  <code className="rounded bg-primaryGray-16 px-1 text-primaryGray-3">
                    {identifier}
                  </code>
                  {selectedRow?.patient?.patient_mrn && (
                    <span className="ml-2">
                      MRN:{" "}
                      <code className="rounded bg-primaryGray-16 px-1 text-primaryGray-3">
                        {selectedRow.patient.patient_mrn}
                      </code>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <button
                    onClick={() => setShowQuery((v) => !v)}
                    className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 hover:text-tertiaryBlue-3"
                  >
                    {showQuery ? "Hide SQL" : "View SQL"}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className={`rounded px-4 py-1.5 text-x-tiny font-semibold transition-colors ${
                    hasChanges && !saving
                      ? "bg-tertiaryBlue-5 text-white hover:bg-tertiaryBlue-3"
                      : "cursor-not-allowed bg-primaryGray-14 text-primaryGray-8"
                  }`}
                >
                  {saving
                    ? "Saving…"
                    : hasChanges
                      ? `Save Changes (${Object.keys(changedFields).length})`
                      : "No Changes"}
                </button>
              </div>
            </div>

            {/* Save result */}
            {saveResult && (
              <div
                className={`shrink-0 border-b px-5 py-2 text-x-tiny font-medium ${
                  saveResult.ok
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {saveResult.msg}
              </div>
            )}

            {/* SQL preview */}
            {showQuery && generatedQuery && (
              <div className="shrink-0 border-b border-primaryGray-14 bg-primaryGray-16 px-5 py-3">
                <p className="mb-1 text-tiny font-bold text-primaryGray-4">
                  UPDATE Query — will be executed on save
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-primaryGray-13 bg-white p-3 font-mono text-overline text-primaryGray-2">
                  {generatedQuery}
                </pre>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              {/* Section nav */}
              <div className="flex w-44 shrink-0 flex-col overflow-y-auto border-r border-primaryGray-14">
                {BQ_SECTIONS.map((s) => {
                  const fieldsInSection = BQ_EDITABLE_FIELDS.filter(
                    (f) => f.section === s.key,
                  );
                  const count =
                    fieldsInSection.length ||
                    (BQ_READONLY_ARRAY_PATHS[s.key] ? 1 : 0);
                  const changed = Object.keys(changedFields).filter((k) =>
                    fieldsInSection.some((f) => f.path === k),
                  ).length;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={`flex items-center justify-between px-3 py-2 text-left text-x-tiny transition-colors ${
                        activeSection === s.key
                          ? "border-r-2 border-tertiaryBlue-5 bg-tertiaryBlue-13 font-semibold text-tertiaryBlue-3"
                          : "text-primaryGray-4 hover:bg-primaryGray-16"
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      <span className="flex shrink-0 items-center gap-1 pl-1">
                        {changed > 0 && (
                          <span className="rounded-full bg-tertiaryBlue-5 px-1.5 text-overline text-white">
                            {changed}
                          </span>
                        )}
                        <span className="text-primaryGray-8">{count}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Fields grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Read-only array section */}
                {readonlyArrayData && (
                  <div className="mb-4">
                    <p className="mb-1 text-tiny font-semibold text-primaryGray-4">
                      Raw data (read-only — array fields cannot be edited via
                      SQL UPDATE)
                    </p>
                    <pre className="overflow-x-auto rounded border border-primaryGray-13 bg-primaryGray-16 p-3 font-mono text-overline text-primaryGray-3">
                      {readonlyArrayData}
                    </pre>
                  </div>
                )}

                {sectionFields.length === 0 && !readonlyArrayData && (
                  <p className="text-x-tiny text-primaryGray-6">No fields.</p>
                )}

                {sectionFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {sectionFields.map((fieldDef) => {
                      const { path, label, type } = fieldDef;
                      const val = getValue(path);
                      const orig = flatOrig[path] ?? "";
                      const changed =
                        edits[path] !== undefined && edits[path] !== orig;

                      return (
                        <div key={path} className="flex flex-col gap-0.5">
                          <label className="flex items-center gap-1 text-tiny font-medium text-primaryGray-1">
                            {label}
                            {changed && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-tertiaryBlue-5" />
                            )}
                          </label>
                          <p className="mb-0.5 text-overline text-primaryGray-8">
                            {path}
                          </p>
                          <div className="relative">
                            {type === "BOOLEAN" ? (
                              <select
                                value={val}
                                onChange={(e) =>
                                  handleChange(path, e.target.value)
                                }
                                className={`w-full rounded border px-2 py-1.5 text-small text-primaryGray-1 outline-none transition-colors focus:border-tertiaryBlue-5 ${
                                  changed
                                    ? "border-tertiaryBlue-5 bg-tertiaryBlue-13"
                                    : "border-primaryGray-13 bg-white hover:border-primaryGray-11"
                                }`}
                              >
                                <option value="">—</option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <input
                                type={
                                  type === "FLOAT" || type === "INTEGER"
                                    ? "number"
                                    : "text"
                                }
                                value={val}
                                onChange={(e) =>
                                  handleChange(path, e.target.value)
                                }
                                className={`w-full rounded border px-2 py-1.5 text-small text-primaryGray-1 outline-none transition-colors focus:border-tertiaryBlue-5 focus:ring-1 focus:ring-tertiaryBlue-5/20 ${
                                  changed
                                    ? "border-tertiaryBlue-5 bg-tertiaryBlue-13"
                                    : "border-primaryGray-13 bg-white hover:border-primaryGray-11"
                                }`}
                                placeholder="—"
                              />
                            )}
                            {changed && (
                              <button
                                onClick={() =>
                                  setEdits((p) => {
                                    const next = { ...p };
                                    delete next[path];
                                    return next;
                                  })
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-primaryGray-8 hover:text-tertiaryRed-3"
                                title="Revert"
                              >
                                ↩
                              </button>
                            )}
                          </div>
                          {changed && (
                            <p className="truncate text-overline text-primaryGray-6">
                              was:{" "}
                              <span className="text-primaryGray-3">
                                {orig || "—"}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditRecordsConfig;
