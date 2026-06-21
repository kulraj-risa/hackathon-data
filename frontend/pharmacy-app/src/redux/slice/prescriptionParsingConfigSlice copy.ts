import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ChangeTracker,
  PrescriptionParsingConfigData,
  PrescriptionParsingConfigService,
  PrescriptionParsingVersion,
} from "../../api/services/prescriptionParsingConfigService";
import { AppDispatch } from "../store/store";

interface PrescriptionParsingConfigState {
  data: PrescriptionParsingConfigData | null;
  // Section-specific versions
  versions: {
    main: PrescriptionParsingVersion[];
    dosage: PrescriptionParsingVersion[];
    medicine: PrescriptionParsingVersion[];
  };
  // Section-specific current versions
  currentVersions: {
    main: string;
    dosage: string;
    medicine: string;
  };
  isLoading: boolean;
  isVersionsLoading: boolean;
  error: string | null;
  changes: ChangeTracker[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  originalData: PrescriptionParsingConfigData | null;
}

const initialState: PrescriptionParsingConfigState = {
  data: null,
  versions: {
    main: [],
    dosage: [],
    medicine: [],
  },
  currentVersions: {
    main: "latest",
    dosage: "latest",
    medicine: "latest",
  },
  isLoading: false,
  isVersionsLoading: false,
  error: null,
  changes: [],
  hasUnsavedChanges: false,
  isSaving: false,
  originalData: null,
};

export const prescriptionParsingConfigSlice = createSlice({
  name: "prescriptionParsingConfig",
  initialState,
  reducers: {
    resetPrescriptionParsingConfig: (state) => {
      state.data = null;
      state.versions = {
        main: [],
        dosage: [],
        medicine: [],
      };
      state.currentVersions = {
        main: "latest",
        dosage: "latest",
        medicine: "latest",
      };
      state.isLoading = false;
      state.isVersionsLoading = false;
      state.error = null;
      state.changes = [];
      state.hasUnsavedChanges = false;
      state.isSaving = false;
      state.originalData = null;
    },

    setData: (state, action: PayloadAction<PrescriptionParsingConfigData>) => {
      state.data = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    setVersionsForSection: (
      state,
      action: PayloadAction<{
        section: "main" | "dosage" | "medicine";
        versions: PrescriptionParsingVersion[];
      }>,
    ) => {
      state.versions[action.payload.section] = action.payload.versions;
      state.isVersionsLoading = false;
      state.error = null;
    },

    setCurrentVersionForSection: (
      state,
      action: PayloadAction<{
        section: "main" | "dosage" | "medicine";
        versionId: string;
      }>,
    ) => {
      state.currentVersions[action.payload.section] = action.payload.versionId;
      state.changes = [];
      state.hasUnsavedChanges = false;
    },

    setVersions: (
      state,
      action: PayloadAction<PrescriptionParsingVersion[]>,
    ) => {
      // For backwards compatibility
      state.versions.main = action.payload;
      state.isVersionsLoading = false;
      state.error = null;
    },

    setCurrentVersion: (state, action: PayloadAction<string>) => {
      // For backwards compatibility
      state.currentVersions.main = action.payload;
      state.changes = [];
      state.hasUnsavedChanges = false;
    },

    setOriginalData: (
      state,
      action: PayloadAction<PrescriptionParsingConfigData>,
    ) => {
      state.originalData = action.payload;
    },

    addChange: (state, action: PayloadAction<ChangeTracker>) => {
      state.changes.push(action.payload);
      state.hasUnsavedChanges = true;
    },

    clearChanges: (state) => {
      state.changes = [];
      state.hasUnsavedChanges = false;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setVersionsLoading: (state, action: PayloadAction<boolean>) => {
      state.isVersionsLoading = action.payload;
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isVersionsLoading = false;
      state.isSaving = false;
    },

    updateDataAndTrackChange: (
      state,
      action: PayloadAction<{
        path: string[];
        newValue: any;
        changeType: "add" | "delete" | "modify";
        oldValue?: any;
      }>,
    ) => {
      const { path, newValue, changeType, oldValue } = action.payload;

      // Track the change (DO NOT update data here - that's done separately with setData)
      const change: ChangeTracker = {
        type: changeType,
        path,
        newValue: changeType !== "delete" ? newValue : undefined,
        oldValue: changeType !== "add" ? oldValue : undefined,
        timestamp: new Date().toISOString(),
      };

      state.changes.push(change);
      state.hasUnsavedChanges = true;
    },
  },
});

export const {
  resetPrescriptionParsingConfig,
  setData,
  setVersions,
  setVersionsForSection,
  setCurrentVersion,
  setCurrentVersionForSection,
  setOriginalData,
  addChange,
  clearChanges,
  setLoading,
  setVersionsLoading,
  setSaving,
  setError,
  updateDataAndTrackChange,
} = prescriptionParsingConfigSlice.actions;

// Async thunks
export const fetchAllPrescriptionParsingVersionsForSection =
  (section: "main" | "dosage" | "medicine") =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setVersionsLoading(true));
      const versions =
        await PrescriptionParsingConfigService.getAllVersionsForSection(
          section,
        );
      dispatch(setVersionsForSection({ section, versions }));
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "Failed to fetch versions",
        ),
      );
    }
  };

export const fetchAllPrescriptionParsingVersions =
  () => async (dispatch: AppDispatch) => {
    try {
      dispatch(setVersionsLoading(true));
      const versions = await PrescriptionParsingConfigService.getAllVersions();
      dispatch(setVersions(versions));
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "Failed to fetch versions",
        ),
      );
    }
  };

