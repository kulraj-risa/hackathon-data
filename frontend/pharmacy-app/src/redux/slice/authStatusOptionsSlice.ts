import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../api/firebase/references";
import {
  AuthStatusOptionModel,
  AuthStatusOptionModelResponse,
} from "../../data-model/authStatusOptions";

//for commit

export interface AuthStatusOptionsState {
  data: AuthStatusOptionModel[];
  loading: boolean;
  error: string | null;
}

export const initialState: AuthStatusOptionsState = {
  data: [],
  loading: false,
  error: null,
};

const authStatusOptionsSlice = createSlice({
  name: "authStatusOptions",
  initialState,
  reducers: {
    setAuthStatusOptions: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchingAuthStatusOptions: (state) => {
      state.loading = true;
      state.error = null;
      state.data = [];
    },
    setAuthStatusOptionsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.data = [];
    },
  },
});

export const {
  setAuthStatusOptions,
  fetchingAuthStatusOptions,
  setAuthStatusOptionsError,
} = authStatusOptionsSlice.actions;

export const fetchauthStatusOptions =
  (orgId: string) => async (dispatch, getState) => {
    const { authStatusOptions } = getState();
    if (authStatusOptions.loading) {
      return;
    }

    dispatch(fetchingAuthStatusOptions());
    try {
      const response =
        await FirestoreService.getDocument<AuthStatusOptionModelResponse>(
          FirestoreDocumentReference.authStatusOptions(orgId),
        );

      dispatch(setAuthStatusOptions(response.data));
    } catch (error) {
      dispatch(setAuthStatusOptionsError(error as string));
    }
  };

export default authStatusOptionsSlice.reducer;
