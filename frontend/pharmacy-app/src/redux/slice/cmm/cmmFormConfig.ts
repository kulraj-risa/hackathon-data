import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { logError } from "../../../utils/customLogger";
import { AppDispatch } from "../../store/store";
import { CmmFormConfigModel } from "./../../../data-model/cmmFormConfigModel";

const PROXY_BASE =
  process.env.REACT_APP_PROXY_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3002"
    : "/api");

export interface CmmFormConfigSliceModel {
  data?: CmmFormConfigModel[];
  loading: boolean;
  error: string | null;
}

const initialState: CmmFormConfigSliceModel = {
  data: undefined,
  loading: false,
  error: null,
};

const cmmFormConfigSlice = createSlice({
  name: "cmmFormConfigSlice",
  initialState,
  reducers: {
    fetchCmmFormConfigStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCmmFormConfigSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchCmmFormConfigFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetCmmFormConfig(state) {
      state.data = undefined;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { resetCmmFormConfig } = cmmFormConfigSlice.actions;

async function fetchViaProxy(): Promise<any[]> {
  const resp = await fetch(
    `${PROXY_BASE}/firestore/auth_config/cmm_form_config/v1`,
  );
  const json = await resp.json();
  if (!json.success || !Array.isArray(json.documents)) {
    throw new Error(json.error || "Proxy returned no documents");
  }
  return json.documents;
}

async function fetchViaFirestore(): Promise<any[]> {
  return FirestoreService.getAllDocuments(
    FirestoreCollectionReference.cmmFormConfig(),
  );
}

export const fetchAllCmmFormConfiguration =
  () => async (dispatch: AppDispatch) => {
    dispatch(cmmFormConfigSlice.actions.fetchCmmFormConfigStart());
    try {
      let response: any[];
      try {
        response = await fetchViaProxy();
      } catch {
        response = await fetchViaFirestore();
      }
      if (!Array.isArray(response) || response.length === 0) {
        throw new Error("Form config came back empty");
      }
      dispatch(cmmFormConfigSlice.actions.fetchCmmFormConfigSuccess(response));
    } catch (error: any) {
      logError(error, "Error fetching form config");
      dispatch(
        cmmFormConfigSlice.actions.fetchCmmFormConfigFailure(error.message),
      );
    }
  };

export default cmmFormConfigSlice.reducer;
