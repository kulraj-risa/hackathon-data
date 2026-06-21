import { createSlice } from "@reduxjs/toolkit";
import { orderBy, QueryConstraint } from "firebase/firestore";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { NYCBSMedicalPA } from "../../../data-model/nycbsMedicalPa";
import { logDataToConsole } from "../../../utils/customLogger";

export interface NYCBSClaimsPASlice {
  data: NYCBSMedicalPA[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: NYCBSClaimsPASlice = {
  data: null,
  loading: false,
  error: null,
};

const nycbsClaimsPaSlice = createSlice({
  name: "nycbsClaimsPa",
  initialState,
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const fetchNycbsClaimsPaOrdersFromFirebase =
  () => async (dispatch, getState) => {
    const { nycbsClaimsPa } = getState();
    if (nycbsClaimsPa.loading) return;

    dispatch(nycbsClaimsPaSlice.actions.setLoading(true));

    const queryConstraints: QueryConstraint[] = [orderBy("created_at", "desc")];

    const unsubscribe =
      FirestoreService.listenToQueryCollection<NYCBSMedicalPA>(
        FirestoreCollectionReference.nycbsClaimsPa(),
        (nycbsClaimsPa) => {
          logDataToConsole("nycbsClaimsPa", nycbsClaimsPa);
          dispatch(nycbsClaimsPaSlice.actions.setData(nycbsClaimsPa));
        },
        (error) => {
          dispatch(nycbsClaimsPaSlice.actions.setError(error.message));
        },
        ...queryConstraints,
      );

    return unsubscribe;
  };

export default nycbsClaimsPaSlice.reducer;
