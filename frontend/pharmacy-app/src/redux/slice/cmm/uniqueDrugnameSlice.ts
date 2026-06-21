import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { AppDispatch } from "../../store/store";

interface UniqueDrugnameState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: UniqueDrugnameState = {
  data: null,
  loading: false,
  error: null,
};

export const uniqueDrugnameSlice = createSlice({
  name: "uniqueDrugname",
  initialState,
  reducers: {
    setUniqueDrugname(state, action) {
      state.data = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setUniqueDrugname, setLoading, setError } =
  uniqueDrugnameSlice.actions;

export const fetchUniqueDrugname = () => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await FirestoreService.getDocument<UniqueDrugnameState>(
      FirestoreCollectionReference.uniqueDrugname(),
    );
    dispatch(setUniqueDrugname(response));
  } catch (error) {
    dispatch(setError(error as string));
  } finally {
    dispatch(setLoading(false));
  }
};

export default uniqueDrugnameSlice.reducer;
