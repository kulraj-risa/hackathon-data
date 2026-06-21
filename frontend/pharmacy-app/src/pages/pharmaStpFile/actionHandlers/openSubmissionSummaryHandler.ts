import { Dispatch } from "@reduxjs/toolkit";
import { ModalId } from "../../../enums/modalId";
import { setOpenedModalId } from "../../../redux/slice/modalSliceNew";

/**
 * Handler for Add button click in Pharma STP File table
 * Opens the SUBMISSION_SUMMARY_MODAL with row data
 */
export const handleOpenSubmissionSummary = (
  dispatch: Dispatch,
  rowData: any,
) => {
  dispatch(
    setOpenedModalId({
      id: ModalId.SUBMISSION_SUMMARY_MODAL,
      metaData: {
        data: rowData,
      },
    }),
  );
};
