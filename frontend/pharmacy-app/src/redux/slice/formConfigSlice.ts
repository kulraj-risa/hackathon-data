import { createSlice } from "@reduxjs/toolkit";
import { orderBy } from "firebase/firestore";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { FormConfigModel } from "../../data-model/formConfigModel";

interface FormConfigState {
  formConfigs: FormConfigModel[];
  loading: boolean;
  error: string | null;
  unsubscribe?: () => void;
}

const initialState: FormConfigState = {
  formConfigs: [],
  loading: false,
  error: null,
  unsubscribe: undefined,
};

const formConfigSlice = createSlice({
  name: "formConfig",
  initialState,
  reducers: {
    resetFormConfig(state) {
      state.formConfigs = [];
      state.loading = false;
      state.error = null;
      state.unsubscribe = undefined;
    },
    setFormConfigs(state, action) {
      state.formConfigs = action.payload;
      state.loading = false;
      state.error = null;
      state.unsubscribe = () => {};
    },
    setLoading(state, action) {
      state.loading = action.payload;
      state.unsubscribe = undefined;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
      state.unsubscribe = undefined;
    },
    setUnsubscribe(state, action) {
      state.unsubscribe = action.payload;
    },
  },
});

export const {
  setFormConfigs,
  setLoading,
  setError,
  resetFormConfig,
  setUnsubscribe,
} = formConfigSlice.actions;

export const fetchFormConfigfromFirebase = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const unsubscribe =
      FirestoreService.listenToQueryCollection<FormConfigModel>(
        FirestoreCollectionReference.medicalPaFormConfig(),
        (formConfigs) => {
          if (formConfigs) {
            dispatch(setFormConfigs(formConfigs));
          } else {
            dispatch(setError("No form configurations found"));
          }
          dispatch(setUnsubscribe(unsubscribe));
        },
        (error) => {
          dispatch(setError(error.message));
        },
        orderBy("created_at", "desc"),
      );

    return unsubscribe;
  } catch (error: unknown) {
    if (error instanceof Error) {
      dispatch(setError(error.message));
    }
  } finally {
    dispatch(setLoading(false));
  }
};

export default formConfigSlice.reducer;
