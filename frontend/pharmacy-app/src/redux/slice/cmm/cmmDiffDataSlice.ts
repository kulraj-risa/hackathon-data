import { createSlice } from "@reduxjs/toolkit";
import { FirebaseError } from "firebase/app";
import { orderBy, QueryConstraint } from "firebase/firestore";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { CmmDiffDataModel } from "../../../data-model/cmmDiffData";
import { logError } from "../../../utils/customLogger";
import { AppDispatch } from "../../store/store";

export interface CmmDiffDataState {
  baselineData?: CmmDiffDataModel;
  currentData?: CmmDiffDataModel;
  loading?: boolean;
  error?: string;
}

const initialState: CmmDiffDataState = {
  baselineData: undefined,
  currentData: undefined,
  loading: false,
  error: undefined,
};

const cmmDiffDataSlice = createSlice({
  name: "cmmDiffData",
  initialState,
  reducers: {
    setData: (
      state,
      action: {
        payload: { baseline?: CmmDiffDataModel; current?: CmmDiffDataModel };
      },
    ) => {
      state.baselineData = action.payload.baseline;
      state.currentData = action.payload.current;
      state.loading = false;
      state.error = undefined;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
      state.baselineData = undefined;
      state.currentData = undefined;
      state.error = undefined;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.baselineData = undefined;
      state.currentData = undefined;
    },
  },
});

export const { setData, setLoading, setError } = cmmDiffDataSlice.actions;

export const fetchCmmDiffDataForGivenOrder =
  (orderID: string) => async (dispatch: AppDispatch, getState) => {
    const { cmmDiffData } = getState();
    if (cmmDiffData.loading) return;

    const searchqueryConstraints: QueryConstraint[] = [
      orderBy("created_at", "desc"),
    ];

    dispatch(cmmDiffDataSlice.actions.setLoading(true));
    try {
      const allDocs =
        await FirestoreService.getDocumentsByQuery<CmmDiffDataModel>(
          FirestoreCollectionReference.cmmChangesTracking(orderID),
          searchqueryConstraints,
        );

      if (allDocs && allDocs.length > 1) {
        dispatch(
          cmmDiffDataSlice.actions.setData({
            baseline: allDocs[allDocs.length - 1],
            current: allDocs[0],
          }),
        );
        // const latestDoc = allDocs.reduce((latest, current) => {
        //   const latestTime = new Date(latest.created_at ?? "").getTime();
        //   const currentTime = new Date(current.created_at ?? "").getTime();
        //   return currentTime > latestTime ? current : latest;
        // });

        // console.log("latestDoc", latestDoc);
        // dispatch(
        //   cmmDiffDataSlice.actions.setData({
        //     baseline: allDocs[allDocs.length - 1],
        //     current: latestDoc,
        //   }),
        // );
      } else {
        dispatch(
          cmmDiffDataSlice.actions.setData({
            baseline: undefined,
            current: undefined,
          }),
        );
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;
      logError(firebaseError, "Error fetching ");
      dispatch(cmmDiffDataSlice.actions.setError(firebaseError.message));
    }
  };

export default cmmDiffDataSlice.reducer;
