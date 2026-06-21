import { createSlice } from "@reduxjs/toolkit";
import { limit } from "firebase/firestore";

import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { Features, Type } from "../../enums/screenNames";

export interface PlanDetails {
  feature: Features[];
  internal_organizations: any[];
  type: Type;
  planId: string;
}

interface FacilityPlan {
  data?: PlanDetails;
  loading: boolean;
  error: string | null;
}

const initialState: FacilityPlan = {
  data: undefined,
  loading: false,
  error: null,
};

const facilityPlanSlice = createSlice({
  name: "facilityPlan",
  initialState,
  reducers: {
    fetchingFacilityPlan: (state) => {
      state.loading = true;
      state.error = null;
      state.data = undefined;
    },
    setFacilityPlan: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    errorFetchingFacilityPlan: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetFacilityPlan: (state) => {
      state.data = undefined;
      state.loading = false;
      state.error = null;
    },
    retryFacilityPlan: (state) => {
      state.loading = true;
      state.error = null;
      // Keep existing data during retry
    },
  },
});

export const {
  fetchingFacilityPlan,
  setFacilityPlan,
  errorFetchingFacilityPlan,
  resetFacilityPlan,
  retryFacilityPlan,
} = facilityPlanSlice.actions;

export const fetchFacilityPlansFromFirebase =
  (facilityId: string) => async (dispatch) => {
    // Validate facilityId before proceeding
    if (!facilityId || facilityId.trim() === "") {
      dispatch(
        errorFetchingFacilityPlan(new Error("Invalid facility ID provided")),
      );
      return () => {}; // Return empty unsubscribe function
    }

    dispatch(fetchingFacilityPlan());
    const unsubscribe = FirestoreService.listenToQueryCollection<PlanDetails>(
      FirestoreCollectionReference.facilityPlan(facilityId),
      (docs) => {
        // Handle empty collection case
        if (docs && docs.length > 0) {
          dispatch(setFacilityPlan(docs[0]));
        } else {
          // If no documents found, set error state
          dispatch(
            errorFetchingFacilityPlan(new Error("No facility plan found")),
          );
        }
      },
      (error) => {
        dispatch(errorFetchingFacilityPlan(error));
      },
      limit(1),
    );
    return unsubscribe;
  };

export default facilityPlanSlice.reducer;
