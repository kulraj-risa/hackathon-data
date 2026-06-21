import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { where } from "firebase/firestore";
import { Provider } from "risa-data-model";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { AppDispatch, DataState } from "../store/store";

const initialState: DataState<Provider[]> = {
  data: null,
  loading: false,
  error: null,
};

const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    getProvidersStart(state) {
      state.loading = true;
      state.error = null;
    },
    getProvidersSuccess(state, action: PayloadAction<Provider[]>) {
      state.data = action.payload;
      state.loading = false;
    },
    getProvidersFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    resetProviders(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  getProvidersStart,
  getProvidersSuccess,
  getProvidersFailure,
  resetProviders,
} = providerSlice.actions;

export const getAllProviderDetailsForClinic =
  (clinicId: string) => async (dispatch: AppDispatch) => {
    dispatch(getProvidersStart());
    const unsubscribe = FirestoreService.listenToQueryCollection<Provider>(
      FirestoreCollectionReference.providers(),
      (providersData) => {
        dispatch(getProvidersSuccess(providersData));
      },
      (error) => {
        dispatch(getProvidersFailure(error.message));
      },
      where("FacilityId", "==", clinicId),
    );

    return unsubscribe;
  };

export default providerSlice.reducer;
