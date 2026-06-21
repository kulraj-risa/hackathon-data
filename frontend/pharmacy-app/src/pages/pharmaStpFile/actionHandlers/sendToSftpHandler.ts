import { Dispatch } from "@reduxjs/toolkit";
import { ModalId } from "../../../enums/modalId";
import { setOpenedModalId } from "../../../redux/slice/modalSliceNew";

/**
 * Handler for Send to SFTP button click
 * Opens the PUSH_TO_SFTP_MODAL by dispatching to Redux store
 */
export const handleSendToSftpClick = (dispatch: Dispatch) => {
  dispatch(
    setOpenedModalId({
      id: ModalId.PUSH_TO_SFTP_MODAL,
      metaData: {
        // Add any metadata you want to pass to the modal
        timestamp: new Date().toISOString(),
      },
    }),
  );
};
