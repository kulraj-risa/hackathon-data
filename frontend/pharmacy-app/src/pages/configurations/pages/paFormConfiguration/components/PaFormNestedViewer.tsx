import React, { useState } from "react";
import { Button, TextInput } from "risa-oasis-ui_v2";
import { ChangeTracker } from "../../../../../api/services/paFormConfigService";
import { AddIcon } from "../../../../../svg/add-icon";
import { Delete } from "../../../../../svg/delete";

interface PaFormNestedViewerProps {
  data: any;
  onAddItem?: (path: string[], itemValue: any) => void;
  onDeleteItem?: (path: string[], itemIndex?: number, itemKey?: string) => void;
  onAddCategory?: (categoryName: string) => void;
  onDeleteCategory?: (categoryName: string) => void;
  parentPath?: string[];
  excludeFields?: string[];
  changes?: ChangeTracker[];
  originalData?: any;
  onAddPbmCase?: () => void;
  isPbmAddingDisabled?: boolean;
}

const PaFormNestedViewer: React.FC<PaFormNestedViewerProps> = ({
  data,
  onAddItem,
  onDeleteItem,
  onAddCategory,
  onDeleteCategory,
  parentPath = [],
  excludeFields = ["id"],
  changes = [],
  originalData = null,
  onAddPbmCase,
  isPbmAddingDisabled = false,
}) => {
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleAddCategory = () => {
    if (newCategoryInput.trim() && onAddCategory) {
      onAddCategory(newCategoryInput.trim());
      setNewCategoryInput("");
      setShowAddCategoryInput(false);
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(categoryName);
    }
  };

  const handleAddItem = (path: string[], value: any) => {
    if (onAddItem) {
      onAddItem(path, value);
    }
  };

  const handleDeleteItem = (path: string[], index?: number, key?: string) => {
    if (onDeleteItem) {
      onDeleteItem(path, index, key);
    }
  };

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  // Helper function to check if a path has changes
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
    return originalValue === undefined;
  };

  // Helper function to check if an item is deleted
  const isDeleted = (path: string[]): boolean => {
    const change = getChangeForPath(path);
    return change?.type === "delete";
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

  if (!data || typeof data !== "object") {
    return (
      <div className="nested-viewer-empty bg-primaryGray-18 rounded border border-primaryGray-16 p-4">
        <p className="text-small text-primaryGray-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="nested-viewer">
      {Object.entries(data)
        .filter(([key]) => !excludeFields.includes(key))
        .map(([key, value]) => {
          const currentPath = [...parentPath, key];
          const isExpanded = expandedKeys.has(key);
          const changeStyles = getChangeStyles(currentPath);
          const change = getChangeForPath(currentPath);

          return (
            <div
              key={key}
              className={`nested-viewer-item mb-4 rounded-xl border shadow-sm transition-shadow hover:shadow-md ${changeStyles}`}
            >
              <div className="nested-viewer-item__header from-primaryGray-18 flex items-center justify-between rounded-t-xl bg-gradient-to-r to-primaryGray-17 px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="text-primaryGray-8 transition-all hover:scale-110 hover:text-primaryGray-1"
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>
                  <div className="nested-viewer-item__key-info">
                    <span
                      className={`text-small font-semibold ${
                        isNewlyAdded(currentPath)
                          ? "text-green-700"
                          : isDeleted(currentPath)
                            ? "text-red-400"
                            : isModified(currentPath)
                              ? "text-blue-700"
                              : "text-primaryGray-1"
                      }`}
                    >
                      {key}
                    </span>
                    {change && (
                      <span
                        className={`ml-2 rounded-full px-2 py-1 text-tiny font-medium ${
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
                    <span className="ml-2 text-tiny font-medium text-primaryGray-8">
                      {Array.isArray(value)
                        ? `Array (${value.length} items)`
                        : typeof value === "object" && value !== null
                          ? `Object (${Object.keys(value).length} keys)`
                          : typeof value}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Special handling for pbm_cases object */}
                  {key === "pbm_cases" &&
                    typeof value === "object" &&
                    value !== null &&
                    onAddPbmCase && (
                      <Button
                        buttonType="primary"
                        size="small"
                        onClick={onAddPbmCase}
                        disabled={isPbmAddingDisabled}
                      >
                        <AddIcon width="14" height="14" color="#ffffff" />
                        Add New PBM Case
                      </Button>
                    )}
                  {Array.isArray(value) && (
                    <Button
                      buttonType="tertiary"
                      size="small"
                      onClick={() => handleAddItem(currentPath, "")}
                      disabled={false}
                    >
                      <AddIcon width="14" height="14" color="#0056d6" />
                    </Button>
                  )}
                  <Button
                    buttonType="danger"
                    size="small"
                    onClick={() => handleDeleteItem(currentPath)}
                    disabled={false}
                  >
                    <Delete width={14} height={14} />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="nested-viewer-item__content bg-white p-4">
                  {Array.isArray(value) ? (
                    <div className="nested-viewer-array">
                      {value.length === 0 ? (
                        <p className="text-small italic text-primaryGray-8">
                          Empty array
                        </p>
                      ) : (
                        value.map((item, index) => {
                          const itemPath = [...currentPath, index.toString()];
                          const itemChangeStyles = getChangeStyles(itemPath);
                          const itemChange = getChangeForPath(itemPath);

                          return (
                            <div
                              key={index}
                              className={`nested-viewer-array-item mb-3 rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md ${itemChangeStyles}`}
                            >
                              <div className="flex items-center justify-between">
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
                                <Button
                                  buttonType="danger"
                                  size="small"
                                  onClick={() =>
                                    handleDeleteItem(currentPath, index)
                                  }
                                  disabled={false}
                                >
                                  <Delete width={12} height={12} />
                                </Button>
                              </div>
                              <div className="mt-2">
                                {typeof item === "object" && item !== null ? (
                                  <PaFormNestedViewer
                                    data={item}
                                    onAddItem={onAddItem}
                                    onDeleteItem={onDeleteItem}
                                    parentPath={itemPath}
                                    excludeFields={excludeFields}
                                    changes={changes}
                                    originalData={originalData}
                                    onAddPbmCase={onAddPbmCase}
                                    isPbmAddingDisabled={isPbmAddingDisabled}
                                  />
                                ) : (
                                  <div
                                    className={`from-primaryGray-18 rounded-lg bg-gradient-to-r to-primaryGray-17 p-3 font-mono text-small ${
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
                        })
                      )}
                    </div>
                  ) : typeof value === "object" && value !== null ? (
                    <PaFormNestedViewer
                      data={value}
                      onAddItem={onAddItem}
                      onDeleteItem={onDeleteItem}
                      parentPath={currentPath}
                      excludeFields={excludeFields}
                      changes={changes}
                      originalData={originalData}
                      onAddPbmCase={onAddPbmCase}
                      isPbmAddingDisabled={isPbmAddingDisabled}
                    />
                  ) : (
                    <div
                      className={`from-primaryGray-18 rounded-lg bg-gradient-to-r to-primaryGray-17 p-3 font-mono text-small shadow-sm ${
                        isNewlyAdded(currentPath)
                          ? "font-bold text-green-700"
                          : isDeleted(currentPath)
                            ? "text-red-400 opacity-50"
                            : isModified(currentPath)
                              ? "font-semibold text-blue-700"
                              : "text-primaryGray-1"
                      }`}
                    >
                      {String(value)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {/* Add New Category - only show at top level */}
      {parentPath.length === 0 && onAddCategory && (
        <div className="add-category-section mt-6">
          {!showAddCategoryInput ? (
            <div className="text-center">
              <Button
                buttonType="tertiary"
                size="medium"
                onClick={() => setShowAddCategoryInput(true)}
                disabled={false}
              >
                <AddIcon width="16" height="16" color="#0056d6" />
                Add New Category
              </Button>
            </div>
          ) : (
            <div className="add-category-input from-primaryGray-18 rounded-xl border border-primaryGray-16 bg-gradient-to-r to-primaryGray-17 p-4 shadow-sm">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <TextInput
                    id="add-category"
                    label="Category Name"
                    placeholder="Enter category name"
                    onChange={(data) => setNewCategoryInput(data.value)}
                    onBlur={(data) => setNewCategoryInput(data.value)}
                    resetField={newCategoryInput === ""}
                  />
                </div>
                <Button
                  buttonType="primary"
                  size="small"
                  onClick={handleAddCategory}
                  disabled={!newCategoryInput.trim()}
                >
                  Add
                </Button>
                <Button
                  buttonType="secondary"
                  size="small"
                  onClick={() => setShowAddCategoryInput(false)}
                  disabled={false}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaFormNestedViewer;
