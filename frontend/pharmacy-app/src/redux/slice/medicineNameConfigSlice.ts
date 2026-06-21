import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ChangeTracker,
  MedicineNameConfigService,
  MedicineNameVersion,
} from "../../api/services/medicineNameConfigService";
import { AppDispatch } from "../store/store";

interface MedicineNameConfigState {
  data: any;
  versions: MedicineNameVersion[];
  currentVersion: string;
  isLoading: boolean;
  isVersionsLoading: boolean;
  error: string | null;
  changes: ChangeTracker[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  originalData: any; // To track what the data was before changes
}

const initialState: MedicineNameConfigState = {
  data: null,
  versions: [],
  currentVersion: "v1",
  isLoading: false,
  isVersionsLoading: false,
  error: null,
  changes: [],
  hasUnsavedChanges: false,
  isSaving: false,
  originalData: null,
};

export const medicineNameConfigSlice = createSlice({
  name: "medicineNameConfig",
  initialState,
  reducers: {
    resetMedicineNameConfig: (state) => {
      state.data = null;
      state.versions = [];
      state.currentVersion = "v1";
      state.isLoading = false;
      state.isVersionsLoading = false;
      state.error = null;
      state.changes = [];
      state.hasUnsavedChanges = false;
      state.isSaving = false;
      state.originalData = null;
    },
    setMedicineNameData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.originalData = JSON.parse(JSON.stringify(action.payload)); // Deep copy
      state.isLoading = false;
      state.error = null;
    },
    setMedicineNameVersions: (
      state,
      action: PayloadAction<MedicineNameVersion[]>,
    ) => {
      state.versions = action.payload;
      state.isVersionsLoading = false;
      state.error = null;
    },
    setMedicineNameCurrentVersion: (state, action: PayloadAction<string>) => {
      state.currentVersion = action.payload;
    },
    setMedicineNameLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setMedicineNameVersionsLoading: (state, action: PayloadAction<boolean>) => {
      state.isVersionsLoading = action.payload;
    },
    setMedicineNameError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isVersionsLoading = false;
    },
    setMedicineNameSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    updateMedicineNameDataAndTrackChange: (
      state,
      action: PayloadAction<{
        data: any;
        change: ChangeTracker;
      }>,
    ) => {
      const { data, change } = action.payload;
      state.data = data;

      // Add or update the change in the changes array
      const existingChangeIndex = state.changes.findIndex(
        (c) => c.path.join(".") === change.path.join("."),
      );

      if (existingChangeIndex !== -1) {
        // Update existing change
        state.changes[existingChangeIndex] = change;
      } else {
        // Add new change
        state.changes.push(change);
      }

      state.hasUnsavedChanges = state.changes.length > 0;
    },
    clearMedicineNameChanges: (state) => {
      state.changes = [];
      state.hasUnsavedChanges = false;
    },
  },
});

export const {
  resetMedicineNameConfig,
  setMedicineNameData,
  setMedicineNameVersions,
  setMedicineNameCurrentVersion,
  setMedicineNameLoading,
  setMedicineNameVersionsLoading,
  setMedicineNameError,
  setMedicineNameSaving,
  updateMedicineNameDataAndTrackChange,
  clearMedicineNameChanges,
} = medicineNameConfigSlice.actions;

// Async thunks
export const fetchAllMedicineNameVersions =
  () => async (dispatch: AppDispatch) => {
    try {
      dispatch(setMedicineNameVersionsLoading(true));
      const versions = await MedicineNameConfigService.getAllVersions();
      dispatch(setMedicineNameVersions(versions));
    } catch (error) {
      dispatch(
        setMedicineNameError(
          "Failed to fetch medicine name configuration versions",
        ),
      );
    }
  };

export const fetchMedicineNameConfiguration =
  (versionId: string = "v1") =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setMedicineNameLoading(true));
      const data = await MedicineNameConfigService.getVersion(versionId);
      dispatch(setMedicineNameData(data));
      dispatch(setMedicineNameCurrentVersion(versionId));
    } catch (error) {
      dispatch(
        setMedicineNameError("Failed to fetch medicine name configuration"),
      );
    }
  };

export const switchMedicineNameVersion =
  (versionId: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setMedicineNameLoading(true));
      dispatch(clearMedicineNameChanges());

      const data = await MedicineNameConfigService.getVersion(versionId);
      dispatch(setMedicineNameData(data));
      dispatch(setMedicineNameCurrentVersion(versionId));
    } catch (error) {
      dispatch(
        setMedicineNameError(
          "Failed to switch medicine name configuration version",
        ),
      );
    }
  };

export const saveMedicineNameChangesAsNewVersion =
  (description?: string) => async (dispatch: AppDispatch, getState: any) => {
    try {
      dispatch(setMedicineNameSaving(true));

      const state = getState();
      const { data, currentVersion } = state.medicineNameConfig;

      // Get user email from auth state
      const userEmail = state.firebaseAuthentication?.user?.email || "unknown";

      // Get the current version as parent version
      const parentVersion = currentVersion;

      if (!data) {
        throw new Error("No data to save");
      }

      const newVersionId = await MedicineNameConfigService.createNewVersion(
        data,
        description,
        userEmail,
        parentVersion,
      );

      // Refresh versions and set current version
      await dispatch(fetchAllMedicineNameVersions());
      dispatch(setMedicineNameCurrentVersion(newVersionId));
      dispatch(clearMedicineNameChanges());

      return newVersionId;
    } catch (error) {
      dispatch(
        setMedicineNameError("Failed to save medicine name configuration"),
      );
      throw error;
    } finally {
      dispatch(setMedicineNameSaving(false));
    }
  };

export default medicineNameConfigSlice.reducer;
