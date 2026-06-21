import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { getPrescriptionData } from "../../../api/bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import {
  mapJsonToPrescription,
  Prescription,
} from "../../../data-model/prescriptionDataModal";
import { logDataToConsole } from "../../../utils/customLogger";

interface PrescriptionDataSlice {
  data: Prescription | null;
  loading: boolean;
  error: string | null;
}

const initialState: PrescriptionDataSlice = {
  data: null,
  loading: false,
  error: null,
};

const prescriptionSlice = createSlice({
  name: "prescriptionSlice",
  initialState,
  reducers: {
    fetchPrescriptionDataStart(state) {
      state.loading = true;
      state.error = null;
      state.data = null;
    },
    fetchPrescriptionDataSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchPrescriptionDataFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetPrescriptionData(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

const {
  fetchPrescriptionDataStart,
  fetchPrescriptionDataSuccess,
  fetchPrescriptionDataFailure,
  resetPrescriptionData,
} = prescriptionSlice.actions;

export default prescriptionSlice.reducer;

const getIsLoading = (
  getState: () => { prescription: PrescriptionDataSlice },
) => {
  return getState().prescription.loading;
};

export const fetchPrescriptionData =
  (id: string) => async (dispatch: Dispatch, getState: any) => {
    if (getIsLoading(getState)) {
      return;
    }
    dispatch(fetchPrescriptionDataStart());
    try {
      const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";
      let details: any = null;

      if (!isDemo) {
        try {
          const response = await getPrescriptionData(id);
          details = response.details;
        } catch {
          // API failed — fall through to BQ
        }
      }

      if (!details) {
        const row = await fetchBqRecordByIdentifier(id);
        if (row?.prescription) {
          details = row.prescription;
        }
      }

      if (details) {
        const prescriptionData = mapJsonToPrescription(details);
        logDataToConsole("prescriptionData", prescriptionData);
        dispatch(fetchPrescriptionDataSuccess(prescriptionData));
      } else {
        dispatch(fetchPrescriptionDataSuccess(null));
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }
      dispatch(fetchPrescriptionDataFailure(errorMessage));
    }
  };

export const resetPrescriptionDataOnUnmount = () => (dispatch: Dispatch) => {
  dispatch(resetPrescriptionData());
};
