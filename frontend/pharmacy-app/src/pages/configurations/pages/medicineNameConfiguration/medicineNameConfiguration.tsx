import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState, TextInput } from "risa-oasis-ui_v2";
import { LoaderMessage } from "../../../../components/loaderMessage/loaderMessage";
import {
  clearMedicineNameChanges,
  fetchAllMedicineNameVersions,
  fetchMedicineNameConfiguration,
  saveMedicineNameChangesAsNewVersion,
  setMedicineNameData,
  switchMedicineNameVersion,
  updateMedicineNameDataAndTrackChange,
} from "../../../../redux/slice/medicineNameConfigSlice";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import MedicineNameNestedViewer from "./components/MedicineNameNestedViewer";
import MedicineNameTestAndDeploy from "./components/MedicineNameTestAndDeploy";
import MedicineNameVersionDropdown from "./components/MedicineNameVersionDropdown";

const MedicineNameConfiguration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    data,
    versions,
    currentVersion,
    isLoading,
    isVersionsLoading,
    error,
    changes,
    hasUnsavedChanges,
    isSaving,
    originalData,
  } = useSelector((state: RootState) => state.medicineNameConfig);

  // Tab state for main navigation
  const [activeTab, setActiveTab] = useState<"configuration" | "test-deploy">(
    "configuration",
  );

  const [refreshing, setRefreshing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionDescription, setVersionDescription] = useState("");

  // Add input dialogs state
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [addItemPath, setAddItemPath] = useState<string[]>([]);
  const [addItemName, setAddItemName] = useState("");
  const [addItemType, setAddItemType] = useState<"string" | "array" | "object">(
    "string",
  );

  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState("");

  // Initialize data on component mount
  useEffect(() => {
    dispatch(fetchAllMedicineNameVersions());
    dispatch(fetchMedicineNameConfiguration());
  }, [dispatch]);

  // Handle version changes
  const handleVersionChange = (versionId: string) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        "You have unsaved changes. Are you sure you want to switch versions? Your changes will be lost.",
      );
      if (!confirmSwitch) return;
    }
    dispatch(switchMedicineNameVersion(versionId));
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchMedicineNameConfiguration(currentVersion));
      await dispatch(fetchAllMedicineNameVersions());
      controlToastState("medicine-name-config-refreshed");
    } catch (error) {
      controlToastState("medicine-name-config-refresh-error");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle save changes as new version
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) return;

    try {
      const newVersionId = await dispatch(
        saveMedicineNameChangesAsNewVersion(versionDescription || undefined),
      );
      controlToastState("medicine-name-config-version-saved");
      setShowSaveDialog(false);
      setVersionDescription("");

      // Show success message with new version
      setTimeout(() => {
        alert(`Successfully created new version: ${newVersionId}`);
      }, 500);
    } catch (error) {
      controlToastState("medicine-name-config-save-error");
    }
  };

  // Helper functions for local data manipulation
  const deepClone = (obj: any): any => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(deepClone);

    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  };

  const setNestedValue = (obj: any, path: string[], value: any): any => {
    const result = deepClone(obj);
    let current = result;

    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!(segment in current)) {
        current[segment] = {};
      }
      current = current[segment];
    }

    const lastSegment = path[path.length - 1];
    current[lastSegment] = value;

    return result;
  };

  const getNestedValue = (obj: any, path: string[]): any => {
    let current = obj;
    for (const segment of path) {
      if (current && typeof current === "object" && segment in current) {
        current = current[segment];
      } else {
        return undefined;
      }
    }
    return current;
  };

  const handleAddItem = (path: string[], itemValue: any) => {
    setAddItemPath(path);
    setShowAddItemDialog(true);
  };

  const confirmAddItem = () => {
    if (!addItemName.trim()) return;

    let itemValue: any;
    switch (addItemType) {
      case "string":
        itemValue = "";
        break;
      case "array":
        itemValue = [];
        break;
      case "object":
        itemValue = {};
        break;
      default:
        itemValue = "";
    }

    const newData = deepClone(data);
    let current = newData;

    // Navigate to the target location
    for (let i = 0; i < addItemPath.length; i++) {
      const segment = addItemPath[i];
      if (!(segment in current)) {
        current[segment] = {};
      }
      current = current[segment];
    }

    // Add the new item
    if (Array.isArray(current)) {
      current.push(itemValue);
    } else if (typeof current === "object") {
      current[addItemName] = itemValue;
    }

    const change = {
      type: "add" as const,
      path: [...addItemPath, addItemName],
      oldValue: undefined,
      newValue: itemValue,
      timestamp: new Date().toISOString(),
    };

    dispatch(updateMedicineNameDataAndTrackChange({ data: newData, change }));

    // Reset dialog state
    setShowAddItemDialog(false);
    setAddItemName("");
    setAddItemType("string");
    setAddItemPath([]);
  };

  const handleDeleteItem = (
    path: string[],
    itemIndex?: number,
    itemKey?: string,
  ) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone.",
    );
    if (!confirmDelete) return;

    const newData = deepClone(data);
    let current = newData;

    // Navigate to the parent of the target item
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!(segment in current)) {
        console.error(`Path not found: ${path.slice(0, i + 1).join(".")}`);
        return;
      }
      current = current[segment];
    }

    const lastSegment = path[path.length - 1];
    const oldValue = current[lastSegment];

    if (itemIndex !== undefined && Array.isArray(current[lastSegment])) {
      // Delete from array
      current[lastSegment].splice(itemIndex, 1);
    } else if (itemKey && typeof current[lastSegment] === "object") {
      // Delete from object
      delete current[lastSegment][itemKey];
    } else {
      // Delete entire property
      delete current[lastSegment];
    }

    const change = {
      type: "delete" as const,
      path: path,
      oldValue: oldValue,
      newValue: undefined,
      timestamp: new Date().toISOString(),
    };

    dispatch(updateMedicineNameDataAndTrackChange({ data: newData, change }));
  };

  const handleAddCategory = () => {
    setShowAddCategoryDialog(true);
  };

  const confirmAddCategory = () => {
    if (!addCategoryName.trim()) return;

    const newData = deepClone(data);
    newData[addCategoryName] = {};

    const change = {
      type: "add" as const,
      path: [addCategoryName],
      oldValue: undefined,
      newValue: {},
      timestamp: new Date().toISOString(),
    };

    dispatch(updateMedicineNameDataAndTrackChange({ data: newData, change }));

    // Reset dialog state
    setShowAddCategoryDialog(false);
    setAddCategoryName("");
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    const newData = deepClone(data);
    const oldValue = newData[categoryName];
    delete newData[categoryName];

    const change = {
      type: "delete" as const,
      path: [categoryName],
      oldValue: oldValue,
      newValue: undefined,
      timestamp: new Date().toISOString(),
    };

    dispatch(updateMedicineNameDataAndTrackChange({ data: newData, change }));
  };

  const handleClearChanges = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to discard all changes? This action cannot be undone.",
    );
    if (confirmClear) {
      dispatch(setMedicineNameData(originalData));
      dispatch(clearMedicineNameChanges());
    }
  };

  if (isLoading && !data) {
    return <LoaderMessage message="Loading Medicine Name Configuration..." />;
  }

  if (error) {
    return (
      <div className="medicine-name-configuration__error">
        <div className="error-message rounded border border-red-200 bg-red-50 p-4">
          <h3 className="text-h12 font-semibold text-red-800">Error</h3>
          <p className="mt-1 text-small text-red-700">{error}</p>
          <Button
            buttonType="primary"
            size="small"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="medicine-name-configuration flex h-full flex-col">
      {/* Header with version dropdown and save button */}
      <div className="medicine-name-configuration__header flex-shrink-0 border-b border-primaryGray-16 bg-gradient-to-r from-blue-50 to-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-h11 font-bold text-primaryGray-1">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z"
                />
              </svg>
              Medicine Name Configuration
            </h2>
            <p className="mt-1 text-small font-medium text-primaryGray-8">
              Manage medicine name configurations with version control
            </p>
            {hasUnsavedChanges && activeTab === "configuration" && (
              <div className="mt-2 flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-tiny font-medium text-orange-600">
                <span className="text-orange-500">⚠️</span>
                You have unsaved changes that are only visible in the UI. Click
                "Save as New Version" to persist them.
              </div>
            )}
          </div>

          {activeTab === "configuration" && (
            <div className="flex items-center gap-3">
              <Button
                buttonType="secondary"
                size="small"
                onClick={handleRefresh}
                disabled={isLoading || refreshing}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              {hasUnsavedChanges && (
                <Button
                  buttonType="tertiary"
                  size="small"
                  onClick={handleClearChanges}
                  disabled={isSaving}
                >
                  Discard Changes
                </Button>
              )}
              <Button
                buttonType="primary"
                size="small"
                onClick={() => setShowSaveDialog(true)}
                disabled={!hasUnsavedChanges || isSaving}
              >
                {isSaving ? "Saving..." : "Save as New Version"}
              </Button>
            </div>
          )}
        </div>

        {/* Main Tab Navigation */}
        <div className="mt-4 flex items-center border-b border-primaryGray-16">
          <div className="flex">
            <button
              onClick={() => setActiveTab("configuration")}
              className={`px-4 py-2 text-small font-medium transition-colors ${
                activeTab === "configuration"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-primaryGray-8 hover:text-primaryGray-1"
              }`}
            >
              ⚙️ Configuration
            </button>
            <button
              onClick={() => setActiveTab("test-deploy")}
              className={`px-4 py-2 text-small font-medium transition-colors ${
                activeTab === "test-deploy"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-primaryGray-8 hover:text-primaryGray-1"
              }`}
            >
              🚀 Test & Deploy
            </button>
          </div>
        </div>

        {/* Configuration Tab - Version Dropdown */}
        {activeTab === "configuration" && (
          <div className="mt-4 flex items-start gap-4">
            <div className="flex-1">
              <MedicineNameVersionDropdown
                versions={versions}
                currentVersion={currentVersion}
                onVersionChange={handleVersionChange}
                isLoading={isVersionsLoading}
                disabled={isSaving}
              />
            </div>
            {hasUnsavedChanges && (
              <div className="rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100 px-4 py-2 shadow-sm">
                <div className="text-small font-medium text-yellow-800">
                  <strong>{changes.length}</strong> unsaved change
                  {changes.length !== 1 ? "s" : ""} (staged locally)
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="medicine-name-configuration__content flex-1 overflow-y-auto">
        {activeTab === "configuration" ? (
          <div className="p-6">
            {/* Main Configuration Data */}
            {data ? (
              <div className="configuration-data">
                <MedicineNameNestedViewer
                  data={data}
                  onAddItem={handleAddItem}
                  onDeleteItem={handleDeleteItem}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  changes={changes}
                  originalData={originalData}
                  excludeFields={[
                    "id",
                    "created_at",
                    "created_by",
                    "description",
                  ]}
                />
              </div>
            ) : (
              <div className="no-data from-primaryGray-18 rounded-xl border border-primaryGray-16 bg-gradient-to-br to-primaryGray-17 p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primaryGray-16">
                  <svg
                    className="h-8 w-8 text-primaryGray-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z"
                    />
                  </svg>
                </div>
                <p className="text-small font-medium text-primaryGray-8">
                  No medicine name configuration data available
                </p>
                <p className="mt-1 text-tiny text-primaryGray-10">
                  Please check your connection and try refreshing
                </p>
              </div>
            )}
          </div>
        ) : (
          <MedicineNameTestAndDeploy />
        )}
      </div>

      {/* Footer with stats */}
      {data && (
        <div className="medicine-name-configuration__footer from-primaryGray-18 flex-shrink-0 border-t border-primaryGray-16 bg-gradient-to-r to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-full border border-primaryGray-16 bg-white px-3 py-1 text-tiny font-medium text-primaryGray-8">
              💊 {Object.keys(data).length} top-level categories
            </div>
            <div className="rounded-full border border-primaryGray-16 bg-white px-3 py-1 text-tiny font-medium text-primaryGray-8">
              🔄 Version: {currentVersion} | 📝 Changes: {changes.length}{" "}
              (staged)
            </div>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddItemDialog && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content mx-4 w-96 max-w-full rounded-lg bg-white p-6">
            <div className="modal-header mb-4">
              <h3 className="text-h12 font-semibold text-primaryGray-1">
                Add New Item
              </h3>
              <p className="mt-1 text-small text-primaryGray-8">
                Enter the name and type for the new item. Changes will be staged
                locally until saved.
              </p>
            </div>

            <div className="modal-body mb-6 space-y-4">
              <TextInput
                id="add-item-name"
                label="Item Name"
                placeholder="Enter item name"
                onChange={(data) => setAddItemName(data.value)}
                onBlur={(data) => setAddItemName(data.value)}
                resetField={addItemName === ""}
                required
              />

              <div>
                <label className="mb-2 block text-small font-medium text-primaryGray-1">
                  Item Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="itemType"
                      value="string"
                      checked={addItemType === "string"}
                      onChange={(e) => setAddItemType(e.target.value as any)}
                      className="mr-2"
                    />
                    Text Value
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="itemType"
                      value="array"
                      checked={addItemType === "array"}
                      onChange={(e) => setAddItemType(e.target.value as any)}
                      className="mr-2"
                    />
                    Array
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="itemType"
                      value="object"
                      checked={addItemType === "object"}
                      onChange={(e) => setAddItemType(e.target.value as any)}
                      className="mr-2"
                    />
                    Object
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer flex gap-2">
              <Button
                buttonType="secondary"
                size="small"
                onClick={() => setShowAddItemDialog(false)}
                disabled={false}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="small"
                onClick={confirmAddItem}
                disabled={!addItemName.trim()}
              >
                Add Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Dialog */}
      {showAddCategoryDialog && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content mx-4 w-96 max-w-full rounded-lg bg-white p-6">
            <div className="modal-header mb-4">
              <h3 className="text-h12 font-semibold text-primaryGray-1">
                Add New Category
              </h3>
              <p className="mt-1 text-small text-primaryGray-8">
                Enter the name for the new category. Changes will be staged
                locally until saved.
              </p>
            </div>

            <div className="modal-body mb-6">
              <TextInput
                id="add-category-name"
                label="Category Name"
                placeholder="Enter category name"
                onChange={(data) => setAddCategoryName(data.value)}
                onBlur={(data) => setAddCategoryName(data.value)}
                resetField={addCategoryName === ""}
                required
              />
            </div>

            <div className="modal-footer flex gap-2">
              <Button
                buttonType="secondary"
                size="small"
                onClick={() => setShowAddCategoryDialog(false)}
                disabled={false}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="small"
                onClick={confirmAddCategory}
                disabled={!addCategoryName.trim()}
              >
                Add Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content mx-4 w-96 max-w-full rounded-lg bg-white p-6">
            <div className="modal-header mb-4">
              <h3 className="text-h12 font-semibold text-primaryGray-1">
                Save as New Version
              </h3>
              <p className="mt-1 text-small text-primaryGray-8">
                Create a new version with your changes
              </p>
            </div>

            <div className="modal-body mb-6 space-y-4">
              <TextInput
                id="version-description"
                label="Version Description (Optional)"
                placeholder="Enter version description"
                onChange={(data) => setVersionDescription(data.value)}
                onBlur={(data) => setVersionDescription(data.value)}
                resetField={versionDescription === ""}
              />

              <div className="changes-summary">
                <h4 className="mb-2 text-small font-medium text-primaryGray-1">
                  Summary of Changes:
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {changes.map((change, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-1 text-tiny ${
                            change.type === "add"
                              ? "bg-green-200 text-green-800"
                              : change.type === "delete"
                                ? "bg-red-200 text-red-800"
                                : "bg-blue-200 text-blue-800"
                          }`}
                        >
                          {change.type}
                        </span>
                        <span className="text-tiny text-primaryGray-8">
                          {change.path.join(" → ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer flex gap-2">
              <Button
                buttonType="secondary"
                size="small"
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="small"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Version"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineNameConfiguration;
