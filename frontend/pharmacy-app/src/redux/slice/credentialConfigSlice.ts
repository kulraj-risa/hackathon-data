import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { AppDispatch } from "../store/store";

interface CredentialConfigState {
  credentials: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: CredentialConfigState = {
  credentials: null,
  isLoading: false,
  error: null,
};

export const credentialConfigSlice = createSlice({
  name: "credentialConfig",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<any>) => {
      state.credentials = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, setIsLoading, setError } =
  credentialConfigSlice.actions;

export const fetchCredentialConfig = () => async (dispatch: AppDispatch) => {
  dispatch(setIsLoading(true));
  try {
    const response =
      await FirestoreService.getAllDocuments<CredentialConfigState>(
        FirestoreCollectionReference.portalCredentials(),
      );
    dispatch(setCredentials(response));
  } catch (error) {
    dispatch(setError(error as string));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const credentialsConfigSlice = credentialConfigSlice.reducer;
