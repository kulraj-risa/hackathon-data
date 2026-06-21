import { useCallback, useMemo, useState } from "react";
import { defaultSchema, SchemaField, SchemaSection } from "./schemaData";

const BQ_TABLE = "rapids-platform.pharma_demo.demo_env_single_table";

const TYPE_OPTIONS = [
  "STRING",
  "STRING (PK)",
  "INTEGER",
  "FLOAT",
  "BOOL",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "RECORD",
  "RECORD (REPEATED)",
];

const TYPE_TO_BQ: Record<string, string> = {
  STRING: "STRING",
  "STRING (PK)": "STRING",
  INTEGER: "INT64",
  FLOAT: "FLOAT64",
  BOOL: "BOOL",
  BOOLEAN: "BOOL",
  DATE: "DATE",
  TIMESTAMP: "TIMESTAMP",
  RECORD: "RECORD",
  "RECORD (REPEATED)": "RECORD",
};

function buildOriginalFieldPaths(sections: SchemaSection[]): Set<string> {
  const paths = new Set<string>();
  for (const s of sections) {
    for (const f of s.fields) {
      paths.add(f.fieldPath);
    }
  }
  return paths;
}

function isTopLevel(fieldPath: string): boolean {
  return !fieldPath.includes(".");
}

function generateAlterDDL(fields: SchemaField[], table: string): string {
  if (fields.length === 0) return "";
  return fields
    .map((f) => {
      const bqType = TYPE_TO_BQ[f.type] ?? "STRING";
      return `ALTER TABLE \`${table}\`\nADD COLUMN IF NOT EXISTS ${f.fieldPath} ${bqType};`;
    })
    .join("\n\n");
}

