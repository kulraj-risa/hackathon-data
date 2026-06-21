import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildUpdateQuery,
  updateBigQueryRecord,
} from "../../../api/bigQuery/paCasesBigQuery";
import {
  BQ_EDITABLE_FIELDS,
  BQ_READONLY_ARRAY_PATHS,
  BQ_SECTIONS,
  getByPath,
} from "../../../utils/bqSchemaDefinition";

void BQ_EDITABLE_FIELDS;
void BQ_READONLY_ARRAY_PATHS;
void BQ_SECTIONS;
void getByPath;

interface Props {
  rowData: Record<string, any>;
  onClose: () => void;
  onSaved?: () => void;
}

/** Recursively flatten a nested object into dot-notation paths */
function flattenObj(
  obj: any,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> {
  if (obj === null || obj === undefined) return result;
  if (Array.isArray(obj)) {
    result[prefix] = JSON.stringify(obj);
    return result;
  }
  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      flattenObj(obj[key], prefix ? `${prefix}.${key}` : key, result);
    }
    return result;
  }
  result[prefix] = obj === null || obj === undefined ? "" : String(obj);
  return result;
}

const EditRecordModal = ({ rowData, onClose, onSaved }: Props) => {
  const originalFlat = useMemo(() => flattenObj(rowData), [rowData]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState("patient");
  const [showQuery, setShowQuery] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  useEffect(() => {
    setEdits({});
    setExecResult(null);
    setShowQuery(false);
  }, [rowData]);

  const identifier = rowData?.identifier ?? "";

  const changedFields = useMemo(() => {
    const changed: Record<string, string> = {};
    for (const [k, v] of Object.entries(edits)) {
      if (v !== (originalFlat[k] ?? "")) changed[k] = v;
    }
    return changed;
  }, [edits, originalFlat]);

  const generatedQuery = useMemo(() => {
    if (Object.keys(changedFields).length === 0) return "";
    return buildUpdateQuery(identifier, changedFields);
  }, [identifier, changedFields]);

  const getValue = (path: string) =>
    edits[path] !== undefined ? edits[path] : (originalFlat[path] ?? "");

  const handleChange = (path: string, value: string) => {
    setEdits((prev) => ({ ...prev, [path]: value }));
    setExecResult(null);
  };

  const handleExecute = useCallback(async () => {
    if (!identifier || Object.keys(changedFields).length === 0) return;
    setExecuting(true);
    setExecResult(null);
    const result = await updateBigQueryRecord(identifier, changedFields);
    setExecuting(false);
    if (result.success) {
      setExecResult({
        ok: true,
        msg: `Updated ${result.numDmlAffectedRows ?? 1} row(s) successfully.`,
      });
      setEdits({});
      onSaved?.();
    } else {
      setExecResult({ ok: false, msg: result.error ?? "Update failed." });
    }
  }, [identifier, changedFields, onSaved]);

  // Fields for active section (schema-driven)
  const sectionFields = useMemo(
    () => BQ_EDITABLE_FIELDS.filter((f) => f.section === activeSection),
    [activeSection],
  );

  const readonlyArrayPath = BQ_READONLY_ARRAY_PATHS[activeSection] ?? null;
  const readonlyArrayData = useMemo(() => {
    if (!readonlyArrayPath) return null;
    const val = getByPath(rowData, readonlyArrayPath);
    return val ? JSON.stringify(val, null, 2) : null;
  }, [readonlyArrayPath, rowData]);

  const hasChanges = Object.keys(changedFields).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex h-[90vh] w-[900px] max-w-[95vw] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-primaryGray-14 bg-white px-5 py-3.5">
          <div>
            <h2 className="text-h11 font-bold text-primaryGray-1">
              Edit Record
            </h2>
            <p className="mt-0.5 text-x-tiny text-primaryGray-6">
              ID:{" "}
              <code className="rounded bg-primaryGray-16 px-1 text-primaryGray-3">
                {identifier || "—"}
              </code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={() => setShowQuery((v) => !v)}
                className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 hover:text-tertiaryBlue-3"
              >
                {showQuery ? "Hide Query" : "View SQL"}
              </button>
            )}
            <button
              onClick={handleExecute}
              disabled={!hasChanges || executing}
              className={`rounded px-4 py-1.5 text-x-tiny font-semibold transition-colors ${
                hasChanges && !executing
                  ? "bg-tertiaryBlue-5 text-white hover:bg-tertiaryBlue-3"
                  : "cursor-not-allowed bg-primaryGray-14 text-primaryGray-8"
              }`}
            >
              {executing
                ? "Saving…"
                : `Save Changes${hasChanges ? ` (${Object.keys(changedFields).length})` : ""}`}
            </button>
            <button
              onClick={onClose}
              className="ml-1 rounded p-1.5 text-primaryGray-6 hover:bg-primaryGray-16"
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
        </div>

        {/* Result banner */}
        {execResult && (
          <div
            className={`shrink-0 border-b px-5 py-2 text-x-tiny font-medium ${
              execResult.ok
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {execResult.msg}
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
              const changedCount = Object.keys(changedFields).filter((k) =>
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
                    {changedCount > 0 && (
                      <span className="rounded-full bg-tertiaryBlue-5 px-1.5 text-overline text-white">
                        {changedCount}
                      </span>
                    )}
                    <span className="text-primaryGray-8">{count}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fields */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Read-only array */}
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
              <p className="text-x-tiny text-primaryGray-6">
                No fields in this section.
              </p>
            )}

            {sectionFields.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {sectionFields.map((fieldDef) => {
                  const { path, label, type } = fieldDef;
                  const val = getValue(path);
                  const original = originalFlat[path] ?? "";
                  const isChanged =
                    edits[path] !== undefined && edits[path] !== original;
                  return (
                    <div key={path} className="flex flex-col gap-0.5">
                      <label className="flex items-center gap-1 text-tiny font-medium text-primaryGray-1">
                        {label}
                        {isChanged && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-tertiaryBlue-5" />
                        )}
                      </label>
                      <p className="mb-0.5 text-overline text-primaryGray-8">
                        {path}
                      </p>
                      {type === "BOOLEAN" ? (
                        <select
                          value={val}
                          onChange={(e) => handleChange(path, e.target.value)}
                          className={`rounded border px-2 py-1.5 text-small text-primaryGray-1 outline-none transition-colors focus:border-tertiaryBlue-5 ${
                            isChanged
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
                          onChange={(e) => handleChange(path, e.target.value)}
                          className={`rounded border px-2 py-1.5 text-small text-primaryGray-1 outline-none transition-colors focus:border-tertiaryBlue-5 focus:ring-1 focus:ring-tertiaryBlue-5/20 ${
                            isChanged
                              ? "border-tertiaryBlue-5 bg-tertiaryBlue-13"
                              : "border-primaryGray-13 bg-white hover:border-primaryGray-11"
                          }`}
                          placeholder="—"
                        />
                      )}
                      {isChanged && (
                        <p className="truncate text-overline text-primaryGray-6">
                          was:{" "}
                          <span className="text-primaryGray-3">
                            {original || "—"}
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
    </div>
  );
};

export default EditRecordModal;
