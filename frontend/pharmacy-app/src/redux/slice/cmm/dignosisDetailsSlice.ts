import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { getAllDiagnosisCodesForOrder } from "../../../api/bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import {
  DiagnosesDetailsModel,
  mapDiagnosesDetails,
} from "../../../data-model/dignosisDetailsModal";

interface DiagnosisDetailsSlice {
  data: DiagnosesDetailsModel[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: DiagnosisDetailsSlice = {
  data: null,
  loading: false,
  error: null,
};

const diagnosisDetailsSlice = createSlice({
  name: "diagnosisDetailsSlice",
  initialState,
  reducers: {
    fetchDiagnosisDetailsStart(state) {
      state.loading = true;
      state.error = null;
      state.data = null;
    },
    fetchDiagnosisDetailsSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchDiagnosisDetailsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetDiagnosisDetails(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export default diagnosisDetailsSlice.reducer;

const getIsLoading = (
  getState: () => { diagnosisDetails: DiagnosisDetailsSlice },
) => {
  return getState().diagnosisDetails.loading;
};

export const fetchAllDiagnosisDetailsForAnOrder =
  (id: string) => async (dispatch: Dispatch, getState: any) => {
    if (getIsLoading(getState)) {
      return;
    }
    dispatch(diagnosisDetailsSlice.actions.fetchDiagnosisDetailsStart());
    try {
      const isDemo = process.env.REACT_APP_FIREBASE_CONFIG === "demo";
      let detailsArray: any[] | null = null;

      if (!isDemo) {
        try {
          const response = await getAllDiagnosisCodesForOrder(id);
          if (response.details?.length > 0) {
            detailsArray = response.details;
          }
        } catch {
          // API failed — fall through to BQ
        }
      }

      if (!detailsArray || detailsArray.length === 0) {
        const row = await fetchBqRecordByIdentifier(id);
        if (
          row?.diagnosis?.diagnosis_codes &&
          Array.isArray(row.diagnosis.diagnosis_codes) &&
          row.diagnosis.diagnosis_codes.length > 0
        ) {
          detailsArray = row.diagnosis.diagnosis_codes;
        }
      }

      if (detailsArray && detailsArray.length > 0) {
        const diagnosisDetails = detailsArray.map((item) =>
          mapDiagnosesDetails(item),
        );
        dispatch(
          diagnosisDetailsSlice.actions.fetchDiagnosisDetailsSuccess(
            diagnosisDetails,
          ),
        );
      } else {
        dispatch(
          diagnosisDetailsSlice.actions.fetchDiagnosisDetailsSuccess(null),
        );
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
      dispatch(
        diagnosisDetailsSlice.actions.fetchDiagnosisDetailsFailure(
          errorMessage,
        ),
      );
    }
  };

export const resetDiagnosisDetailsOnUnmount = () => (dispatch: Dispatch) => {
  dispatch(diagnosisDetailsSlice.actions.resetDiagnosisDetails());
};
