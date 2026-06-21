import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../api/firebase/references";
import { AppDispatch } from "../store/store";

interface PbmConfigurationState {
  data: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: PbmConfigurationState = {
  data: null,
  isLoading: false,
  error: null,
};

export const pbmConfigurationSlice = createSlice({
  name: "pbmConfiguration",
  initialState,
  reducers: {
    resetPbmConfiguration: (state) => {
      state.data = null;
      state.isLoading = false;
      state.error = null;
    },

    setData: (state, action: PayloadAction<PbmConfigurationState>) => {
      state.data = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { resetPbmConfiguration, setData, setIsLoading, setError } =
  pbmConfigurationSlice.actions;

export const fetchPbmConfiguration = () => async (dispatch: AppDispatch) => {
  dispatch(setIsLoading(true));
  try {
    const pbmConfiguration =
      await FirestoreService.getDocument<PbmConfigurationState>(
        FirestoreDocumentReference.pbmConfigurations(),
      );
    dispatch(setData(pbmConfiguration));
  } catch (error) {
    dispatch(setError(error as string));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const pbmConfigurationsSlice = pbmConfigurationSlice.reducer;
