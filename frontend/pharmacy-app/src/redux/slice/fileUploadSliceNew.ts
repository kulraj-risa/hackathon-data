import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
  UploadTask,
} from "firebase/storage";
import { rapidsApp } from "../../api/firebase/rapidsFirestore";

interface FileUploadState {
  progress: number;
  downloadURL: string | null;
  error: string | null;
  uploadTask?: UploadTask;
}

const initialState: FileUploadState = {
  progress: 0,
  downloadURL: null,
  error: null,
  uploadTask: undefined,
};

const fileUploadSlice = createSlice({
  name: "fileUpload",
  initialState,
  reducers: {
    startUploadTask(state, action: PayloadAction<UploadTask>) {
      state.uploadTask = action.payload;
      state.progress = 0;
      state.error = null;
      state.downloadURL = null;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
      state.error = null;
      state.downloadURL = null;
    },
    setDownloadURL(state, action: PayloadAction<string>) {
      state.downloadURL = action.payload;
      state.progress = 100;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.progress = 0;
      state.downloadURL = null;
    },
    cancelUploadTask(state) {
      if (state.uploadTask) {
        state.uploadTask.cancel();
        state.uploadTask = undefined;
        state.progress = 0;
        state.downloadURL = null;
        state.error = null;
      }
    },
    resetUploadState(state) {
      state.progress = 0;
      state.downloadURL = null;
      state.error = null;
      state.uploadTask = undefined;
    },
  },
});

export const {
  setProgress,
  setDownloadURL,
  setError,
  cancelUploadTask,
  startUploadTask,
  resetUploadState,
} = fileUploadSlice.actions;

export const uploadFileToFirebaseStorage =
  (file: File, filePath: string) => async (dispatch) => {
    const storage = getStorage(rapidsApp);
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
    dispatch(startUploadTask(uploadTask));

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

        dispatch(setProgress(progress));
      },
      (error) => {
        dispatch(setError(error.message));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        dispatch(setDownloadURL(downloadURL));
      },
    );
  };

export const resetFileUploadState = () => (dispatch) => {
  dispatch(resetUploadState());
};

export default fileUploadSlice.reducer;
