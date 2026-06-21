import { useCallback, useEffect, useState } from "react";
import {
  ALL_BQ_FIELD_PATHS,
  DEFAULT_FIELD_MAPPING,
} from "../fieldMapping/defaultMapping";

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  visible: boolean;
  sortable: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    key: "expandableRowIcon",
    label: "",
    width: 3,
    visible: true,
    sortable: false,
  },
  {
    key: "patientDetails",
    label: "Patient Details",
    width: 10,
    visible: true,
    sortable: true,
  },
  {
    key: "dateOfBirth",
    label: "Date of Birth",
    width: 8,
    visible: true,
    sortable: true,
  },
  {
    key: "dateOfService",
    label: "DOS",
    width: 7,
    visible: true,
    sortable: true,
  },
  {
    key: "providerDetails",
    label: "Provider Details",
    width: 10,
    visible: true,
    sortable: false,
  },
  {
    key: "drug",
    label: "Medication",
    width: 8,
    visible: true,
    sortable: false,
  },
  {
    key: "cmmKey",
    label: "CoverMyMeds ID",
    width: 10,
    visible: true,
    sortable: false,
  },
  {
    key: "noDataFields",
    label: "Missing Data",
    width: 7,
    visible: true,
    sortable: false,
  },
  {
    key: "status",
    label: "Status",
    width: 10,
    visible: true,
    sortable: false,
  },
  {
    key: "outcome",
    label: "Outcome",
    width: 12,
    visible: true,
    sortable: false,
  },
  {
    key: "button",
    label: "Action",
    width: 10,
    visible: true,
    sortable: false,
  },
  {
    key: "recordClosedBy",
    label: "POC",
    width: 6,
    visible: true,
    sortable: false,
  },
];

const STORAGE_KEY = "worklist_columns_config_v5";

