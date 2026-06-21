import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildInsertQuery,
  buildUpdateQuery,
  fetchPaCasesFromBigQuery,
  insertBigQueryRecord,
  updateBigQueryRecord,
} from "../../../../api/bigQuery/paCasesBigQuery";
import {
  BQ_EDITABLE_FIELDS,
  BQ_READONLY_ARRAY_PATHS,
  BQ_SECTIONS,
  getByPath,
} from "../../../../utils/bqSchemaDefinition";

void fetchPaCasesFromBigQuery;
void buildUpdateQuery;
void updateBigQueryRecord;
void buildInsertQuery;
void insertBigQueryRecord;
void BQ_EDITABLE_FIELDS;
void BQ_READONLY_ARRAY_PATHS;
void BQ_SECTIONS;
void getByPath;

type CaseRow = Record<string, any>;

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

const get = (obj: any, path: string): string => {
  if (!obj) return "";
  const v = path.split(".").reduce((o: any, k: string) => o?.[k], obj);
  if (v === null || v === undefined) return "";
  return NAME_FIELDS.has(path) ? titleCase(v) : String(v);
};

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
  out[prefix] = String(obj);
  return out;
}

function calcAge(dob: string) {
  if (!dob) return "";
  const b = new Date(dob);
  if (isNaN(b.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return `${age} yrs`;
}

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

const PaCasesData = () => {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Selected record
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Edit state
  const [activeSection, setActiveSection] = useState("patient");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const [showQuery, setShowQuery] = useState(false);

  // Add new record
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState<Record<string, string>>({
    identifier: "",
    org_id: "",
    portal_id: "",
  });
  const [showAddQuery, setShowAddQuery] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addResult, setAddResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);
  const addQuery = Object.keys(newRecord).some((k) => newRecord[k])
    ? buildInsertQuery(
        Object.fromEntries(
          Object.entries(newRecord).filter(([, v]) => v.trim()),
        ),
      )
    : "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPaCasesFromBigQuery(1, 200);
      setCases(result.rows ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reset edits when selection changes
  useEffect(() => {
    setEdits({});
    setSaveResult(null);
    setShowQuery(false);
    setActiveSection("patient");
  }, [selectedId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedRow = useMemo(
    () => cases.find((c) => c.identifier === selectedId) ?? null,
    [cases, selectedId],
  );

  const flatOrig = useMemo(
    () => (selectedRow ? flattenObj(selectedRow) : {}),
    [selectedRow],
  );

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return cases;
    return cases.filter((c) => {
      return (
        String(c.identifier ?? "")
          .toLowerCase()
          .includes(t) ||
        String(get(c, "patient.full_name")).toLowerCase().includes(t) ||
        String(get(c, "patient.patient_mrn")).toLowerCase().includes(t) ||
        String(get(c, "workflow.status")).toLowerCase().includes(t) ||
        String(get(c, "drug.drug_name_onco_emr")).toLowerCase().includes(t)
      );
    });
  }, [cases, search]);

  const getValue = (path: string) =>
    edits[path] !== undefined ? edits[path] : (flatOrig[path] ?? "");

  const changedFields = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(edits)) {
      if (v !== (flatOrig[k] ?? "")) out[k] = v;
    }
    return out;
  }, [edits, flatOrig]);

  const hasChanges = Object.keys(changedFields).length > 0;
  const identifier = selectedRow?.identifier ?? "";

  const generatedQuery = useMemo(
    () => (hasChanges ? buildUpdateQuery(identifier, changedFields) : ""),
    [hasChanges, identifier, changedFields],
  );

  const sectionFields = useMemo(
    () => BQ_EDITABLE_FIELDS.filter((f) => f.section === activeSection),
    [activeSection],
  );

  const readonlyArrayPath = BQ_READONLY_ARRAY_PATHS[activeSection] ?? null;
  const readonlyArrayData = useMemo(() => {
    if (!readonlyArrayPath || !selectedRow) return null;
    const val = getByPath(selectedRow, readonlyArrayPath);
    return val ? JSON.stringify(val, null, 2) : null;
  }, [readonlyArrayPath, selectedRow]);

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-tertiaryBlue-5 border-t-transparent" />
          <p className="text-small text-primaryGray-6">
            Loading from BigQuery…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-small font-semibold text-red-700">Error</p>
          <p className="mt-2 text-x-tiny text-red-600">{error}</p>
          <button
            onClick={load}
            className="mt-4 rounded bg-tertiaryBlue-5 px-4 py-1.5 text-x-tiny font-semibold text-white hover:bg-tertiaryBlue-3"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-primaryGray-14 bg-white px-5 py-3">
        <div>
          <h2 className="text-h11 font-bold text-primaryGray-1">
            PA Cases Data
          </h2>
          <p className="mt-0.5 text-x-tiny text-primaryGray-6">
            <code className="rounded bg-primaryGray-16 px-1 text-primaryGray-3">
              pharma_demo.demo_env_single_table
            </code>
            <span className="mx-2 text-primaryGray-11">|</span>
            {cases.length} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAddModal(true);
              setAddResult(null);
              setShowAddQuery(false);
              setNewRecord({ identifier: "", org_id: "", portal_id: "" });
            }}
            className="rounded border border-tertiaryBlue-5 px-3 py-1.5 text-x-tiny font-medium text-tertiaryBlue-5 hover:bg-tertiaryBlue-13"
          >
            + Add Record
          </button>
          <button
            onClick={load}
            className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 hover:text-tertiaryBlue-3"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex w-[600px] max-w-[95vw] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-5 py-3.5">
              <h2 className="text-h11 font-bold text-primaryGray-1">
                Add New Record
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded p-1.5 text-primaryGray-6 hover:bg-primaryGray-16"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {addResult && (
              <div
                className={`shrink-0 border-b px-5 py-2 text-x-tiny font-medium ${addResult.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
              >
                {addResult.msg}
              </div>
            )}
            <div className="p-5">
              <p className="mb-3 text-x-tiny text-primaryGray-6">
                Fill in top-level fields. Nested fields (patient, drug,
                workflow, etc.) can be updated after creation via Edit.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: "identifier",
                    label: "Identifier *",
                    placeholder: "Unique ID",
                  },
                  {
                    key: "org_id",
                    label: "Org ID",
                    placeholder: "Organisation ID",
                  },
                  {
                    key: "portal_id",
                    label: "Portal ID",
                    placeholder: "Portal ID",
                  },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <label className="text-tiny font-medium text-primaryGray-5">
                      {label}
                    </label>
                    <input
                      value={newRecord[key] ?? ""}
                      onChange={(e) =>
                        setNewRecord((p) => ({ ...p, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="rounded border border-primaryGray-13 px-2 py-1.5 text-small text-primaryGray-1 outline-none focus:border-tertiaryBlue-5"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setShowAddQuery((v) => !v)}
                  className="text-x-tiny text-primaryGray-5 underline hover:text-tertiaryBlue-3"
                >
                  {showAddQuery ? "Hide SQL" : "Preview SQL"}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 hover:text-tertiaryRed-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!newRecord.identifier?.trim()) {
                        setAddResult({
                          ok: false,
                          msg: "Identifier is required.",
                        });
                        return;
                      }
                      setAddSaving(true);
                      setAddResult(null);
                      const fields = Object.fromEntries(
                        Object.entries(newRecord).filter(([, v]) => v.trim()),
                      );
                      const result = await insertBigQueryRecord(fields);
                      setAddSaving(false);
                      if (result.success) {
                        setAddResult({
                          ok: true,
                          msg: "Record added successfully.",
                        });
                        load();
                        setTimeout(() => setShowAddModal(false), 1500);
                      } else {
                        setAddResult({
                          ok: false,
                          msg: result.error ?? "Insert failed.",
                        });
                      }
                    }}
                    disabled={addSaving}
                    className="rounded bg-tertiaryBlue-5 px-4 py-1.5 text-x-tiny font-semibold text-white hover:bg-tertiaryBlue-3 disabled:opacity-50"
                  >
                    {addSaving ? "Inserting…" : "Insert Record"}
                  </button>
                </div>
              </div>
              {showAddQuery && addQuery && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded border border-primaryGray-13 bg-primaryGray-16 p-3 font-mono text-overline text-primaryGray-2">
                  {addQuery}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="shrink-0 border-b border-primaryGray-14 bg-primaryGray-16 px-5 py-3">
        <div ref={searchRef} className="relative max-w-lg">
          <div className="flex items-center gap-2 rounded-lg border border-primaryGray-13 bg-white px-3 py-2 shadow-sm focus-within:border-tertiaryBlue-5 focus-within:ring-1 focus-within:ring-tertiaryBlue-5/20">
            <svg
              className="h-4 w-4 shrink-0 text-primaryGray-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              className="flex-1 bg-transparent text-small text-primaryGray-1 outline-none placeholder:text-primaryGray-8"
              placeholder="Search by identifier, patient name, MRN, status…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setShowDropdown(false);
                }}
                className="text-primaryGray-8 hover:text-primaryGray-4"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {showDropdown && search.trim() && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-primaryGray-13 bg-white shadow-lg">
              {filtered.slice(0, 20).map((c) => (
                <button
                  key={c.identifier}
                  onClick={() => {
                    setSelectedId(c.identifier);
                    setSearch(c.identifier);
                    setShowDropdown(false);
                  }}
                  className={`flex w-full items-center gap-3 border-b border-primaryGray-14 px-4 py-2.5 text-left transition-colors last:border-none hover:bg-tertiaryBlue-13 ${selectedId === c.identifier ? "bg-tertiaryBlue-13" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-semibold text-primaryGray-1">
                      {get(c, "patient.full_name") || "Unknown"}
                    </p>
                    <p className="truncate text-overline text-primaryGray-6">
                      {c.identifier}
                      {get(c, "patient.patient_mrn")
                        ? ` · MRN: ${get(c, "patient.patient_mrn")}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={get(c, "workflow.status")} />
                </button>
              ))}
              {filtered.length > 20 && (
                <p className="px-4 py-2 text-overline text-primaryGray-6">
                  {filtered.length - 20} more — refine your search
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main area */}
      {!selectedRow ? (
        /* Record list */
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-small">
            <thead className="sticky top-0 z-10 bg-primaryGray-16">
              <tr>
                <th className="px-4 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Patient
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  MRN · Age
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Medication
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Identifier
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.identifier}
                  className="border-t border-primaryGray-14 hover:bg-primaryGray-16"
                >
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-primaryGray-1">
                      {get(c, "patient.full_name") || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-x-tiny text-primaryGray-6">
                    {get(c, "patient.patient_mrn") || "—"}
                    {get(c, "patient.dob") && (
                      <span className="ml-1 text-primaryGray-8">
                        · {calcAge(get(c, "patient.dob"))}
                      </span>
                    )}
                  </td>
                  <td
                    className="max-w-[160px] truncate px-4 py-2.5 text-x-tiny text-primaryGray-3"
                    title={
                      get(c, "drug.drug_name_onco_emr") ||
                      get(c, "drug.drug_name")
                    }
                  >
                    {get(c, "drug.drug_name_onco_emr") ||
                      get(c, "drug.drug_name") ||
                      "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={get(c, "workflow.status")} />
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-primaryGray-16 px-1.5 py-0.5 text-overline text-primaryGray-4">
                      {c.identifier}
                    </code>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => {
                        setSelectedId(c.identifier);
                        setSearch(c.identifier);
                      }}
                      className="rounded border border-tertiaryBlue-5 px-2.5 py-1 text-overline font-medium text-tertiaryBlue-5 hover:bg-tertiaryBlue-13"
                      title="Edit this record"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Edit form */
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Edit header */}
          <div className="flex shrink-0 items-center justify-between border-b border-primaryGray-14 bg-white px-5 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedId(null);
                  setSearch("");
                }}
                className="rounded p-1 text-primaryGray-6 hover:bg-primaryGray-16"
                title="Back to list"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <p className="text-small font-bold text-primaryGray-1">
                  {get(selectedRow, "patient.full_name") || identifier}
                </p>
                <p className="mt-0.5 text-x-tiny text-primaryGray-6">
                  <code className="rounded bg-primaryGray-16 px-1 text-primaryGray-3">
                    {identifier}
                  </code>
                  {get(selectedRow, "patient.patient_mrn") && (
                    <span className="ml-2">
                      MRN:{" "}
                      <code className="rounded bg-primaryGray-16 px-1 text-primaryGray-3">
                        {get(selectedRow, "patient.patient_mrn")}
                      </code>
                    </span>
                  )}
                  <span className="ml-2">
                    <StatusBadge status={get(selectedRow, "workflow.status")} />
                  </span>
                </p>
              </div>
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
                className={`rounded px-4 py-1.5 text-x-tiny font-semibold transition-colors ${hasChanges && !saving ? "bg-tertiaryBlue-5 text-white hover:bg-tertiaryBlue-3" : "cursor-not-allowed bg-primaryGray-14 text-primaryGray-8"}`}
              >
                {saving
                  ? "Saving…"
                  : hasChanges
                    ? `Save Changes (${Object.keys(changedFields).length})`
                    : "No Changes"}
              </button>
            </div>
          </div>

          {/* Result banner */}
          {saveResult && (
            <div
              className={`shrink-0 border-b px-5 py-2 text-x-tiny font-medium ${saveResult.ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
            >
              {saveResult.msg}
            </div>
          )}

          {/* SQL preview */}
          {showQuery && generatedQuery && (
            <div className="shrink-0 border-b border-primaryGray-14 bg-primaryGray-16 px-5 py-3">
              <p className="mb-1 text-tiny font-bold text-primaryGray-4">
                Generated UPDATE Query
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
                  fieldsInSection.length +
                  (BQ_READONLY_ARRAY_PATHS[s.key] ? 1 : 0);
                const changed = Object.keys(changedFields).filter((k) =>
                  fieldsInSection.some((f) => f.path === k),
                ).length;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`flex items-center justify-between px-3 py-2 text-left text-x-tiny transition-colors ${activeSection === s.key ? "border-r-2 border-tertiaryBlue-5 bg-tertiaryBlue-13 font-semibold text-tertiaryBlue-3" : "text-primaryGray-4 hover:bg-primaryGray-16"}`}
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
              {readonlyArrayData && (
                <div className="mb-4">
                  <p className="mb-1 text-tiny font-semibold text-primaryGray-4">
                    Raw data (read-only)
                  </p>
                  <pre className="max-h-48 overflow-auto rounded border border-primaryGray-13 bg-primaryGray-16 p-3 font-mono text-overline text-primaryGray-3">
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
                              onChange={(e) => {
                                setEdits((p) => ({
                                  ...p,
                                  [path]: e.target.value,
                                }));
                                setSaveResult(null);
                              }}
                              className={`w-full rounded border px-2 py-1.5 text-small text-primaryGray-1 outline-none transition-colors focus:border-tertiaryBlue-5 ${changed ? "border-tertiaryBlue-5 bg-tertiaryBlue-13" : "border-primaryGray-13 bg-white hover:border-primaryGray-11"}`}
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
                              onChange={(e) => {
                                setEdits((p) => ({
                                  ...p,
                                  [path]: e.target.value,
                                }));
                                setSaveResult(null);
                              }}
                              placeholder="—"
                              className={`w-full rounded border px-2 py-1.5 text-small text-primaryGray-1 outline-none transition-colors focus:border-tertiaryBlue-5 focus:ring-1 focus:ring-tertiaryBlue-5/20 ${changed ? "border-tertiaryBlue-5 bg-tertiaryBlue-13" : "border-primaryGray-13 bg-white hover:border-primaryGray-11"}`}
                            />
                          )}
                          {changed && (
                            <button
                              onClick={() =>
                                setEdits((p) => {
                                  const n = { ...p };
                                  delete n[path];
                                  return n;
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
  );
};

export default PaCasesData;
