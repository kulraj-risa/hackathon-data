import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../api/firebase/references";
import { CmmFormConfigModel } from "../../data-model/cmmFormConfigModel";
import { AppDispatch } from "../store/store";

export interface SingleMedicalPaFormConfigSliceModel {
  data?: CmmFormConfigModel;
  loading: boolean;
  error: string | null;
}

const initialState: SingleMedicalPaFormConfigSliceModel = {
  data: undefined,
  loading: false,
  error: null,
};

const singleMedicalPaFormConfigSlice = createSlice({
  name: "singleMedicalPaFormConfigSlice",
  initialState,
  reducers: {
    fetchSingleMedicalPaFormConfigStart(state) {
      state.loading = true;
      state.error = null;
      state.data = undefined;
    },
    fetchSingleMedicalPaFormConfigSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchSingleMedicalPaFormConfigFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  fetchSingleMedicalPaFormConfigStart,
  fetchSingleMedicalPaFormConfigSuccess,
  fetchSingleMedicalPaFormConfigFailure,
} = singleMedicalPaFormConfigSlice.actions;

export const fetchSingleMedicalPaFormConfig =
  (id: string) => async (dispatch: AppDispatch) => {
    dispatch(fetchSingleMedicalPaFormConfigStart());
    try {
      const response = await FirestoreService.getDocument(
        FirestoreDocumentReference.medicalPaFormConfig(id),
      );
      dispatch(fetchSingleMedicalPaFormConfigSuccess(response));
    } catch (error) {
      dispatch(fetchSingleMedicalPaFormConfigFailure(error as string));
    }
  };

export default singleMedicalPaFormConfigSlice.reducer;
