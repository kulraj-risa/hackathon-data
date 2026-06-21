import { createSlice } from "@reduxjs/toolkit";
import { orderBy } from "firebase/firestore";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { FormConfigModel } from "../../data-model/formConfigModel";

interface FormConfigState {
  formConfigs: FormConfigModel[];
  loading: boolean;
  error: string | null;
}

const initialState: FormConfigState = {
  formConfigs: [],
  loading: false,
  error: null,
};

const formConfigNoLiveListenSlice = createSlice({
  name: "formConfigNoLiveListen",
  initialState,
  reducers: {
    resetFormConfig(state) {
      state.formConfigs = [];
      state.loading = false;
      state.error = null;
    },
    setFormConfigs(state, action) {
      state.formConfigs = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setFormConfigs, setLoading, setError, resetFormConfig } =
  formConfigNoLiveListenSlice.actions;

export const fetchFormConfigfromFirebaseWithoutLiveListen =
  () => async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const formConfigs =
        await FirestoreService.getDocumentsByQuery<FormConfigModel>(
          FirestoreCollectionReference.medicalPaFormConfig(),
          [orderBy("created_at", "desc")],
        );

      if (formConfigs) {
        dispatch(setFormConfigs(formConfigs));
      } else {
        dispatch(setError("No form configurations found"));
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        dispatch(setError(error.message));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

export default formConfigNoLiveListenSlice.reducer;
