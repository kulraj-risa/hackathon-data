import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ChangeTracker,
  PaFormConfigService,
  PaFormVersion,
} from "../../api/services/paFormConfigService";
import { AppDispatch } from "../store/store";

interface PaFormConfigState {
  data: any;
  versions: PaFormVersion[];
  currentVersion: string;
  isLoading: boolean;
  isVersionsLoading: boolean;
  error: string | null;
  changes: ChangeTracker[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  originalData: any; // To track what the data was before changes
}

const initialState: PaFormConfigState = {
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

export const paFormConfigSlice = createSlice({
  name: "paFormConfig",
  initialState,
  reducers: {
    resetPaFormConfig: (state) => {
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

    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    setVersions: (state, action: PayloadAction<PaFormVersion[]>) => {
      state.versions = action.payload;
      state.isVersionsLoading = false;
      state.error = null;
    },

    setCurrentVersion: (state, action: PayloadAction<string>) => {
      state.currentVersion = action.payload;
      state.changes = [];
      state.hasUnsavedChanges = false;
    },

    setOriginalData: (state, action: PayloadAction<any>) => {
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

      // Track the change
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
  resetPaFormConfig,
  setData,
  setVersions,
  setCurrentVersion,
  setOriginalData,
  addChange,
  clearChanges,
  setLoading,
  setVersionsLoading,
  setSaving,
  setError,
  updateDataAndTrackChange,
} = paFormConfigSlice.actions;

// Async thunks
export const fetchAllVersions = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setVersionsLoading(true));
    const versions = await PaFormConfigService.getAllVersions();
    dispatch(setVersions(versions));
  } catch (error) {
    dispatch(
      setError(
        error instanceof Error ? error.message : "Failed to fetch versions",
      ),
    );
  }
};

export const fetchPaFormConfiguration =
  (versionId: string = "v1") =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const data = await PaFormConfigService.getPaFormConfiguration(versionId);
      dispatch(setData(data));
      dispatch(setOriginalData(data));
      dispatch(setCurrentVersion(versionId));
      dispatch(clearChanges());
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch PA form configuration",
        ),
      );
    }
  };

export const switchVersion =
  (versionId: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const data = await PaFormConfigService.getPaFormConfiguration(versionId);
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

export const saveChangesAsNewVersion =
  (description?: string) => async (dispatch: AppDispatch, getState: any) => {
    try {
      dispatch(setSaving(true));
      const state = getState();
      const paFormState = state.paFormConfig;

      // Get user email from auth state
      const userEmail = state.firebaseAuthentication?.user?.email || "unknown";

      // Get the current version as parent version
      const parentVersion = paFormState.currentVersion;

      const newVersionId = await PaFormConfigService.createNewVersion(
        paFormState.data,
        description,
        userEmail,
        parentVersion,
      );

      // Fetch updated versions list
      const versions = await PaFormConfigService.getAllVersions();
      dispatch(setVersions(versions));

      // Switch to the new version
      dispatch(setCurrentVersion(newVersionId));
      dispatch(setOriginalData(paFormState.data));
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

export const paFormConfigurationSlice = paFormConfigSlice.reducer;
