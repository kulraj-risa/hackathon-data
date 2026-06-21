import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../api/firebase/references";
import { DrugConfigResponse } from "../../data-model/drugConfigModel";
import { logError } from "../../utils/customLogger";

interface DrugConfigState {
  data: DrugConfigResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: DrugConfigState = {
  data: null,
  loading: false,
  error: null,
};

export const drugConfigSlice = createSlice({
  name: "drugConfig",
  initialState,
  reducers: {
    resetDrugConfig: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },

    setDrugConfig: (state, action) => {
      state.data = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { resetDrugConfig, setDrugConfig, setLoading, setError } =
  drugConfigSlice.actions;

export const fetchDrugConfigfromFirebase =
  (organization: string) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const result = await FirestoreService.getDocument<DrugConfigResponse>(
        FirestoreDocumentReference.drugsConfigurationPath(organization),
      );
      dispatch(setDrugConfig(result));
    } catch (error) {
      logError(error as Error, "Error fetching drug config");
      dispatch(setError(error as string));
    } finally {
      dispatch(setLoading(false));
    }
  };

export default drugConfigSlice.reducer;
