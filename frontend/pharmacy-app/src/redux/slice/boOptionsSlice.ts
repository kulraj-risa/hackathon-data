import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../api/firebase/references";
import {
  BOOptionModel,
  BOOptionModelResponse,
} from "../../data-model/boOptionModel";

export interface BOOptionState {
  data: BOOptionModel[];
  loading: boolean;
  error: string | null;
}

export const initialState: BOOptionState = {
  data: [],
  loading: false,
  error: null,
};

const boOptionsSlice = createSlice({
  name: "boOptions",
  initialState,
  reducers: {
    setBOOptions: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchingBOOptions: (state) => {
      state.loading = true;
      state.error = null;
      state.data = [];
    },
    setBOOptionsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.data = [];
    },
  },
});

export const { setBOOptions, fetchingBOOptions, setBOOptionsError } =
  boOptionsSlice.actions;

export const fetchBOOptions = (orgId: string) => async (dispatch, getState) => {
  const { boOptions } = getState();
  if (boOptions.loading) {
    return;
  }

  dispatch(fetchingBOOptions());
  try {
    const response = await FirestoreService.getDocument<BOOptionModelResponse>(
      FirestoreDocumentReference.boOptions(orgId),
    );

    dispatch(setBOOptions(response.data));
  } catch (error) {
    dispatch(setBOOptionsError(error as string));
  }
};

export default boOptionsSlice.reducer;
