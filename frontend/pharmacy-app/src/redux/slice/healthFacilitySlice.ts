import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { HealthCareFacilityModel } from "../../data-model/healthFacility";

export interface HealthFacilitySliceModel {
  data: HealthCareFacilityModel[];
  loading: boolean;
  error: string | null;
}

const initialState: HealthFacilitySliceModel = {
  data: [],
  loading: false,
  error: null,
};

const healthFacilitySlice = createSlice({
  name: "healthFacility",
  initialState,
  reducers: {
    fetchingHealthFacility: (state) => {
      state.loading = true;
      state.error = null;
      state.data = [];
    },
    setHealthFacility: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    errorFetchingHealthFacility: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetHealthFacility: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchingHealthFacility,
  setHealthFacility,
  errorFetchingHealthFacility,
  resetHealthFacility,
} = healthFacilitySlice.actions;

export const fetchHealthFacilityFromFirebase = () => async (dispatch) => {
  dispatch(fetchingHealthFacility());
  try {
    const docs =
      await FirestoreService.getAllDocuments<HealthCareFacilityModel>(
        FirestoreCollectionReference.healthcareFacility(),
      );

    dispatch(setHealthFacility(docs));
  } catch (error) {
    dispatch(errorFetchingHealthFacility(error as Error));
  }
};

export default healthFacilitySlice.reducer;
