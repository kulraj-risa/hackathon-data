import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ModalState {
  openedModalId: string | null;
  metaData?: Record<string, any>;
}

const initialState: ModalState = {
  openedModalId: null,
  metaData: undefined,
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    setOpenedModalId: (
      state,
      action: PayloadAction<{
        id: string;
        metaData?: Record<string, any>;
      }>,
    ) => {
      state.openedModalId = action.payload.id;
      state.metaData = action.payload.metaData;
    },
    closeModal: (state) => {
      state.openedModalId = null;
      state.metaData = undefined;
    },

    setMetaData: (state, action: PayloadAction<Record<string, any>>) => {
      state.metaData = {
        ...state.metaData,
        ...action.payload,
      };
    },
  },
});

export const { setOpenedModalId, closeModal, setMetaData } = modalSlice.actions;
export default modalSlice.reducer;
