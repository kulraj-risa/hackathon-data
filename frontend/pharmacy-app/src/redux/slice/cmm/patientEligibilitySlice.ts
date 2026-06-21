import { createSlice } from "@reduxjs/toolkit";
import { PatientEligibilityDetails } from "../../../data-model/patientEligibilityDetails";

interface PatientEligibilityState {
  data: PatientEligibilityDetails[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: PatientEligibilityState = {
  data: null,
  loading: false,
  error: null,
};

const patientEligibilitySlice = createSlice({
  name: "patientEligibility",
  initialState,
  reducers: {
    setPatientEligibilityDetailsFromBq: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setPatientEligibilityDetailsFromBq } =
  patientEligibilitySlice.actions;

export default patientEligibilitySlice.reducer;
