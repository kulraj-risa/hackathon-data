import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState, TextInput } from "risa-oasis-ui_v2";
import { LoaderMessage } from "../../../../components/loaderMessage/loaderMessage";
import {
  clearChanges,
  fetchAllVersions,
  fetchPaFormConfiguration,
  saveChangesAsNewVersion,
  setData,
  switchVersion,
  updateDataAndTrackChange,
} from "../../../../redux/slice/paFormConfigSlice";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import PaFormNestedViewer from "./components/PaFormNestedViewer";
import PaFormTestAndDeploy from "./components/PaFormTestAndDeploy";
import VersionDropdown from "./components/VersionDropdown";

const PaFormConfiguration: React.FC = () => {
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
  } = useSelector((state: RootState) => state.paFormConfig);

  // Tab state for main navigation
  const [activeTab, setActiveTab] = useState<"configuration" | "test-deploy">(
    "configuration",
  );

  const [refreshing, setRefreshing] = useState(false);
  const [showPbmDialog, setShowPbmDialog] = useState(false);
  const [pbmFormName, setPbmFormName] = useState("");
  const [isAddingPbm, setIsAddingPbm] = useState(false);
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
    dispatch(fetchAllVersions());
    dispatch(fetchPaFormConfiguration());
  }, [dispatch]);

  // Handle version changes
  const handleVersionChange = (versionId: string) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        "You have unsaved changes. Are you sure you want to switch versions? Your changes will be lost.",
      );
      if (!confirmSwitch) return;
    }
    dispatch(switchVersion(versionId));
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchPaFormConfiguration(currentVersion));
      await dispatch(fetchAllVersions());
      controlToastState("pa-form-config-refreshed");
    } catch (error) {
      controlToastState("pa-form-config-refresh-error");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle save changes as new version
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) return;

    try {
      const newVersionId = await dispatch(
        saveChangesAsNewVersion(versionDescription || undefined),
      );
      controlToastState("pa-form-config-version-saved");
      setShowSaveDialog(false);
      setVersionDescription("");

      // Show success message with new version
      setTimeout(() => {
        alert(`Successfully created new version: ${newVersionId}`);
      }, 500);
    } catch (error) {
      controlToastState("pa-form-config-save-error");
    }
  };

  // Helper function to deep clone data
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

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string[], value: any): any => {
    const cloned = deepClone(obj);
    let current = cloned;

    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!current[segment]) {
        current[segment] = {};
      }
      current = current[segment];
    }

    const finalKey = path[path.length - 1];

    if (value === undefined) {
      delete current[finalKey];
    } else {
      current[finalKey] = value;
    }

    return cloned;
  };

  // Helper function to get nested value
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

  // Handle adding items with staging (no Firestore call)
  const handleAddItem = (path: string[], itemValue: any) => {
    setAddItemPath(path);
    setAddItemName("");
    setAddItemType("string");
    setShowAddItemDialog(true);
  };

  // Confirm add item
  const confirmAddItem = () => {
    if (!addItemName.trim()) return;

    try {
      let newValue: any;

      switch (addItemType) {
        case "array":
          newValue = [];
          break;
        case "object":
          newValue = {};
          break;
        default:
          newValue = addItemName.trim();
      }

      const currentValue = getNestedValue(data, addItemPath);
      const finalPath = [...addItemPath];

      // If it's an array, push the new item
      if (Array.isArray(currentValue)) {
        const newArray = [...currentValue, newValue];
        const updatedData = setNestedValue(data, addItemPath, newArray);

        dispatch(setData(updatedData));
        dispatch(
          updateDataAndTrackChange({
            path: [...addItemPath, currentValue.length.toString()],
            newValue,
            changeType: "add",
          }),
        );
      } else if (typeof currentValue === "object" && currentValue !== null) {
        // Adding to an object
        const newPath = [...addItemPath, addItemName.trim()];
        const updatedData = setNestedValue(data, newPath, newValue);

        dispatch(setData(updatedData));
        dispatch(
          updateDataAndTrackChange({
            path: newPath,
            newValue,
            changeType: "add",
          }),
        );
      } else {
        // Creating new structure
        const newPath = [...addItemPath, addItemName.trim()];
        const updatedData = setNestedValue(data, newPath, newValue);

        dispatch(setData(updatedData));
        dispatch(
          updateDataAndTrackChange({
            path: newPath,
            newValue,
            changeType: "add",
          }),
        );
      }

      setShowAddItemDialog(false);
      setAddItemName("");
      controlToastState("pa-form-config-item-staged");
    } catch (error) {
      console.error("Error staging item addition:", error);
      controlToastState("pa-form-config-item-add-error");
    }
  };

  // Handle deleting items with staging (no Firestore call)
  const handleDeleteItem = (
    path: string[],
    itemIndex?: number,
    itemKey?: string,
  ) => {
    try {
      const currentValue = getNestedValue(data, path);

      let updatedData;
      let deletedPath = path;

      if (Array.isArray(currentValue) && typeof itemIndex === "number") {
        // Deleting from array
        const newArray = [...currentValue];
        const deletedValue = newArray[itemIndex];
        newArray.splice(itemIndex, 1);

        updatedData = setNestedValue(data, path, newArray);
        deletedPath = [...path, itemIndex.toString()];

        dispatch(
          updateDataAndTrackChange({
            path: deletedPath,
            newValue: undefined,
            changeType: "delete",
            oldValue: deletedValue,
          }),
        );
      } else if (typeof currentValue === "object" && itemKey) {
        // Deleting from object
        const newObject = { ...currentValue };
        const deletedValue = newObject[itemKey];
        delete newObject[itemKey];

        updatedData = setNestedValue(data, path, newObject);
        deletedPath = [...path, itemKey];

        dispatch(
          updateDataAndTrackChange({
            path: deletedPath,
            newValue: undefined,
            changeType: "delete",
            oldValue: deletedValue,
          }),
        );
      } else {
        // Deleting entire key
        const oldValue = currentValue;
        updatedData = setNestedValue(data, path, undefined);

        dispatch(
          updateDataAndTrackChange({
            path,
            newValue: undefined,
            changeType: "delete",
            oldValue,
          }),
        );
      }

      dispatch(setData(updatedData));
      controlToastState("pa-form-config-item-staged-delete");
    } catch (error) {
      console.error("Error staging item deletion:", error);
      controlToastState("pa-form-config-item-delete-error");
    }
  };

  // Handle adding categories with staging (no Firestore call)
  const handleAddCategory = () => {
    setAddCategoryName("");
    setShowAddCategoryDialog(true);
  };

  // Confirm add category
  const confirmAddCategory = () => {
    if (!addCategoryName.trim()) return;

    try {
      const categoryName = addCategoryName.trim();
      const updatedData = setNestedValue(data, [categoryName], {});

      dispatch(setData(updatedData));
      dispatch(
        updateDataAndTrackChange({
          path: [categoryName],
          newValue: {},
          changeType: "add",
        }),
      );

      setShowAddCategoryDialog(false);
      setAddCategoryName("");
      controlToastState("pa-form-config-category-staged");
    } catch (error) {
      console.error("Error staging category addition:", error);
      controlToastState("pa-form-config-category-add-error");
    }
  };

  // Handle deleting categories with staging (no Firestore call)
  const handleDeleteCategory = async (categoryName: string) => {
    try {
      const oldValue = data[categoryName];
      const updatedData = setNestedValue(data, [categoryName], undefined);

      dispatch(setData(updatedData));
      dispatch(
        updateDataAndTrackChange({
          path: [categoryName],
          newValue: undefined,
          changeType: "delete",
          oldValue,
        }),
      );

      controlToastState("pa-form-config-category-staged-delete");
    } catch (error) {
      console.error("Error staging category deletion:", error);
      controlToastState("pa-form-config-category-delete-error");
    }
  };

  // Handle adding PBM objects with staging (no Firestore call)
  const handleAddPbm = async (formName: string) => {
    setIsAddingPbm(true);
    try {
      const pbmCasesPath = ["pbm_cases"];
      const currentPbmCases = getNestedValue(data, pbmCasesPath) || {};
      const newPbmCases = { ...currentPbmCases, [formName]: [] };

      const updatedData = setNestedValue(data, pbmCasesPath, newPbmCases);

      dispatch(setData(updatedData));
      dispatch(
        updateDataAndTrackChange({
          path: ["pbm_cases", formName],
          newValue: [],
          changeType: "add",
        }),
      );

      controlToastState("pa-form-config-pbm-staged");
      setShowPbmDialog(false);
      setPbmFormName("");
    } catch (error) {
      console.error("Error staging PBM addition:", error);
      controlToastState("pa-form-config-pbm-add-error");
    } finally {
      setIsAddingPbm(false);
    }
  };

  const handlePbmDialogSubmit = () => {
    if (pbmFormName.trim()) {
      handleAddPbm(pbmFormName.trim());
    }
  };

  // Handle clearing changes
  const handleClearChanges = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to discard all changes? This action cannot be undone.",
    );
    if (confirmClear) {
      dispatch(setData(originalData));
      dispatch(clearChanges());
    }
  };

  if (isLoading && !data) {
    return <LoaderMessage message="Loading PA Form Configuration..." />;
  }

  if (error) {
    return (
      <div className="pa-form-configuration__error">
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
    <div className="pa-form-configuration flex h-full flex-col">
      {/* Header with version dropdown and save button */}
      <div className="pa-form-configuration__header flex-shrink-0 border-b border-primaryGray-16 bg-gradient-to-r from-blue-50 to-white p-6 shadow-sm">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              PA Form Configuration
            </h2>
            <p className="mt-1 text-small font-medium text-primaryGray-8">
              Manage prior authorization form configurations with version
              control
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
              <VersionDropdown
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
      <div className="pa-form-configuration__content flex-1 overflow-y-auto">
        {activeTab === "configuration" ? (
          <div className="p-6">
            {/* Main Configuration Data */}
            {data ? (
              <div className="configuration-data">
                <PaFormNestedViewer
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
                  onAddPbmCase={() => setShowPbmDialog(true)}
                  isPbmAddingDisabled={isLoading || isSaving}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-small font-medium text-primaryGray-8">
                  No configuration data available
                </p>
                <p className="mt-1 text-tiny text-primaryGray-10">
                  Please check your connection and try refreshing
                </p>
              </div>
            )}
          </div>
        ) : (
          <PaFormTestAndDeploy />
        )}
      </div>

      {/* Footer with stats */}
      {data && (
        <div className="pa-form-configuration__footer from-primaryGray-18 flex-shrink-0 border-t border-primaryGray-16 bg-gradient-to-r to-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-full border border-primaryGray-16 bg-white px-3 py-1 text-tiny font-medium text-primaryGray-8">
              📊 {Object.keys(data).length} top-level categories
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
                      value="object"
                      checked={addItemType === "object"}
                      onChange={(e) => setAddItemType(e.target.value as any)}
                      className="mr-2"
                    />
                    Object (with nested properties)
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
                    Array (list of items)
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-actions flex justify-end gap-3">
              <Button
                buttonType="secondary"
                size="medium"
                onClick={() => setShowAddItemDialog(false)}
                disabled={false}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="medium"
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
                Enter the name for the new top-level category. Changes will be
                staged locally until saved.
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

            <div className="modal-actions flex justify-end gap-3">
              <Button
                buttonType="secondary"
                size="medium"
                onClick={() => setShowAddCategoryDialog(false)}
                disabled={false}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="medium"
                onClick={confirmAddCategory}
                disabled={!addCategoryName.trim()}
              >
                Add Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add PBM Dialog */}
      {showPbmDialog && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content mx-4 w-96 max-w-full rounded-lg bg-white p-6">
            <div className="modal-header mb-4">
              <h3 className="text-h12 font-semibold text-primaryGray-1">
                Add New PBM Case
              </h3>
              <p className="mt-1 text-small text-primaryGray-8">
                Enter the name for the new PBM case. It will be added to
                pbm_cases with an empty array as the default value. Changes will
                be staged locally until saved.
              </p>
            </div>

            <div className="modal-body mb-6">
              <TextInput
                id="pbm-form-name"
                label="PBM Case Name"
                placeholder="Enter PBM case name"
                onChange={(data) => setPbmFormName(data.value)}
                onBlur={(data) => setPbmFormName(data.value)}
                resetField={pbmFormName === ""}
                required
              />
            </div>

            <div className="modal-actions flex justify-end gap-3">
              <Button
                buttonType="secondary"
                size="medium"
                onClick={() => {
                  setShowPbmDialog(false);
                  setPbmFormName("");
                }}
                disabled={isAddingPbm}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="medium"
                onClick={handlePbmDialogSubmit}
                disabled={!pbmFormName.trim() || isAddingPbm}
              >
                {isAddingPbm ? "Adding..." : "Add PBM Case"}
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
                Save Changes as New Version
              </h3>
              <p className="mt-1 text-small text-primaryGray-8">
                This will create a new version with your staged changes while
                keeping the current version intact in Firestore.
              </p>
            </div>

            <div className="modal-body mb-6">
              <TextInput
                id="version-description"
                label="Version Description (Optional)"
                placeholder="Describe the changes made in this version"
                onChange={(data) => setVersionDescription(data.value)}
                onBlur={(data) => setVersionDescription(data.value)}
                resetField={versionDescription === ""}
              />

              <div className="changes-summary mt-4 rounded bg-gray-50 p-3">
                <h4 className="mb-2 text-small font-semibold text-gray-700">
                  Staged Changes Summary:
                </h4>
                <ul className="space-y-1 text-tiny text-gray-600">
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
                      <span>{change.path.join(" → ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="modal-actions flex justify-end gap-3">
              <Button
                buttonType="secondary"
                size="medium"
                onClick={() => {
                  setShowSaveDialog(false);
                  setVersionDescription("");
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="medium"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save New Version"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaFormConfiguration;
