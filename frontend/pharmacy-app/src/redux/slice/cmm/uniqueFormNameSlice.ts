import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../../api/firebase/references";
import { AppDispatch } from "../../store/store";

interface UniqueFormNameState {
  uniqueFormNames: any;
  loading: boolean;
  error: string | null;
}

const initialState: UniqueFormNameState = {
  uniqueFormNames: null,
  loading: false,
  error: null,
};

export const uniqueFormNameSlice = createSlice({
  name: "uniqueFormName",
  initialState,
  reducers: {
    resetUniqueFormName(state) {
      state.uniqueFormNames = null;
      state.loading = false;
      state.error = null;
    },
    setUniqueFormName(state, action) {
      state.uniqueFormNames = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { resetUniqueFormName, setUniqueFormName, setLoading, setError } =
  uniqueFormNameSlice.actions;

export const fetchUniqueFormName = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await FirestoreService.getDocument<UniqueFormNameState>(
      FirestoreDocumentReference.uniqueFormName(),
    );
    dispatch(setUniqueFormName(response));
  } catch (error) {
    dispatch(setError(error as string));
  } finally {
    dispatch(setLoading(false));
  }
};

export default uniqueFormNameSlice.reducer;