const SectionTable = ({
  section,
  isExpanded,
  onToggle,
  onFieldChange,
  onAddField,
  onRemoveField,
  originalPaths,
}: {
  section: SchemaSection;
  isExpanded: boolean;
  onToggle: () => void;
  onFieldChange: (
    fieldIdx: number,
    key: keyof SchemaField,
    value: string,
  ) => void;
  onAddField: () => void;
  onRemoveField: (fieldIdx: number) => void;
  originalPaths: Set<string>;
}) => {
  const newCount = section.fields.filter(
    (f) => !originalPaths.has(f.fieldPath),
  ).length;
  const isNested = section.key !== "top_level";

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-primaryGray-13">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-primaryGray-16 px-4 py-3 transition-colors hover:bg-primaryGray-14"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-small font-bold text-primaryGray-1">
            {section.title}
          </span>
          <span className="rounded bg-white px-2 py-0.5 text-x-tiny text-primaryGray-6">
            {section.fields.length} fields
          </span>
          {newCount > 0 && (
            <span className="rounded bg-tertiaryGreen-50 px-1.5 py-0.5 text-[10px] font-bold text-tertiaryGreen-700">
              +{newCount} NEW
            </span>
          )}
          {isNested && (
            <span className="rounded bg-primaryGray-14 px-1.5 py-0.5 text-[10px] font-semibold text-primaryGray-5">
              RECORD — read only
            </span>
          )}
        </div>
        <span className="text-x-tiny text-primaryGray-5">
          {section.description}
        </span>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr className="border-t border-primaryGray-13 bg-primaryGray-16">
                <th className="w-10 px-3 py-2 text-left text-tiny font-bold text-primaryGray-4">
                  #
                </th>
                <th className="w-[50%] px-3 py-2 text-left text-tiny font-bold text-primaryGray-4">
                  Field Path
                </th>
                <th className="w-[20%] px-3 py-2 text-left text-tiny font-bold text-primaryGray-4">
                  Type
                </th>
                <th className="w-[22%] px-3 py-2 text-left text-tiny font-bold text-primaryGray-4">
                  Example
                </th>
                {!isNested && <th className="w-10 px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {section.fields.map((field, idx) => {
                const isNew = !originalPaths.has(field.fieldPath);
                return (
                  <tr
                    key={field.id}
                    className={`border-t border-primaryGray-14 transition-colors hover:bg-tertiaryBlue-13 ${isNew ? "bg-green-50" : ""}`}
                  >
                    <td className="px-3 py-1.5 text-x-tiny text-primaryGray-6">
                      {isNew ? (
                        <span className="inline-block rounded bg-tertiaryGreen-50 px-1.5 py-0.5 text-[10px] font-bold text-tertiaryGreen-700">
                          NEW
                        </span>
                      ) : (
                        field.id
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      {isNested ? (
                        <span className="text-small font-semibold text-primaryGray-1">
                          {field.fieldPath}
                        </span>
                      ) : (
                        <input
                          className="-mx-1 w-full bg-transparent px-1 py-0.5 text-small font-semibold text-primaryGray-1 outline-none focus:rounded focus:border focus:border-tertiaryBlue-5 focus:bg-white"
                          value={field.fieldPath}
                          onChange={(e) =>
                            onFieldChange(idx, "fieldPath", e.target.value)
                          }
                        />
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      {isNested ? (
                        <span className="text-small text-primaryGray-4">
                          {field.type}
                        </span>
                      ) : (
                        <select
                          className="-mx-1 w-full cursor-pointer bg-transparent px-1 py-0.5 text-small text-primaryGray-4 outline-none focus:rounded focus:border focus:border-tertiaryBlue-5 focus:bg-white"
                          value={field.type}
                          onChange={(e) =>
                            onFieldChange(idx, "type", e.target.value)
                          }
                        >
                          {TYPE_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      {isNested ? (
                        <span className="text-small text-primaryGray-5">
                          {field.example || "—"}
                        </span>
                      ) : (
                        <input
                          className="-mx-1 w-full bg-transparent px-1 py-0.5 text-small text-primaryGray-5 outline-none focus:rounded focus:border focus:border-tertiaryBlue-5 focus:bg-white"
                          value={field.example}
                          placeholder="—"
                          onChange={(e) =>
                            onFieldChange(idx, "example", e.target.value)
                          }
                        />
                      )}
                    </td>
                    {!isNested && (
                      <td className="px-3 py-1.5 text-center">
                        <button
                          onClick={() => onRemoveField(idx)}
                          className="text-primaryGray-8 transition-colors hover:text-tertiaryRed-3"
                          title="Remove field"
                        >
                          <svg
                            className="h-3.5 w-3.5"
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
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isNested ? (
            <div className="flex items-center gap-2 border-t border-primaryGray-14 bg-primaryGray-16 px-4 py-2.5 text-x-tiny text-primaryGray-6">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>
                Adding fields to nested RECORDs is not supported via SQL DDL —
                requires <strong>bigquery.dataEditor</strong> role +{" "}
                <code className="rounded bg-white px-1">bq update</code> or REST
                API
              </span>
            </div>
          ) : (
            <div className="border-t border-primaryGray-14 px-3 py-2">
              <button
                onClick={onAddField}
                className="flex items-center gap-1 text-x-tiny font-semibold text-tertiaryBlue-5 transition-colors hover:text-tertiaryBlue-3"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Field
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ApplyModal = ({
  topLevelFields,
  onClose,
}: {
  topLevelFields: SchemaField[];
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const ddlText = generateAlterDDL(topLevelFields, BQ_TABLE);

  const handleCopy = () => {
    navigator.clipboard.writeText(ddlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-primaryGray-14 px-5 py-4">
          <div>
            <h3 className="text-h11 font-bold text-primaryGray-1">
              Add Top-Level Columns
            </h3>
            <p className="mt-0.5 text-x-tiny text-primaryGray-6">
              {topLevelFields.length} column
              {topLevelFields.length !== 1 ? "s" : ""} — run in{" "}
              <a
                href="https://console.cloud.google.com/bigquery?project=rapids-platform"
                target="_blank"
                rel="noreferrer"
                className="text-tertiaryBlue-5 underline"
              >
                BigQuery Console
              </a>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-primaryGray-6 transition-colors hover:bg-primaryGray-16 hover:text-primaryGray-2"
          >
            <svg
              className="h-5 w-5"
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

        <div className="flex-1 overflow-y-auto p-5">
          <pre className="overflow-x-auto rounded-lg bg-primaryGray-16 p-4 text-small leading-relaxed text-primaryGray-2">
            {ddlText}
          </pre>
        </div>

        <div className="flex items-center justify-between border-t border-primaryGray-14 px-5 py-3">
          <p className="text-x-tiny text-primaryGray-6">
            Copy and execute in BigQuery SQL workspace
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded border border-primaryGray-13 px-4 py-1.5 text-x-tiny text-primaryGray-5 transition-colors hover:text-primaryGray-2"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded bg-tertiaryBlue-5 px-4 py-1.5 text-x-tiny font-semibold text-white transition-colors hover:bg-tertiaryBlue-3"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? "Copied!" : "Copy SQL"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaCasesSchemaConfig = () => {
  const [schema, setSchema] = useState<SchemaSection[]>(defaultSchema);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["top_level"]),
  );
  const [showApply, setShowApply] = useState(false);

  const originalPaths = useMemo(
    () => buildOriginalFieldPaths(defaultSchema),
    [],
  );

  const newTopLevel = useMemo(() => {
    const added: SchemaField[] = [];
    for (const section of schema) {
      for (const f of section.fields) {
        if (!originalPaths.has(f.fieldPath) && isTopLevel(f.fieldPath)) {
          added.push(f);
        }
      }
    }
    return added;
  }, [schema, originalPaths]);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleFieldChange = useCallback(
    (
      sectionIdx: number,
      fieldIdx: number,
      key: keyof SchemaField,
      value: string,
    ) => {
      setSchema((prev) => {
        const updated = [...prev];
        const section = { ...updated[sectionIdx] };
        const fields = [...section.fields];
        fields[fieldIdx] = { ...fields[fieldIdx], [key]: value };
        section.fields = fields;
        updated[sectionIdx] = section;
        return updated;
      });
    },
    [],
  );

  const handleAddField = useCallback((sectionIdx: number) => {
    setSchema((prev) => {
      const updated = [...prev];
      const section = { ...updated[sectionIdx] };
      const maxId = Math.max(
        ...prev.flatMap((s) => s.fields.map((f) => f.id)),
        0,
      );
      const prefix = section.key === "top_level" ? "" : section.key + ".";
      section.fields = [
        ...section.fields,
        {
          id: maxId + 1,
          fieldPath: prefix + "new_field",
          type: "STRING",
          description: "",
          example: "",
        },
      ];
      updated[sectionIdx] = section;
      return updated;
    });
  }, []);

  const handleRemoveField = useCallback(
    (sectionIdx: number, fieldIdx: number) => {
      setSchema((prev) => {
        const updated = [...prev];
        const section = { ...updated[sectionIdx] };
        section.fields = section.fields.filter((_, i) => i !== fieldIdx);
        updated[sectionIdx] = section;
        return updated;
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setSchema(defaultSchema);
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedSections(new Set(schema.map((s) => s.key)));
  }, [schema]);

  const handleCollapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  const totalFields = schema.reduce((sum, s) => sum + s.fields.length, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-primaryGray-14 bg-white px-4 py-3">
        <div>
          <h2 className="text-h11 font-bold text-primaryGray-1">
            PA Cases Schema Configuration
          </h2>
          <p className="mt-0.5 text-x-tiny text-primaryGray-6">
            Table:{" "}
            <code className="rounded bg-primaryGray-16 px-1.5 py-0.5 text-primaryGray-3">
              {BQ_TABLE}
            </code>
            <span className="mx-2">|</span>
            {schema.length} sections, {totalFields} fields
            {newTopLevel.length > 0 && (
              <span className="ml-2 rounded bg-tertiaryGreen-50 px-1.5 py-0.5 text-[10px] font-bold text-tertiaryGreen-700">
                {newTopLevel.length} NEW
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="rounded px-2 py-1 text-x-tiny text-primaryGray-5 transition-colors hover:text-primaryGray-2"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="rounded px-2 py-1 text-x-tiny text-primaryGray-5 transition-colors hover:text-primaryGray-2"
          >
            Collapse All
          </button>
          <div className="mx-1 h-5 w-px bg-primaryGray-13"></div>
          <button
            onClick={handleReset}
            className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 transition-colors hover:text-tertiaryRed-3"
          >
            Reset to Default
          </button>
          <button
            onClick={() => setShowApply(true)}
            disabled={newTopLevel.length === 0}
            className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-x-tiny font-semibold transition-colors ${
              newTopLevel.length > 0
                ? "bg-tertiaryBlue-5 text-white hover:bg-tertiaryBlue-3"
                : "cursor-not-allowed bg-primaryGray-14 text-primaryGray-8"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
            Generate DDL ({newTopLevel.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {schema.map((section, sectionIdx) => (
          <SectionTable
            key={section.key}
            section={section}
            isExpanded={expandedSections.has(section.key)}
            onToggle={() => toggleSection(section.key)}
            onFieldChange={(fieldIdx, key, value) =>
              handleFieldChange(sectionIdx, fieldIdx, key, value)
            }
            onAddField={() => handleAddField(sectionIdx)}
            onRemoveField={(fieldIdx) =>
              handleRemoveField(sectionIdx, fieldIdx)
            }
            originalPaths={originalPaths}
          />
        ))}
      </div>

      {showApply && (
        <ApplyModal
          topLevelFields={newTopLevel}
          onClose={() => setShowApply(false)}
        />
      )}
    </div>
  );
};

export default PaCasesSchemaConfig;
