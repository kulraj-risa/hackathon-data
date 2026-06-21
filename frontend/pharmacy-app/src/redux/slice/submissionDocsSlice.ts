import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FirebaseError } from "firebase/app";
import { FirestoreService } from "../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../api/firebase/references";
import { SubmissionDocs } from "../../data-model/submissionDocs";
import { AppDispatch, DataState } from "../store/store";

const initialState: DataState<SubmissionDocs> = {
  loading: false,
  error: null,
  data: null,
};

const submissionDocsSlice = createSlice({
  name: "submissionDocsSlice",
  initialState,
  reducers: {
    fetchingSubmissionDocs(state) {
      state.loading = true;
      state.error = null;
    },
    fetchingSubmissionDocsSuccess(state, action: PayloadAction<any[]>) {
      state.data = mapAllDocumentsToSubmissionDocs(
        action.payload,
      ) as SubmissionDocs;
      state.loading = false;
      state.error = null;
    },
    fetchingSubmissionDocsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    resetSubmissionDocs(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

const mapAllDocumentsToSubmissionDocs = (docs: any[]) => {
  return docs.reduce((acc, doc) => {
    const docId = doc.id;
    acc[docId] = doc;
    return acc;
  }, {} as SubmissionDocs);
};

export const fetchSubmissionDocsForOrder =
  (orderId: string) => async (dispatch: AppDispatch) => {
    dispatch(submissionDocsSlice.actions.fetchingSubmissionDocs());
    const unsubscribe = FirestoreService.listenToAllDocuments(
      FirestoreCollectionReference.submissionDocs(orderId),
      (docs) => {
        if (docs.length === 0) {
          dispatch(
            submissionDocsSlice.actions.fetchingSubmissionDocsFailure(
              "No submission docs found",
            ),
          );
          return;
        }
        dispatch(
          submissionDocsSlice.actions.fetchingSubmissionDocsSuccess(docs),
        );
      },
      (error: FirebaseError) => {
        dispatch(
          submissionDocsSlice.actions.fetchingSubmissionDocsFailure(
            error.message,
          ),
        );
      },
    );
  };

export const resetSubmissionDocs = () => {
  return submissionDocsSlice.actions.resetSubmissionDocs();
};

export default submissionDocsSlice.reducer;