export const fetchPrescriptionParsingConfigurationForSection =
  (
    versionId: string = "latest",
    section: "main" | "dosage" | "medicine" = "main",
  ) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const data =
        await PrescriptionParsingConfigService.getPrescriptionParsingConfigurationForSection(
          versionId,
          section,
        );
      dispatch(setData(data));
      dispatch(setOriginalData(data));
      dispatch(setCurrentVersionForSection({ section, versionId }));
      dispatch(clearChanges());
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch prescription parsing configuration",
        ),
      );
    }
  };

export const fetchPrescriptionParsingConfiguration =
  (versionId: string = "latest") =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const data =
        await PrescriptionParsingConfigService.getPrescriptionParsingConfiguration(
          versionId,
        );
      dispatch(setData(data));
      dispatch(setOriginalData(data));
      dispatch(setCurrentVersion(versionId));
      dispatch(clearChanges());
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch prescription parsing configuration",
        ),
      );
    }
  };

export const switchPrescriptionParsingVersionForSection =
  (versionId: string, section: "main" | "dosage" | "medicine") =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const data =
        await PrescriptionParsingConfigService.getPrescriptionParsingConfigurationForSection(
          versionId,
          section,
        );
      dispatch(setData(data));
      dispatch(setOriginalData(data));
      dispatch(setCurrentVersionForSection({ section, versionId }));
      dispatch(clearChanges());
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "Failed to switch version",
        ),
      );
    }
  };

export const switchPrescriptionParsingVersion =
  (versionId: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const data =
        await PrescriptionParsingConfigService.getPrescriptionParsingConfiguration(
          versionId,
        );
      dispatch(setData(data));
      dispatch(setOriginalData(data));
      dispatch(setCurrentVersion(versionId));
      dispatch(clearChanges());
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "Failed to switch version",
        ),
      );
    }
  };

export const savePrescriptionParsingChangesAsNewVersion =
  (options: {
    description?: string;
    section?: "main" | "dosage" | "medicine";
  }) =>
  async (dispatch: AppDispatch, getState: any) => {
    try {
      dispatch(setSaving(true));
      const state = getState();
      const prescriptionParsingState = state.prescriptionParsingConfig;

      // Get user email from auth state
      const userEmail = state.firebaseAuthentication?.user?.email || "unknown";

      // Get the current version as parent version
      const section = options.section || "main";
      const parentVersion =
        prescriptionParsingState.currentVersions[section] || "latest";

      // Get section-specific data to save
      let dataToSave = prescriptionParsingState.data || {};

      // Extract section-specific data to prevent cross-contamination
      if (section === "main") {
        // For main section, only include specific keys and exclude dosage_parsing and medicine_details
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
          if (dataToSave[key] !== undefined) {
            if (key === "metadata_configuration") {
              // For metadata_configuration, only include cmm_unit_mappings
              if (
                dataToSave[key] &&
                dataToSave[key].cmm_unit_mappings !== undefined
              ) {
                mainData[key] = {
                  cmm_unit_mappings: dataToSave[key].cmm_unit_mappings,
                };
              }
            } else if (key === "medicine_types") {
              // For medicine_types, show all objects but only the medicines key inside each object
              if (dataToSave[key] && typeof dataToSave[key] === "object") {
                mainData[key] = {};
                Object.keys(dataToSave[key]).forEach((medicineTypeKey) => {
                  const medicineTypeObject = dataToSave[key][medicineTypeKey];
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
              mainData[key] = dataToSave[key];
            }
          }
        });
        dataToSave = mainData;
      } else if (section === "dosage") {
        // For dosage section, only save the dosage_parsing data
        dataToSave = dataToSave.dosage_parsing || {};
      } else if (section === "medicine") {
        // For medicine section, only save the medicine_details data
        dataToSave = dataToSave.medicine_details || {};
      }

      const newVersionId =
        await PrescriptionParsingConfigService.createNewVersionForSection(
          dataToSave,
          options.description || "New version",
          section,
          userEmail,
          parentVersion,
        );

      // Fetch updated versions list for the specific section
      const versions =
        await PrescriptionParsingConfigService.getAllVersionsForSection(
          section,
        );
      dispatch(setVersionsForSection({ section, versions }));

      // Switch to the new version
      dispatch(
        setCurrentVersionForSection({ section, versionId: newVersionId }),
      );
      dispatch(setOriginalData(prescriptionParsingState.data));
      dispatch(clearChanges());

      dispatch(setSaving(false));
      return newVersionId;
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "Failed to save changes",
        ),
      );
      throw error;
    }
  };

export const fetchVersionsForSection =
  (section: "main" | "dosage" | "medicine" = "main") =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setVersionsLoading(true));
      const versions =
        await PrescriptionParsingConfigService.getAllVersionsForSection(
          section,
        );
      dispatch(setVersionsForSection({ section, versions }));

      // If there are versions, automatically switch to the first version
      if (versions.length > 0) {
        const firstVersion = versions[0];
        dispatch(
          fetchPrescriptionParsingConfigurationForSection(
            firstVersion.id,
            section,
          ),
        );
      } else {
        // If no versions, try to fetch the latest version
        dispatch(
          fetchPrescriptionParsingConfigurationForSection("latest", section),
        );
      }
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch versions for section",
        ),
      );
    }
  };

export const prescriptionParsingConfigurationSlice =
  prescriptionParsingConfigSlice.reducer;
