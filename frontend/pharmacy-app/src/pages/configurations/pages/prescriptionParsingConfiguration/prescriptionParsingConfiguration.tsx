import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState, TextInput } from "risa-oasis-ui_v2";
import { LoaderMessage } from "../../../../components/loaderMessage/loaderMessage";

import {
  clearChanges,
  setData,
  updateDataAndTrackChange,
} from "../../../../redux/slice/paFormConfigSlice";
import {
  fetchAllPrescriptionParsingVersionsForSection,
  fetchPrescriptionParsingConfigurationForSection,
  savePrescriptionParsingChangesAsNewVersion,
  switchPrescriptionParsingVersionForSection,
} from "../../../../redux/slice/prescriptionParsingConfigSlice copy";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import PrescriptionParsingNestedViewer from "./components/PrescriptionParsingNestedViewer";
import PrescriptionParsingTestAndDeploy from "./components/PrescriptionParsingTestAndDeploy";
import PrescriptionParsingVersionDropdown from "./components/PrescriptionParsingVersionDropdown";

const PrescriptionParsingConfiguration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    data,
    versions,
    currentVersions,
    isLoading,
    isVersionsLoading,
    error,
    changes,
    hasUnsavedChanges,
    isSaving,
    originalData,
  } = useSelector((state: RootState) => state.prescriptionParsingConfig);

  // Tab state for main navigation
  const [activeTab, setActiveTab] = useState<"configuration" | "test-deploy">(
    "configuration",
  );

  // Tab state for configuration sections
  const [configSectionTab, setConfigSectionTab] = useState<
    "main" | "dosage" | "medicine"
  >("main");

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

  // Custom key-value add dialog state (for medicine_types, route_mappings, cmm_unit_mappings)
  const [showKeyValueAddDialog, setShowKeyValueAddDialog] = useState(false);
  const [keyValueAddPath, setKeyValueAddPath] = useState<string[]>([]);
  const [keyValueAddType, setKeyValueAddType] = useState<
    "medicine_types" | "route_mappings" | "cmm_unit_mappings"
  >("medicine_types");
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");

  // Get current section versions and version
  const getCurrentVersions = () => versions[configSectionTab] || [];
  const getCurrentVersion = () => currentVersions[configSectionTab] || "v1";

  // Initialize data on component mount
  useEffect(() => {
    // Fetch versions for all sections so Test & Deploy dropdowns are populated
    dispatch(fetchAllPrescriptionParsingVersionsForSection("main"));
    dispatch(fetchAllPrescriptionParsingVersionsForSection("dosage"));
    dispatch(fetchAllPrescriptionParsingVersionsForSection("medicine"));
  }, [dispatch]); // Only run once on mount

  // Fetch configuration when section changes
  useEffect(() => {
    dispatch(
      fetchPrescriptionParsingConfigurationForSection(
        getCurrentVersion(),
        configSectionTab,
      ),
    );
  }, [dispatch, configSectionTab]);

  // Refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(
        fetchPrescriptionParsingConfigurationForSection(
          getCurrentVersion(),
          configSectionTab,
        ),
      );
      controlToastState("prescription-parsing-config-refresh-success");
    } catch (error) {
      controlToastState("prescription-parsing-config-refresh-error");
    } finally {
      setRefreshing(false);
    }
  };

  // Version switching
  const handleVersionChange = async (versionId: string) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        "You have unsaved changes. Switching versions will discard these changes. Continue?",
      );
      if (!confirmSwitch) return;
    }
    dispatch(
      switchPrescriptionParsingVersionForSection(versionId, configSectionTab),
    );
  };

  // Save functionality
  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      controlToastState("prescription-parsing-config-no-changes");
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveDialogSubmit = async () => {
    try {
      await dispatch(
        savePrescriptionParsingChangesAsNewVersion({
          description: versionDescription,
          section: configSectionTab,
        }),
      );
      setShowSaveDialog(false);
      setVersionDescription("");
      controlToastState("prescription-parsing-config-save-success");
    } catch (error) {
      controlToastState("prescription-parsing-config-save-error");
    }
  };

  // Helper function to get nested value
  const getNestedValue = (obj: any, path: string[]): any => {
    return path.reduce((current, key) => current?.[key], obj);
  };

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string[], value: any): any => {
    const result = { ...obj };
    let current = result;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current[key] = { ...current[key] };
      current = current[key];
    }
    current[path[path.length - 1]] = value;
    return result;
  };

  // Helper function to get section-specific data
  const getSectionData = () => {
    if (!data) return null;

    switch (configSectionTab) {
      case "main":
        // Return only specific keys for main config
        const allowedKeys = [
          "dispensed_medication_parsing",
          "medicine_types",
          "metadata_configuration",
          "route_mappings",
          "rule_mappings",
          "special_handling",
          "unit_mappings",
        ];

        const mainData: any = {};
        allowedKeys.forEach((key) => {
          if (data[key] !== undefined) {
            if (key === "metadata_configuration") {
              // For metadata_configuration, only show cmm_unit_mappings
              if (data[key] && data[key].cmm_unit_mappings !== undefined) {
                mainData[key] = {
                  cmm_unit_mappings: data[key].cmm_unit_mappings,
                };
              }
            } else if (key === "medicine_types") {
              // For medicine_types, show all objects but only the medicines key inside each object
              if (data[key] && typeof data[key] === "object") {
                mainData[key] = {};
                Object.keys(data[key]).forEach((medicineTypeKey) => {
                  const medicineTypeObject = data[key][medicineTypeKey];
                  if (
                    medicineTypeObject &&
                    medicineTypeObject.medicines !== undefined
                  ) {
                    mainData[key][medicineTypeKey] = {
                      medicines: medicineTypeObject.medicines,
                    };
                  }
                });
              }
            } else {
              mainData[key] = data[key];
            }
          }
        });

        return mainData;
      case "dosage":
        // For dosage section, the data IS the dosage_parsing data directly
        return data;
      case "medicine":
        // For medicine section, the data IS the medicine_details data directly
        return data;
      default:
        return null;
    }
  };

  // Helper function to get section-specific changes
  const getSectionChanges = () => {
    if (configSectionTab === "main") {
      // For main section, exclude changes that start with dosage_parsing or medicine_details
      const filteredChanges = changes.filter((change) => {
        const pathString = change.path.join(".");
        return (
          !pathString.startsWith("dosage_parsing.") &&
          !pathString.startsWith("medicine_details.")
        );
      });

      // Debug logging for main section
      console.log(`[DEBUG] Section changes for main:`, {
        originalChanges: changes,
        filteredChanges,
      });

      return filteredChanges;
    } else {
      // For dosage and medicine sections, use all changes directly
      // since they work with the data directly (no section prefix needed)
      console.log(`[DEBUG] Section changes for ${configSectionTab}:`, {
        originalChanges: changes,
        directChanges: changes,
      });

      return changes;
    }
  };

  // Helper function to get section-specific original data
  const getSectionOriginalData = () => {
    if (!originalData) return null;

    switch (configSectionTab) {
      case "main":
        const mainOriginalData = { ...originalData };
        delete mainOriginalData.dosage_parsing;
        delete mainOriginalData.medicine_details;

        // Debug logging
        console.log(`[DEBUG] Original data for main:`, {
          fullOriginalData: originalData,
          mainOriginalData,
          section: configSectionTab,
        });

        return mainOriginalData;
      case "dosage":
        // For dosage section, the originalData IS the dosage_parsing data directly
        const dosageOriginalData = originalData;

        // Debug logging
        console.log(`[DEBUG] Original data for dosage:`, {
          fullOriginalData: originalData,
          dosageOriginalData,
          section: configSectionTab,
        });

        return dosageOriginalData;
      case "medicine":
        // For medicine section, the originalData IS the medicine_details data directly
        const medicineOriginalData = originalData;

        // Debug logging
        console.log(`[DEBUG] Original data for medicine:`, {
          fullOriginalData: originalData,
          medicineOriginalData,
          section: configSectionTab,
        });

        return medicineOriginalData;
      default:
        return null;
    }
  };

  // Handle adding items
  const handleAddItem = (path: string[], itemValue: any) => {
    // For main section, no path adjustment needed
    // For dosage and medicine sections, work with paths directly since data is already section-specific
    const adjustedPath = configSectionTab === "main" ? path : path;

    // Check if we're adding to key-value mappings (medicine_types, route_mappings, cmm_unit_mappings)
    const isMedicineTypesItem =
      adjustedPath.length >= 2 &&
      adjustedPath[0] === "medicine_types" &&
      adjustedPath[1] !== undefined;

    const isRouteMappingsItem =
      adjustedPath.length >= 1 && adjustedPath[0] === "route_mappings";

    const isCmmUnitMappingsItem =
      adjustedPath.length >= 2 &&
      adjustedPath[0] === "metadata_configuration" &&
      adjustedPath[1] === "cmm_unit_mappings";

    if (isMedicineTypesItem || isRouteMappingsItem || isCmmUnitMappingsItem) {
      // Show custom key-value dialog
      setKeyValueAddPath(adjustedPath);
      setKeyValueAddType(
        isMedicineTypesItem
          ? "medicine_types"
          : isRouteMappingsItem
            ? "route_mappings"
            : "cmm_unit_mappings",
      );
      setKeyName("");
      setKeyValue("");
      setShowKeyValueAddDialog(true);
    } else {
      // Show regular add dialog
      setAddItemPath(adjustedPath);
      setAddItemName("");
      setAddItemType("string");
      setShowAddItemDialog(true);
    }
  };

  const handleAddItemSubmit = async () => {
    if (!addItemName.trim() || !data) return;

    try {
      const currentValue = getNestedValue(data, addItemPath);
      let updatedData;
      let finalPath;
      let newValue: any;

      // If it's an array, push the new item with the user's input as the value
      if (Array.isArray(currentValue)) {
        // For arrays, use the user's input as the actual value based on the type
        switch (addItemType) {
          case "string":
            newValue = addItemName.trim();
            break;
          case "array":
            newValue = [];
            break;
          case "object":
            newValue = {};
            break;
          default:
            newValue = addItemName.trim();
        }

        const newArray = [...currentValue, newValue];
        updatedData = setNestedValue(data, addItemPath, newArray);
        finalPath = [...addItemPath, currentValue.length.toString()];
      } else {
        // Adding to an object or creating new structure
        // Use the user's input as the key name, and create value based on type
        const keyName = addItemName.trim();
        finalPath = [...addItemPath, keyName];

        switch (addItemType) {
          case "string":
            newValue = ""; // For object properties, start with empty string that user can edit
            break;
          case "array":
            newValue = [];
            break;
          case "object":
            newValue = {};
            break;
          default:
            newValue = "";
        }

        updatedData = setNestedValue(data, finalPath, newValue);
      }

      // Update data first, then track the change
      dispatch(setData(updatedData));
      dispatch(
        updateDataAndTrackChange({
          path: finalPath,
          newValue,
          changeType: "add",
        }),
      );

      setShowAddItemDialog(false);
      setAddItemName("");
      controlToastState("prescription-parsing-config-item-added");
    } catch (error) {
      controlToastState("prescription-parsing-config-item-add-error");
    }
  };

  // Handle adding key-value items (medicine types, route mappings, cmm unit mappings)
  const handleKeyValueAddSubmit = async () => {
    if (!keyName.trim() || !keyValue.trim() || !data) return;

    try {
      // Create new key-value pair where keyName is key and keyValue is value
      const finalKeyName = keyName.trim();
      const finalPath = [...keyValueAddPath, finalKeyName];
      const newValue = keyValue.trim();

      // Update data first, then track the change
      const updatedData = setNestedValue(data, finalPath, newValue);
      dispatch(setData(updatedData));
      dispatch(
        updateDataAndTrackChange({
          path: finalPath,
          newValue,
          changeType: "add",
        }),
      );

      setShowKeyValueAddDialog(false);
      setKeyName("");
      setKeyValue("");
      controlToastState("prescription-parsing-config-item-added");
    } catch (error) {
      controlToastState("prescription-parsing-config-item-add-error");
    }
  };

  // Handle deleting items
  const handleDeleteItem = (
    path: string[],
    itemIndex?: number,
    itemKey?: string,
  ) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${path.join(" > ")}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    try {
      // For main section, no path adjustment needed
      // For dosage and medicine sections, work with paths directly since data is already section-specific
      const adjustedPath = configSectionTab === "main" ? path : path;

      const currentValue = getNestedValue(data, adjustedPath);
      let updatedData;
      let deletedPath = adjustedPath;

      if (Array.isArray(currentValue) && typeof itemIndex === "number") {
        // Deleting from array
        const newArray = [...currentValue];
        const deletedValue = newArray[itemIndex];
        newArray.splice(itemIndex, 1);

        updatedData = setNestedValue(data, adjustedPath, newArray);
        deletedPath = [...adjustedPath, itemIndex.toString()];

        // Update data first, then track the change
        dispatch(setData(updatedData));
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

        updatedData = setNestedValue(data, adjustedPath, newObject);
        deletedPath = [...adjustedPath, itemKey];

        // Update data first, then track the change
        dispatch(setData(updatedData));
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
        updatedData = setNestedValue(data, adjustedPath, undefined);

        // Update data first, then track the change
        dispatch(setData(updatedData));
        dispatch(
          updateDataAndTrackChange({
            path: adjustedPath,
            newValue: undefined,
            changeType: "delete",
            oldValue,
          }),
        );
      }

      controlToastState("prescription-parsing-config-item-deleted");
    } catch (error) {
      controlToastState("prescription-parsing-config-item-delete-error");
    }
  };

  // Handle adding categories

  // Handle clearing changes
  const handleClearChanges = () => {
    if (!originalData) return;

    const confirmClear = window.confirm(
      "Are you sure you want to discard all changes? This action cannot be undone.",
    );
    if (confirmClear) {
      dispatch(setData(originalData));
      dispatch(clearChanges());
    }
  };

  // Get section-specific changes count
  const getSectionChangesCount = () => {
    return getSectionChanges().length;
  };

  if (isLoading && !data) {
    return (
      <LoaderMessage message="Loading Prescription Parsing Configuration..." />
    );
  }

  if (error) {
    return (
      <div className="prescription-parsing-configuration__error">
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

  const sectionData = getSectionData();
  const sectionChanges = getSectionChanges();
  const sectionOriginalData = getSectionOriginalData();

  return (
    <div className="prescription-parsing-configuration flex h-full flex-col">
      {/* Header with enhanced controls */}
      <div className="prescription-parsing-configuration__header flex-shrink-0 border-b border-primaryGray-16 bg-blue-50 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-h11 font-bold text-primaryGray-1">
              <svg
                className="h-6 w-6 text-green-600"
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
              Prescription Parsing Configuration
            </h2>
            <p className="mt-1 text-small font-medium text-primaryGray-8">
              Manage prescription parsing configurations with individual section
              versioning
            </p>
            {hasUnsavedChanges && activeTab === "configuration" && (
              <div className="mt-2 flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-tiny font-medium text-orange-600">
                <span className="text-orange-500">⚠️</span>
                You have unsaved changes in {configSectionTab} section. Click
                "Save as New Version" to persist them.
              </div>
            )}
          </div>

          {activeTab === "configuration" && (
            <div className="flex items-center gap-3">
              <PrescriptionParsingVersionDropdown
                versions={getCurrentVersions()}
                currentVersion={getCurrentVersion()}
                onVersionChange={handleVersionChange}
                isLoading={isVersionsLoading}
                hasUnsavedChanges={hasUnsavedChanges}
              />

              <Button
                buttonType="secondary"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>

              <Button
                buttonType="primary"
                size="small"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
              >
                {isSaving ? "Saving..." : "Save as New Version"}
              </Button>

              {hasUnsavedChanges && (
                <Button
                  buttonType="secondary"
                  size="small"
                  onClick={handleClearChanges}
                  disabled={isSaving}
                >
                  Discard Changes
                </Button>
              )}
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
              📄 Configuration
            </button>
            <button
              onClick={() => setActiveTab("test-deploy")}
              className={`px-4 py-2 text-small font-medium transition-colors ${
                activeTab === "test-deploy"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-primaryGray-8 hover:text-primaryGray-1"
              }`}
            >
              🔧 Test & Deploy
            </button>
          </div>
        </div>

        {/* Section Tabs - Only show for Configuration tab */}
        {activeTab === "configuration" && (
          <div className="mt-4">
            <div className="flex items-center border-b border-primaryGray-16">
              <div className="flex">
                <button
                  onClick={() => setConfigSectionTab("main")}
                  className={`px-4 py-2 text-small font-medium transition-colors ${
                    configSectionTab === "main"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-primaryGray-8 hover:text-primaryGray-1"
                  }`}
                >
                  Main Config
                  {getSectionChangesCount() > 0 &&
                    configSectionTab === "main" && (
                      <span className="ml-1 rounded-full bg-orange-500 px-2 py-1 text-tiny text-white">
                        {getSectionChangesCount()}
                      </span>
                    )}
                </button>
                <button
                  onClick={() => setConfigSectionTab("dosage")}
                  className={`px-4 py-2 text-small font-medium transition-colors ${
                    configSectionTab === "dosage"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-primaryGray-8 hover:text-primaryGray-1"
                  }`}
                >
                  Dosage Parsing
                  {getSectionChangesCount() > 0 &&
                    configSectionTab === "dosage" && (
                      <span className="ml-1 rounded-full bg-orange-500 px-2 py-1 text-tiny text-white">
                        {getSectionChangesCount()}
                      </span>
                    )}
                </button>
                <button
                  onClick={() => setConfigSectionTab("medicine")}
                  className={`px-4 py-2 text-small font-medium transition-colors ${
                    configSectionTab === "medicine"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-primaryGray-8 hover:text-primaryGray-1"
                  }`}
                >
                  Medicine Details
                  {getSectionChangesCount() > 0 &&
                    configSectionTab === "medicine" && (
                      <span className="ml-1 rounded-full bg-orange-500 px-2 py-1 text-tiny text-white">
                        {getSectionChangesCount()}
                      </span>
                    )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="prescription-parsing-configuration__content flex-1 overflow-y-auto">
        {activeTab === "configuration" ? (
          <div className="p-6">
            {sectionData ? (
              <div className="configuration-data">
                <PrescriptionParsingNestedViewer
                  data={sectionData}
                  onAddItem={handleAddItem}
                  onDeleteItem={handleDeleteItem}
                  changes={sectionChanges}
                  originalData={sectionOriginalData}
                  excludeFields={[
                    "id",
                    "created_at",
                    "created_by",
                    "description",
                  ]}
                  isLoading={isLoading || isSaving}
                  section={configSectionTab}
                />
              </div>
            ) : (
              <div className="no-data rounded-xl border border-primaryGray-16 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-8 w-8 text-blue-600"
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
                  No configuration data available for {configSectionTab} section
                </p>
                <p className="mt-1 text-tiny text-primaryGray-10">
                  Please check your connection and try refreshing
                </p>
              </div>
            )}
          </div>
        ) : (
          <PrescriptionParsingTestAndDeploy />
        )}
      </div>

      {/* Footer with enhanced stats - Only for Configuration tab */}
      {activeTab === "configuration" && (
        <div className="prescription-parsing-configuration__footer flex-shrink-0 border-t border-primaryGray-16 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-tiny text-primaryGray-8">
              <span>Current Version: {getCurrentVersion()}</span>
              <span>Section: {configSectionTab}</span>
              <span>Section Changes: {getSectionChangesCount()}</span>
              <span>
                Total Items: {sectionData ? Object.keys(sectionData).length : 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-tiny text-primaryGray-8">
                {getSectionChangesCount() > 0
                  ? "Unsaved Changes"
                  : "All Changes Saved"}
              </span>
              <div
                className={`h-2 w-2 rounded-full ${
                  getSectionChangesCount() > 0
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-h12 font-semibold text-primaryGray-1">
              Save {configSectionTab} Section as New Version
            </h3>
            <p className="mt-2 text-small text-primaryGray-8">
              This will create a new version for the {configSectionTab} section
              only, keeping other sections unchanged.
            </p>
            <div className="mt-4">
              <TextInput
                id="version-description"
                label="Version Description"
                placeholder="Version description..."
                onChange={(e) => setVersionDescription(e.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
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
                onClick={handleSaveDialogSubmit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddItemDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-h12 font-semibold text-primaryGray-1">
              Add New Item to {configSectionTab} Section
            </h3>
            <p className="mt-2 text-small text-primaryGray-8">
              Add a new item to:{" "}
              {addItemPath
                .filter(
                  (p) => p !== "dosage_parsing" && p !== "medicine_details",
                )
                .join(" > ")}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <TextInput
                  id="add-item-name"
                  label="Item Name"
                  placeholder="Enter item name..."
                  onChange={(e) => setAddItemName(e.value)}
                />
              </div>

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
            <div className="mt-6 flex justify-end gap-3">
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
                onClick={handleAddItemSubmit}
                disabled={!addItemName.trim()}
              >
                Add Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Key-Value Add Dialog */}
      {showKeyValueAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-h12 font-semibold text-primaryGray-1">
              {keyValueAddType === "medicine_types" &&
                `Add Medicine to ${keyValueAddPath[1]}`}
              {keyValueAddType === "route_mappings" && "Add Route Mapping"}
              {keyValueAddType === "cmm_unit_mappings" &&
                "Add CMM Unit Mapping"}
            </h3>
            <p className="mt-2 text-small text-primaryGray-8">
              Add a new mapping to:{" "}
              {keyValueAddPath
                .filter(
                  (p) => p !== "dosage_parsing" && p !== "medicine_details",
                )
                .join(" > ")}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <TextInput
                  id="key-name"
                  label={
                    keyValueAddType === "medicine_types"
                      ? "Drug Name"
                      : keyValueAddType === "route_mappings"
                        ? "Route"
                        : "Unit Key"
                  }
                  placeholder={
                    keyValueAddType === "medicine_types"
                      ? "Enter drug name..."
                      : keyValueAddType === "route_mappings"
                        ? "Enter route..."
                        : "Enter unit key..."
                  }
                  onChange={(e) => setKeyName(e.value)}
                />
              </div>

              <div>
                <TextInput
                  id="key-value"
                  label={
                    keyValueAddType === "medicine_types"
                      ? "Flow Type"
                      : keyValueAddType === "route_mappings"
                        ? "Route Value"
                        : "Unit Value"
                  }
                  placeholder={
                    keyValueAddType === "medicine_types"
                      ? "Enter flow type..."
                      : keyValueAddType === "route_mappings"
                        ? "Enter route value..."
                        : "Enter unit value..."
                  }
                  onChange={(e) => setKeyValue(e.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                buttonType="secondary"
                size="small"
                onClick={() => setShowKeyValueAddDialog(false)}
                disabled={false}
              >
                Cancel
              </Button>
              <Button
                buttonType="primary"
                size="small"
                onClick={handleKeyValueAddSubmit}
                disabled={!keyName.trim() || !keyValue.trim()}
              >
                {keyValueAddType === "medicine_types"
                  ? "Add Medicine"
                  : "Add Mapping"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionParsingConfiguration;
