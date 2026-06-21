import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../../api/firebase/references";
import { SentToPlanModel } from "../../../data-model/sentToPlan";
import { AppDispatch } from "../../store/store";

interface SentToPlanSliceModel {
  data?: SentToPlanModel;
  isLoading: boolean;
  error: string | null;
}

const initialState: SentToPlanSliceModel = {
  data: undefined,
  isLoading: false,
  error: null,
};

const nycbsSentToPlanSlice = createSlice({
  name: "nycbsSentToPlan",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<SentToPlanModel>) => {
      state.data = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setData, setIsLoading, setError } = nycbsSentToPlanSlice.actions;

export const getSendToPlanConfig =
  (organization: string) => async (dispatch: AppDispatch, getState) => {
    const { nycbsSentToPlanConfig } = getState();
    if (nycbsSentToPlanConfig.isLoading) return;
    dispatch(setIsLoading(true));
    try {
      const data = await FirestoreService.getDocument<SentToPlanModel>(
        FirestoreDocumentReference.sendToPlanConfig(organization),
      );
      dispatch(setData(data));
    } catch (error) {
      dispatch(setError(error as string));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

export default nycbsSentToPlanSlice.reducer;
