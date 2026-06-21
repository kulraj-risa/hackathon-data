import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { ClientConfigModel } from "../../data-model/clientConfig";

export interface ClientConfigurationSliceModel {
  data: ClientConfigModel[];
  loading: boolean;
  error: string | null;
}

const initialState: ClientConfigurationSliceModel = {
  data: [],
  loading: false,
  error: null,
};

const clientConfigurationSlice = createSlice({
  name: "clientConfiguration",
  initialState,
  reducers: {
    fetchingClient: (state) => {
      state.loading = true;
      state.error = null;
      state.data = [];
    },
    setClient: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    errorFetchingClient: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetClient: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const { fetchingClient, setClient, errorFetchingClient, resetClient } =
  clientConfigurationSlice.actions;

export const fetchClientFromFirebase = () => async (dispatch) => {
  dispatch(fetchingClient());
  try {
    const docs = await FirestoreService.getAllDocuments<ClientConfigModel>(
      FirestoreCollectionReference.client(),
    );

    dispatch(setClient(docs));
  } catch (error) {
    dispatch(errorFetchingClient(error as Error));
  }
};

export default clientConfigurationSlice.reducer;
