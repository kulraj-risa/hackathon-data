import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../api/firebase/references";
import { AppDispatch } from "../store/store";

interface ParsedInsuranceState {
  parsedInsuranceData: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: ParsedInsuranceState = {
  parsedInsuranceData: {},
  isLoading: false,
  error: null,
};

export const parsedInsuranceSlice = createSlice({
  name: "parsedInsurance",
  initialState,
  reducers: {
    resetParsedInsurance: (state) => {
      state.parsedInsuranceData = {};
      state.isLoading = false;
      state.error = null;
    },
    setParsedInsuranceData: (state, action) => {
      state.parsedInsuranceData = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setParsedInsuranceData,
  setIsLoading,
  setError,
  resetParsedInsurance,
} = parsedInsuranceSlice.actions;

export const fetchParsedInsurance = () => async (dispatch: AppDispatch) => {
  dispatch(setIsLoading(true));
  try {
    const response = await FirestoreService.getDocument<ParsedInsuranceState>(
      FirestoreDocumentReference.parsedInsurance(),
    );
    dispatch(setParsedInsuranceData(response));
  } catch (error) {
    dispatch(setError(error as string));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export default parsedInsuranceSlice.reducer;
