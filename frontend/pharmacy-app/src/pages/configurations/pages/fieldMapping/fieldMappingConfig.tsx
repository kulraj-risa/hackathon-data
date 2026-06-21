import { useCallback, useEffect, useState } from "react";
import { TableCellType } from "../../../../components/custom-table/table";
import {
  ALL_BQ_FIELD_PATHS,
  DEFAULT_FIELD_MAPPING,
  FieldMapping,
} from "./defaultMapping";

const STORAGE_KEY = "field_mapping";

const FieldMappingConfig = () => {
  const [mappings, setMappings] = useState<FieldMapping[]>(
    DEFAULT_FIELD_MAPPING,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as { mappings: FieldMapping[] };
        if (data?.mappings?.length > 0) setMappings(data.mappings);
      }
    } catch {
      // use default
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMapping = useCallback(
    (idx: number, patch: Partial<FieldMapping>) => {
      setMappings((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...patch };
        return updated;
      });
      setHasChanges(true);
      setSaveMessage("");
    },
    [],
  );

  const handleConcatAdd = useCallback(
    (idx: number, which: "concatFields" | "secondaryConcatFields") => {
      setMappings((prev) => {
        const updated = [...prev];
        const existing = updated[idx][which] ?? [];
        updated[idx] = { ...updated[idx], [which]: [...existing, ""] };
        return updated;
      });
      setHasChanges(true);
      setSaveMessage("");
    },
    [],
  );

  const handleConcatChange = useCallback(
    (
      idx: number,
      which: "concatFields" | "secondaryConcatFields",
      fieldIdx: number,
      value: string,
    ) => {
      setMappings((prev) => {
        const updated = [...prev];
        const arr = [...(updated[idx][which] ?? [])];
        arr[fieldIdx] = value;
        updated[idx] = { ...updated[idx], [which]: arr };
        return updated;
      });
      setHasChanges(true);
      setSaveMessage("");
    },
    [],
  );

  const handleConcatRemove = useCallback(
    (
      idx: number,
      which: "concatFields" | "secondaryConcatFields",
      fieldIdx: number,
    ) => {
      setMappings((prev) => {
        const updated = [...prev];
        const arr = [...(updated[idx][which] ?? [])];
        arr.splice(fieldIdx, 1);
        updated[idx] = { ...updated[idx], [which]: arr };
        return updated;
      });
      setHasChanges(true);
      setSaveMessage("");
    },
    [],
  );

  const handleSave = useCallback(() => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mappings }));
      setHasChanges(false);
      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [mappings]);

  const handleReset = useCallback(() => {
    setMappings(DEFAULT_FIELD_MAPPING);
    setHasChanges(true);
    setSaveMessage("");
  }, []);

  const isMultiline = (m: FieldMapping) =>
    m.cellType === TableCellType.MULTILINE;
  const mappableCount = mappings.filter((m) => m.mappable).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-small text-primaryGray-6">
          Loading configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-primaryGray-14 bg-white px-4 py-3">
        <div>
          <h2 className="text-h11 font-bold text-primaryGray-1">
            BigQuery Field Mapping
          </h2>
          <p className="mt-0.5 text-x-tiny text-primaryGray-6">
            Map BigQuery{" "}
            <code className="rounded bg-primaryGray-16 px-1 py-0.5 text-primaryGray-3">
              prior_authorization_cases
            </code>{" "}
            fields to worklist columns
            <span className="mx-2">|</span>
            {mappableCount} mappable columns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 transition-colors hover:text-tertiaryRed-3"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`rounded px-4 py-1.5 text-x-tiny font-semibold transition-colors ${
              hasChanges && !saving
                ? "bg-tertiaryBlue-5 text-white hover:bg-tertiaryBlue-3"
                : "cursor-not-allowed bg-primaryGray-14 text-primaryGray-8"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saveMessage && (
            <span
              className={`text-x-tiny ${saveMessage.includes("Saved") ? "text-tertiaryGreen-700" : "text-tertiaryRed-3"}`}
            >
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {mappings.map((m, idx) => (
            <div
              key={m.columnKey}
              className={`rounded-lg border ${m.mappable ? "border-primaryGray-13" : "border-primaryGray-14 bg-primaryGray-17"} overflow-hidden`}
            >
              {/* Card header */}
              <div className="flex items-center justify-between bg-primaryGray-16 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-small font-semibold text-primaryGray-1">
                    {m.label}
                  </span>
                  <code className="rounded bg-primaryGray-14 px-1.5 py-0.5 text-x-tiny text-primaryGray-5">
                    {m.columnKey}
                  </code>
                  <span
                    className="rounded px-2 py-0.5 text-overline font-semibold uppercase"
                    style={{
                      backgroundColor: cellTypeColor(m.cellType).bg,
                      color: cellTypeColor(m.cellType).text,
                    }}
                  >
                    {m.cellType}
                  </span>
                </div>
                {!m.mappable && (
                  <span className="text-x-tiny italic text-primaryGray-8">
                    Not mappable (UI-only column)
                  </span>
                )}
              </div>

              {/* Card body */}
              {m.mappable && (
                <div className="space-y-4 px-4 py-3">
                  {/* Main field */}
                  <div>
                    <label className="mb-1 block text-x-tiny font-semibold text-primaryGray-4">
                      {isMultiline(m)
                        ? "Primary Value (mainText)"
                        : "Field Path"}
                    </label>

                    {m.concatFields && m.concatFields.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-overline text-primaryGray-6">
                          Concatenated fields (joined with space):
                        </p>
                        {m.concatFields.map((cf, fi) => (
                          <div key={fi} className="flex items-center gap-2">
                            <FieldDropdown
                              value={cf}
                              onChange={(v) =>
                                handleConcatChange(idx, "concatFields", fi, v)
                              }
                            />
                            <button
                              onClick={() =>
                                handleConcatRemove(idx, "concatFields", fi)
                              }
                              className="text-x-tiny text-tertiaryRed-3 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleConcatAdd(idx, "concatFields")}
                          className="text-x-tiny text-tertiaryBlue-5 hover:underline"
                        >
                          + Add field
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FieldDropdown
                          value={m.mainField}
                          onChange={(v) => updateMapping(idx, { mainField: v })}
                        />
                        <button
                          onClick={() => {
                            updateMapping(idx, {
                              concatFields: m.mainField ? [m.mainField] : [""],
                              mainField: "",
                            });
                          }}
                          className="whitespace-nowrap text-overline text-tertiaryBlue-5 hover:underline"
                        >
                          Switch to concat
                        </button>
                      </div>
                    )}

                    {/* Prefix / suffix for main */}
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <label className="text-overline text-primaryGray-6">
                          Prefix:
                        </label>
                        <input
                          className="w-24 rounded border border-primaryGray-13 px-2 py-0.5 text-x-tiny outline-none focus:border-tertiaryBlue-5"
                          value={m.prefix ?? ""}
                          placeholder="e.g. MRN : "
                          onChange={(e) =>
                            updateMapping(idx, {
                              prefix: e.target.value || undefined,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-overline text-primaryGray-6">
                          Suffix:
                        </label>
                        <input
                          className="w-24 rounded border border-primaryGray-13 px-2 py-0.5 text-x-tiny outline-none focus:border-tertiaryBlue-5"
                          value={m.suffix ?? ""}
                          placeholder="e.g. yrs"
                          onChange={(e) =>
                            updateMapping(idx, {
                              suffix: e.target.value || undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary field (multiline only) */}
                  {isMultiline(m) && (
                    <div className="border-t border-primaryGray-14 pt-3">
                      <label className="mb-1 block text-x-tiny font-semibold text-primaryGray-4">
                        Secondary Value (secondaryText)
                      </label>

                      {m.secondaryConcatFields &&
                      m.secondaryConcatFields.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-overline text-primaryGray-6">
                            Concatenated fields:
                          </p>
                          {m.secondaryConcatFields.map((cf, fi) => (
                            <div key={fi} className="flex items-center gap-2">
                              <FieldDropdown
                                value={cf}
                                onChange={(v) =>
                                  handleConcatChange(
                                    idx,
                                    "secondaryConcatFields",
                                    fi,
                                    v,
                                  )
                                }
                              />
                              <button
                                onClick={() =>
                                  handleConcatRemove(
                                    idx,
                                    "secondaryConcatFields",
                                    fi,
                                  )
                                }
                                className="text-x-tiny text-tertiaryRed-3 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              handleConcatAdd(idx, "secondaryConcatFields")
                            }
                            className="text-x-tiny text-tertiaryBlue-5 hover:underline"
                          >
                            + Add field
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FieldDropdown
                            value={m.secondaryField ?? ""}
                            onChange={(v) =>
                              updateMapping(idx, {
                                secondaryField: v || undefined,
                              })
                            }
                          />
                          <button
                            onClick={() => {
                              updateMapping(idx, {
                                secondaryConcatFields: m.secondaryField
                                  ? [m.secondaryField]
                                  : [""],
                                secondaryField: "",
                              });
                            }}
                            className="whitespace-nowrap text-overline text-tertiaryBlue-5 hover:underline"
                          >
                            Switch to concat
                          </button>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <label className="text-overline text-primaryGray-6">
                            Prefix:
                          </label>
                          <input
                            className="w-24 rounded border border-primaryGray-13 px-2 py-0.5 text-x-tiny outline-none focus:border-tertiaryBlue-5"
                            value={m.secondaryPrefix ?? ""}
                            placeholder="e.g. MRN : "
                            onChange={(e) =>
                              updateMapping(idx, {
                                secondaryPrefix: e.target.value || undefined,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-overline text-primaryGray-6">
                            Suffix:
                          </label>
                          <input
                            className="w-24 rounded border border-primaryGray-13 px-2 py-0.5 text-x-tiny outline-none focus:border-tertiaryBlue-5"
                            value={m.secondarySuffix ?? ""}
                            placeholder="e.g. yrs"
                            onChange={(e) =>
                              updateMapping(idx, {
                                secondarySuffix: e.target.value || undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FieldDropdown = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <select
    className="min-w-[240px] rounded border border-primaryGray-13 bg-white px-2 py-1 text-x-tiny text-primaryGray-2 outline-none focus:border-tertiaryBlue-5"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">-- Select BQ field --</option>
    {ALL_BQ_FIELD_PATHS.map((fp) => (
      <option key={fp} value={fp}>
        {fp}
      </option>
    ))}
  </select>
);

function cellTypeColor(t: TableCellType): { bg: string; text: string } {
  switch (t) {
    case TableCellType.MULTILINE:
      return { bg: "#EAF2FF", text: "#0056D6" };
    case TableCellType.BADGE:
      return { bg: "#FFF3E0", text: "#C24400" };
    case TableCellType.COPY_DATA:
      return { bg: "#E6F3F0", text: "#005D49" };
    case TableCellType.STRING:
      return { bg: "#F5F5F5", text: "#0F0F0F" };
    default:
      return { bg: "#F0F0F0", text: "#666" };
  }
}

export default FieldMappingConfig;