const WorklistConfig = () => {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Add column form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColKey, setNewColKey] = useState("");
  const [newColLabel, setNewColLabel] = useState("");
  const [newColWidth, setNewColWidth] = useState(8);
  const [newColBqField, setNewColBqField] = useState("");
  const [addColError, setAddColError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as { columns: ColumnConfig[] };
        if (data?.columns) {
          // Migrate stale key "medication" → "drug" to match CmmOrderTableHeader
          const storedCols = data.columns.map((c) =>
            c.key === "medication" ? { ...c, key: "drug" } : c,
          );
          const storedMap = new Map(storedCols.map((c) => [c.key, c]));

          // Merge: use DEFAULT_COLUMNS as source of truth for keys & labels,
          // but keep stored visibility/width/sortable overrides
          const merged: ColumnConfig[] = DEFAULT_COLUMNS.map((def) => {
            const saved = storedMap.get(def.key);
            if (saved) {
              return {
                ...def,
                label: def.label, // always use latest label from code
                width: saved.width,
                visible: saved.visible,
                sortable: saved.sortable,
              };
            }
            return { ...def }; // new column not in stored config
          });

          setColumns(merged);
          // Persist the merged config so it stays in sync
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ columns: merged }),
          );
        }
      }
    } catch {
      // use default
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleVisible = useCallback((idx: number) => {
    setColumns((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], visible: !updated[idx].visible };
      return updated;
    });
    setHasChanges(true);
    setSaveMessage("");
  }, []);

  const handleToggleSortable = useCallback((idx: number) => {
    setColumns((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], sortable: !updated[idx].sortable };
      return updated;
    });
    setHasChanges(true);
    setSaveMessage("");
  }, []);

  const handleLabelChange = useCallback((idx: number, value: string) => {
    setColumns((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], label: value };
      return updated;
    });
    setHasChanges(true);
    setSaveMessage("");
  }, []);

  const handleWidthChange = useCallback((idx: number, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    setColumns((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], width: num };
      return updated;
    });
    setHasChanges(true);
    setSaveMessage("");
  }, []);

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback(
    (idx: number) => {
      if (dragIdx === null || dragIdx === idx) {
        setDragIdx(null);
        setDragOverIdx(null);
        return;
      }
      setColumns((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(dragIdx, 1);
        updated.splice(idx, 0, moved);
        return updated;
      });
      setDragIdx(null);
      setDragOverIdx(null);
      setHasChanges(true);
      setSaveMessage("");
    },
    [dragIdx],
  );

  const handleSave = useCallback(() => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns }));
      setHasChanges(false);
      setSaveMessage("Saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }, [columns]);

  const handleReset = useCallback(() => {
    setColumns(DEFAULT_COLUMNS);
    setHasChanges(true);
    setSaveMessage("");
  }, []);

  const handleDeleteColumn = useCallback((idx: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== idx));
    setHasChanges(true);
    setSaveMessage("");
  }, []);

  const handleAddColumn = useCallback(() => {
    setAddColError("");
    const key = newColKey.trim().replace(/\s+/g, "_");
    if (!key) {
      setAddColError("Column key is required.");
      return;
    }
    if (columns.some((c) => c.key === key)) {
      setAddColError("A column with this key already exists.");
      return;
    }
    if (!newColLabel.trim()) {
      setAddColError("Display label is required.");
      return;
    }

    const newCol: ColumnConfig = {
      key,
      label: newColLabel.trim(),
      width: newColWidth,
      visible: true,
      sortable: false,
    };
    setColumns((prev) => [...prev, newCol]);
    setHasChanges(true);

    // Also update field_mapping localStorage to include the new column.
    // Use DEFAULT_FIELD_MAPPING as base if nothing has been saved yet so we
    // don't wipe out the defaults the next time FieldMappingConfig loads.
    if (newColBqField) {
      try {
        const stored = localStorage.getItem("field_mapping");
        const existingMappings: any[] = stored
          ? (JSON.parse(stored).mappings ?? [...DEFAULT_FIELD_MAPPING])
          : [...DEFAULT_FIELD_MAPPING];
        if (!existingMappings.some((m: any) => m.columnKey === key)) {
          existingMappings.push({
            columnKey: key,
            label: newColLabel.trim(),
            cellType: "string",
            mainField: newColBqField,
            mappable: true,
          });
          localStorage.setItem(
            "field_mapping",
            JSON.stringify({ mappings: existingMappings }),
          );
        }
      } catch {
        /* ignore */
      }
    }

    setNewColKey("");
    setNewColLabel("");
    setNewColWidth(8);
    setNewColBqField("");
    setShowAddForm(false);
    setSaveMessage("");
  }, [columns, newColKey, newColLabel, newColWidth, newColBqField]);

  const totalWidth = columns
    .filter((c) => c.visible)
    .reduce((sum, c) => sum + c.width, 0);
  const visibleCount = columns.filter((c) => c.visible).length;

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
      <div className="flex shrink-0 items-center justify-between border-b border-primaryGray-14 bg-white px-4 py-3">
        <div>
          <h2 className="text-h11 font-bold text-primaryGray-1">
            Worklist Column Configuration
          </h2>
          <p className="mt-0.5 text-x-tiny text-primaryGray-6">
            {visibleCount} of {columns.length} columns visible
            <span className="mx-2">|</span>
            Total width:{" "}
            <code className="rounded bg-primaryGray-16 px-1.5 py-0.5 text-primaryGray-3">
              {totalWidth}%
            </code>
            {totalWidth !== 100 && (
              <span className="ml-2 text-secondaryOrange-3">
                (should be ~100%)
              </span>
            )}
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
            onClick={() => {
              setShowAddForm((v) => !v);
              setAddColError("");
            }}
            className="rounded border border-tertiaryBlue-5 px-3 py-1.5 text-x-tiny font-medium text-tertiaryBlue-5 transition-colors hover:bg-tertiaryBlue-13"
          >
            + Add Column
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
              className={`text-x-tiny ${saveMessage.includes("success") ? "text-tertiaryGreen-700" : "text-tertiaryRed-3"}`}
            >
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Add Column Form */}
        {showAddForm && (
          <div className="mb-4 rounded-lg border border-tertiaryBlue-8 bg-tertiaryBlue-13 p-4">
            <h3 className="mb-3 text-small font-bold text-primaryGray-1">
              New Column
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-tiny font-medium text-primaryGray-5">
                  Column Key <span className="text-tertiaryRed-3">*</span>
                </label>
                <input
                  value={newColKey}
                  onChange={(e) => setNewColKey(e.target.value)}
                  placeholder="e.g. patientAge"
                  className="rounded border border-primaryGray-13 px-2 py-1.5 text-small text-primaryGray-1 outline-none focus:border-tertiaryBlue-5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-tiny font-medium text-primaryGray-5">
                  Display Label <span className="text-tertiaryRed-3">*</span>
                </label>
                <input
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="e.g. Patient Age"
                  className="rounded border border-primaryGray-13 px-2 py-1.5 text-small text-primaryGray-1 outline-none focus:border-tertiaryBlue-5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-tiny font-medium text-primaryGray-5">
                  BigQuery Field Path
                </label>
                <select
                  value={newColBqField}
                  onChange={(e) => setNewColBqField(e.target.value)}
                  className="rounded border border-primaryGray-13 px-2 py-1.5 text-small text-primaryGray-1 outline-none focus:border-tertiaryBlue-5"
                >
                  <option value="">— Select field —</option>
                  {ALL_BQ_FIELD_PATHS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-tiny font-medium text-primaryGray-5">
                  Width (%)
                </label>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={newColWidth}
                  onChange={(e) =>
                    setNewColWidth(parseInt(e.target.value, 10) || 8)
                  }
                  className="rounded border border-primaryGray-13 px-2 py-1.5 text-small text-primaryGray-1 outline-none focus:border-tertiaryBlue-5"
                />
              </div>
            </div>
            {addColError && (
              <p className="mt-2 text-x-tiny text-tertiaryRed-3">
                {addColError}
              </p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setAddColError("");
                }}
                className="rounded border border-primaryGray-13 px-3 py-1.5 text-x-tiny text-primaryGray-5 hover:text-tertiaryRed-3"
              >
                Cancel
              </button>
              <button
                onClick={handleAddColumn}
                className="rounded bg-tertiaryBlue-5 px-4 py-1.5 text-x-tiny font-semibold text-white hover:bg-tertiaryBlue-3"
              >
                Add Column
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-primaryGray-13">
          <table className="w-full text-small">
            <thead>
              <tr className="bg-primaryGray-16">
                <th className="w-10 px-3 py-2.5 text-left text-tiny font-bold text-primaryGray-4"></th>
                <th className="w-10 px-3 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  #
                </th>
                <th className="w-[15%] px-3 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Column Key
                </th>
                <th className="w-[25%] px-3 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Display Label
                </th>
                <th className="w-[10%] px-3 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Width (%)
                </th>
                <th className="w-[10%] px-3 py-2.5 text-center text-tiny font-bold text-primaryGray-4">
                  Visible
                </th>
                <th className="w-[10%] px-3 py-2.5 text-center text-tiny font-bold text-primaryGray-4">
                  Sortable
                </th>
                <th className="px-3 py-2.5 text-left text-tiny font-bold text-primaryGray-4">
                  Preview
                </th>
                <th className="w-10 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr
                  key={col.key}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => {
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`cursor-grab border-t border-primaryGray-14 transition-colors active:cursor-grabbing ${
                    dragOverIdx === idx ? "bg-tertiaryBlue-12" : ""
                  } ${!col.visible ? "opacity-40" : "hover:bg-tertiaryBlue-13"}`}
                >
                  <td className="px-3 py-2 text-center">
                    <svg
                      className="inline-block h-4 w-4 text-primaryGray-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </td>
                  <td className="px-3 py-2 text-x-tiny text-primaryGray-6">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <code className="rounded bg-primaryGray-16 px-1.5 py-0.5 text-x-tiny text-primaryGray-3">
                      {col.key}
                    </code>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="-mx-1 w-full bg-transparent px-1 py-0.5 text-small text-primaryGray-1 outline-none focus:rounded focus:border focus:border-tertiaryBlue-5 focus:bg-white"
                      value={col.label}
                      onChange={(e) => handleLabelChange(idx, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      className="w-16 bg-transparent px-1 py-0.5 text-center text-small text-primaryGray-3 outline-none focus:rounded focus:border focus:border-tertiaryBlue-5 focus:bg-white"
                      value={col.width}
                      onChange={(e) => handleWidthChange(idx, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggleVisible(idx)}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        col.visible
                          ? "border-tertiaryBlue-5 bg-tertiaryBlue-5"
                          : "border-primaryGray-11 bg-white"
                      }`}
                    >
                      {col.visible && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggleSortable(idx)}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        col.sortable
                          ? "border-tertiaryBlue-5 bg-tertiaryBlue-5"
                          : "border-primaryGray-11 bg-white"
                      }`}
                    >
                      {col.sortable && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div
                      className="h-3 rounded-sm"
                      style={{
                        width: `${col.width * 3}px`,
                        backgroundColor: col.visible ? "#0056D6" : "#D1D1D1",
                        opacity: 0.3,
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDeleteColumn(idx)}
                      title="Delete column"
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-primaryGray-10 transition-colors hover:bg-tertiaryRed-8 hover:text-tertiaryRed-3"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg bg-primaryGray-16 p-3">
          <p className="mb-2 text-tiny font-bold text-primaryGray-3">
            Column Layout Preview
          </p>
          <div className="flex h-8 gap-0.5">
            {columns
              .filter((c) => c.visible)
              .map((col) => (
                <div
                  key={col.key}
                  className="flex items-center justify-center overflow-hidden rounded-sm border border-tertiaryBlue-8 bg-tertiaryBlue-10"
                  style={{ flex: col.width }}
                  title={`${col.label} (${col.width}%)`}
                >
                  <span className="truncate px-1 text-overline text-tertiaryBlue-3">
                    {col.label}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorklistConfig;
