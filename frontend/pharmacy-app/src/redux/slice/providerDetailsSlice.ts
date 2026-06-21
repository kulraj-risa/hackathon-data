import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Provider } from "risa-data-model";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { AppDispatch, DataState } from "../store/store";

const initialState: DataState<Provider> = {
  data: null,
  loading: false,
  error: null,
};

const providerDetailsSlice = createSlice({
  name: "providerDetails",
  initialState,
  reducers: {
    getProviderDetailsStart(state) {
      state.loading = true;
      state.error = null;
      state.data = null;
    },
    getProviderDetailsSuccess(state, action: PayloadAction<Provider>) {
      state.data = action.payload;
      state.loading = false;
    },
    getProviderDetailsFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    resetProviderDetails(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  getProviderDetailsStart,
  getProviderDetailsSuccess,
  getProviderDetailsFailure,
  resetProviderDetails,
} = providerDetailsSlice.actions;

export const getProviderDetailsFor =
  (id: string) => async (dispatch: AppDispatch, getState) => {
    const { providerDetails } = getState();
    if (providerDetails.loading) {
      return;
    }
    dispatch(getProviderDetailsStart());
    const unsubscribe = FirestoreService.listenToDocument<Provider>(
      FirestoreCollectionReference.providers(),
      id,
      (providerData) => {
        if (providerData) {
          dispatch(getProviderDetailsSuccess(providerData));
        }
      },
      (error) => {
        dispatch(getProviderDetailsFailure(error.message));
      },
    );

    return unsubscribe;
  };

export default providerDetailsSlice.reducer;
