import React from "react";

import { ChangeTracker } from "../../../../../api/services/prescriptionParsingConfigService";
import { AddIcon } from "../../../../../svg/add-icon";
import { Delete } from "../../../../../svg/delete";

interface PrescriptionParsingNestedViewerProps {
  data: any;
  onAddItem: (path: string[], itemValue: any) => void;
  onDeleteItem: (path: string[], itemIndex?: number, itemKey?: string) => void;
  changes: ChangeTracker[];
  originalData: any;
  excludeFields?: string[];
  isLoading?: boolean;
  parentPath?: string[];
  section?: "main" | "dosage" | "medicine";
}

const PrescriptionParsingNestedViewer: React.FC<
  PrescriptionParsingNestedViewerProps
> = ({
  data,
  onAddItem,
  onDeleteItem,
  changes,
  originalData,
  excludeFields = [],
  isLoading = false,
  parentPath = [],
  section = "main",
}) => {
  // Helper function to get change type for a path
  const getChangeForPath = (path: string[]): ChangeTracker | null => {
    const pathString = path.join(".");
    return (
      changes.find((change) => change.path.join(".") === pathString) || null
    );
  };

  // Helper function to get the value from original data
  const getOriginalValue = (path: string[]) => {
    if (!originalData) return undefined;
    let current = originalData;
    for (const segment of path) {
      if (current && typeof current === "object" && segment in current) {
        current = current[segment];
      } else {
        return undefined;
      }
    }
    return current;
  };

  // Helper function to check if an item is newly added
  const isNewlyAdded = (path: string[]): boolean => {
    const originalValue = getOriginalValue(path);
    const result = originalValue === undefined;

    // Debug logging
    if (result) {
      console.log(`[DEBUG] Newly added item detected:`, {
        path: path.join("."),
        originalValue,
        result,
      });
    }

    return result;
  };

  // Helper function to check if an item is deleted
  const isDeleted = (path: string[]): boolean => {
    const change = getChangeForPath(path);
    const result = change?.type === "delete";

    // Debug logging
    if (result) {
      console.log(`[DEBUG] Deleted item detected:`, {
        path: path.join("."),
        change,
        result,
      });
    }

    return result;
  };

  // Helper function to check if an item is modified
  const isModified = (path: string[]): boolean => {
    const change = getChangeForPath(path);
    return change?.type === "modify";
  };

  // Helper function to get style classes based on change status
  const getChangeStyles = (path: string[]) => {
    if (isNewlyAdded(path)) {
      return "font-bold text-green-700 bg-green-50 border-l-4 border-green-400";
    }
    if (isDeleted(path)) {
      return "opacity-50 text-gray-400 bg-red-50 border-l-4 border-red-400 line-through";
    }
    if (isModified(path)) {
      return "font-semibold text-blue-700 bg-blue-50 border-l-4 border-blue-400";
    }
    return "";
  };

  // Helper function to get section icon
  const getSectionIcon = (key: string): string => {
    if (key === "dosage_parsing") return "⚗️";
    if (key === "medicine_details") return "💊";
    if (key.includes("prompt")) return "💬";
    if (key.includes("rule")) return "📋";
    if (key.includes("config")) return "⚙️";
    return "📄";
  };

  // Helper function to get section color
  const getSectionColor = (key: string): string => {
    if (key === "dosage_parsing") return "bg-blue-50 border-blue-200";
    if (key === "medicine_details") return "bg-green-50 border-green-200";
    if (key.includes("prompt")) return "bg-white border-gray-200";
    // Remove yellow background for rule_mappings and other rule-related sections
    return "bg-gray-50 border-gray-200";
  };

  // Main render function for any value type
  const renderValue = (value: any, path: string[]): React.ReactNode => {
    const changeStyles = getChangeStyles(path);
    const change = getChangeForPath(path);

    if (value === null || value === undefined) {
      return (
        <div
          className={`rounded border border-gray-200 bg-gray-50 p-2 ${changeStyles}`}
        >
          <span className="text-small italic text-primaryGray-8">
            {value === null ? "null" : "undefined"}
          </span>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className={`rounded border p-3 shadow-sm ${changeStyles}`}>
          <div className="mb-2 flex items-center justify-end gap-2">
            {change && (
              <span
                className={`rounded-full px-2 py-1 text-tiny font-medium ${
                  change.type === "add"
                    ? "bg-green-200 text-green-800"
                    : change.type === "delete"
                      ? "bg-red-200 text-red-800"
                      : "bg-blue-200 text-blue-800"
                }`}
              >
                {change.type}
              </span>
            )}
            <button
              type="button"
              onClick={() => onAddItem(path, "")}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AddIcon width="16" height="16" color="#0056d6" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteItem(path)}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Delete width={16} height={16} />
            </button>
          </div>

          {/* Conditional rendering: horizontal for main config, vertical for others */}
          {section === "main" ? (
            /* Horizontal layout for main config */
            <div className="flex flex-wrap gap-2">
              {value.map((item, index) => {
                const itemPath = [...path, index.toString()];
                const itemChangeStyles = getChangeStyles(itemPath);
                const itemChange = getChangeForPath(itemPath);

                return (
                  <div
                    key={index}
                    className={`flex min-h-[32px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all duration-200 ease-in-out hover:shadow-md ${itemChangeStyles}`}
                  >
                    {typeof item === "object" && item !== null ? (
                      <span className="font-mono text-gray-600">
                        {JSON.stringify(item)}
                      </span>
                    ) : (
                      <span
                        className={`font-mono ${
                          isNewlyAdded(itemPath)
                            ? "font-bold text-green-700"
                            : isDeleted(itemPath)
                              ? "text-red-400 line-through opacity-50"
                              : isModified(itemPath)
                                ? "font-semibold text-blue-700"
                                : "text-gray-700"
                        }`}
                      >
                        {typeof item === "string" ? `"${item}"` : String(item)}
                      </span>
                    )}
                    {itemChange && (
                      <span
                        className={`rounded-full px-2 py-1 text-tiny font-medium ${
                          itemChange.type === "add"
                            ? "bg-green-200 text-green-800"
                            : itemChange.type === "delete"
                              ? "bg-red-200 text-red-800"
                              : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {itemChange.type}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(path, index)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Delete width={12} height={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Vertical layout for dosage and medicine sections */
            <div className="space-y-2">
              {value.map((item, index) => {
                const itemPath = [...path, index.toString()];
                const itemChangeStyles = getChangeStyles(itemPath);
                const itemChange = getChangeForPath(itemPath);

                return (
                  <div
                    key={index}
                    className={`border-l-2 border-primaryGray-16 pl-4 ${itemChangeStyles}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primaryGray-16 px-2 py-1 font-mono text-tiny text-primaryGray-8">
                          [{index}]
                        </span>
                        {itemChange && (
                          <span
                            className={`rounded-full px-2 py-1 text-tiny font-medium ${
                              itemChange.type === "add"
                                ? "bg-green-200 text-green-800"
                                : itemChange.type === "delete"
                                  ? "bg-red-200 text-red-800"
                                  : "bg-blue-200 text-blue-800"
                            }`}
                          >
                            {itemChange.type}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(path, index)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Delete width={16} height={16} />
                      </button>
                    </div>
                    <div className="mt-2">
                      {typeof item === "object" && item !== null ? (
                        <PrescriptionParsingNestedViewer
                          data={item}
                          onAddItem={onAddItem}
                          onDeleteItem={onDeleteItem}
                          changes={changes}
                          originalData={originalData}
                          excludeFields={excludeFields}
                          isLoading={isLoading}
                          parentPath={itemPath}
                          section={section}
                        />
                      ) : (
                        <div
                          className={`from-primaryGray-18 rounded-lg bg-gradient-to-r to-primaryGray-17 p-3 font-mono text-small shadow-sm ${
                            isNewlyAdded(itemPath)
                              ? "font-bold text-green-700"
                              : isDeleted(itemPath)
                                ? "text-red-400 opacity-50"
                                : isModified(itemPath)
                                  ? "font-semibold text-blue-700"
                                  : "text-primaryGray-1"
                          }`}
                        >
                          {String(item)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      const sectionKey = path.join(".");
      const keys = Object.keys(value).filter((key) => {
        if (excludeFields.includes(key)) return false;
        return true;
      });

      if (keys.length === 0) {
        return null; // Don't render empty objects
      }

      const sectionIcon = getSectionIcon(path[path.length - 1] || "");
      const sectionColor = getSectionColor(path[path.length - 1] || "");

      // Check if this is a prompt or heading that should have blue background
      const currentKey = path[path.length - 1] || "";
      const isPromptOrHeading =
        // Apply to prompts in all sections, not just main
        currentKey.toLowerCase().includes("prompt") ||
        currentKey.toLowerCase().includes("llm") ||
        // Apply to top level items in main config
        (section === "main" && parentPath.length === 0) ||
        // Apply to specific configuration sections
        (section === "main" && currentKey.toLowerCase().includes("config")) ||
        // Apply to top level items in dosage and medicine sections that are likely prompts
        ((section === "dosage" || section === "medicine") &&
          (currentKey.toLowerCase().includes("prompt") ||
            currentKey.toLowerCase().includes("llm") ||
            currentKey.toLowerCase().includes("config") ||
            parentPath.length === 0));

      return (
        <div
          className={`rounded border p-3 shadow-sm ${changeStyles || sectionColor}`}
        >
          {/* Only show header if this is not a top-level item (to avoid duplicates) */}
          {parentPath.length > 0 && (
            <div
              className={`mb-2 flex items-center justify-between ${
                isPromptOrHeading
                  ? "rounded-md border-l-4 border-blue-400 bg-blue-50 px-3 py-2"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-small font-medium ${
                    isPromptOrHeading ? "font-semibold text-blue-800" : ""
                  }`}
                >
                  {path[path.length - 1] || "Root"} ({keys.length} items)
                </span>
                {change && (
                  <span
                    className={`rounded-full px-2 py-1 text-tiny font-medium ${
                      change.type === "add"
                        ? "bg-green-200 text-green-800"
                        : change.type === "delete"
                          ? "bg-red-200 text-red-800"
                          : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    {change.type}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAddItem(path, {})}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AddIcon width="16" height="16" color="#0056d6" />
                </button>
                {path.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(path)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Delete width={16} height={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Check if this is metadata_configuration or route_mappings for horizontal display */}
          {(path[path.length - 1] === "metadata_configuration" ||
            path[path.length - 1] === "route_mappings") &&
          keys.every(
            (key) => typeof value[key] !== "object" || value[key] === null,
          ) ? (
            /* Horizontal layout for metadata_configuration and route_mappings */
            <div className="flex flex-wrap gap-2">
              {keys.map((key) => {
                const keyPath = [...path, key];
                const keyChangeStyles = getChangeStyles(keyPath);
                const keyChange = getChangeForPath(keyPath);

                return (
                  <div
                    key={key}
                    className={`flex min-h-[32px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all duration-200 ease-in-out hover:shadow-md ${keyChangeStyles}`}
                  >
                    <span
                      className={`font-medium ${
                        isNewlyAdded(keyPath)
                          ? "text-green-700"
                          : isDeleted(keyPath)
                            ? "text-red-400"
                            : isModified(keyPath)
                              ? "text-blue-700"
                              : "text-primaryGray-1"
                      }`}
                    >
                      {key}:
                    </span>
                    <span
                      className={`font-mono ${
                        isNewlyAdded(keyPath)
                          ? "font-bold text-green-700"
                          : isDeleted(keyPath)
                            ? "text-red-400 line-through opacity-50"
                            : isModified(keyPath)
                              ? "font-semibold text-blue-700"
                              : "text-gray-700"
                      }`}
                    >
                      {typeof value[key] === "string"
                        ? `"${value[key]}"`
                        : String(value[key])}
                    </span>
                    {keyChange && (
                      <span
                        className={`rounded-full px-2 py-1 text-tiny font-medium ${
                          keyChange.type === "add"
                            ? "bg-green-200 text-green-800"
                            : keyChange.type === "delete"
                              ? "bg-red-200 text-red-800"
                              : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {keyChange.type}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteItem(path, undefined, key)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Delete width={12} height={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Default vertical layout for all other objects */
            <div className="space-y-3">
              {keys.map((key) => {
                const keyPath = [...path, key];
                const keyChangeStyles = getChangeStyles(keyPath);
                const keyChange = getChangeForPath(keyPath);

                return (
                  <div
                    key={key}
                    className={`border-l-2 border-primaryGray-16 pl-4 ${keyChangeStyles}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-small font-medium ${
                            isNewlyAdded(keyPath)
                              ? "text-green-700"
                              : isDeleted(keyPath)
                                ? "text-red-400"
                                : isModified(keyPath)
                                  ? "text-blue-700"
                                  : "text-primaryGray-1"
                          }`}
                        >
                          {key}
                        </span>
                        {keyChange && (
                          <span
                            className={`rounded-full px-2 py-1 text-tiny font-medium ${
                              keyChange.type === "add"
                                ? "bg-green-200 text-green-800"
                                : keyChange.type === "delete"
                                  ? "bg-red-200 text-red-800"
                                  : "bg-blue-200 text-blue-800"
                            }`}
                          >
                            {keyChange.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-tiny text-primaryGray-8">
                          {keyPath.join(" > ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(path, undefined, key)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Delete width={16} height={16} />
                        </button>
                      </div>
                    </div>
                    {renderValue(value[key], keyPath)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Show add/delete buttons for top-level items */}
          {parentPath.length === 0 && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddItem(path, {})}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <AddIcon width="16" height="16" color="#0056d6" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Render primitive values (strings, numbers, booleans)
    return (
      <div className={`rounded border p-2 shadow-sm ${changeStyles}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-small ${
                  isNewlyAdded(path)
                    ? "font-bold text-green-700"
                    : isDeleted(path)
                      ? "text-red-400 opacity-50"
                      : isModified(path)
                        ? "font-semibold text-blue-700"
                        : "text-primaryGray-1"
                }`}
              >
                {typeof value === "string" ? `"${value}"` : String(value)}
              </span>
              <span className="text-tiny text-primaryGray-10">
                ({typeof value})
              </span>
              {change && (
                <span
                  className={`rounded px-1 text-tiny ${
                    change.type === "add"
                      ? "bg-green-200 text-green-800"
                      : change.type === "delete"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {change.type}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDeleteItem(path)}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Delete width={16} height={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!data) {
    return (
      <div className="py-8 text-center text-primaryGray-8">
        No configuration data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Render all data items */}
      {Object.keys(data).map((key) => {
        if (excludeFields.includes(key)) return null;

        const keyPath = [...parentPath, key];

        // Apply blue background logic here to avoid duplicate headings
        const isPromptOrHeading =
          // Apply to prompts in all sections
          key.toLowerCase().includes("prompt") ||
          key.toLowerCase().includes("llm") ||
          // Apply to top level items in main config
          (section === "main" && parentPath.length === 0) ||
          // Apply to specific configuration sections
          (section === "main" && key.toLowerCase().includes("config")) ||
          // Apply to top level items in dosage and medicine sections that are likely prompts
          ((section === "dosage" || section === "medicine") &&
            (key.toLowerCase().includes("prompt") ||
              key.toLowerCase().includes("llm") ||
              key.toLowerCase().includes("config") ||
              parentPath.length === 0));

        return (
          <div key={key} className="configuration-item">
            <div
              className={`mb-2 flex items-center justify-between ${
                isPromptOrHeading
                  ? "rounded-md border-l-4 border-blue-400 bg-blue-50 px-3 py-2"
                  : ""
              }`}
            >
              <h3
                className={`text-small font-medium ${
                  isPromptOrHeading
                    ? "font-semibold text-blue-800"
                    : "text-primaryGray-1"
                }`}
              >
                {key}
              </h3>
              <button
                type="button"
                onClick={() => onDeleteItem([...parentPath, key])}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Delete width={16} height={16} />
              </button>
            </div>
            <div className="pl-4">{renderValue(data[key], keyPath)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default PrescriptionParsingNestedViewer;
