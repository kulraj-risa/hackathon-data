import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { InsuranceDetailsModel } from "../../../data-model/insuranceDetails";

interface InsuranceDetailsSlice {
  data: InsuranceDetailsModel[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: InsuranceDetailsSlice = {
  data: null,
  loading: false,
  error: null,
};

const insuranceDetailsSlice = createSlice({
  name: "insuranceDetails",
  initialState,
  reducers: {
    setInsuranceDetails: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    resetInsuranceDetails(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export default insuranceDetailsSlice.reducer;

export const { setInsuranceDetails } = insuranceDetailsSlice.actions;

export const resetInsuranceDetails = () => (dispatch: Dispatch) => {
  dispatch(insuranceDetailsSlice.actions.resetInsuranceDetails());
};
