import { createSlice } from "@reduxjs/toolkit";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { FormOptionsModel } from "../../data-model/formOptions";
import { logError } from "../../utils/customLogger";
import { AppDispatch } from "../store/store";

const PROXY_BASE =
  process.env.REACT_APP_PROXY_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3002"
    : "/api");

interface FormOptionsModelSlice {
  data?: FormOptionsModel[];
  loading: boolean;
  error: string | null;
}

const initialState: FormOptionsModelSlice = {
  data: undefined,
  loading: false,
  error: null,
};

const formOptionsSlice = createSlice({
  name: "formOptionsSlice",
  initialState,
  reducers: {
    fetchFormOptionsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchFormOptionsSuccess(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchFormOptionsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    resetFormOptions(state) {
      state.data = undefined;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { resetFormOptions } = formOptionsSlice.actions;

async function fetchViaProxy(): Promise<any[]> {
  const resp = await fetch(
    `${PROXY_BASE}/firestore/auth_config/form_options/v1`,
  );
  const json = await resp.json();
  if (!json.success || !Array.isArray(json.documents)) {
    throw new Error(json.error || "Proxy returned no documents");
  }
  return json.documents;
}

async function fetchViaFirestore(): Promise<any[]> {
  return FirestoreService.getAllDocuments(
    FirestoreCollectionReference.formOptions(),
  );
}

export const fetchAllFormOptionsFromFirebase = () => {
  return async (dispatch: AppDispatch): Promise<void> => {
    dispatch(formOptionsSlice.actions.fetchFormOptionsStart());
    try {
      let formOptions: any[];
      try {
        formOptions = await fetchViaProxy();
      } catch {
        formOptions = await fetchViaFirestore();
      }
      if (!Array.isArray(formOptions) || formOptions.length === 0) {
        throw new Error("Form options came back empty");
      }
      dispatch(formOptionsSlice.actions.fetchFormOptionsSuccess(formOptions));
    } catch (error: any) {
      logError(error, "Error fetching form options");
      dispatch(
        formOptionsSlice.actions.fetchFormOptionsFailure(error.message),
      );
    }
  };
};

export default formOptionsSlice.reducer;
