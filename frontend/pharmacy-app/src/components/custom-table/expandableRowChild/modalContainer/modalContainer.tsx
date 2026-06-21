import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "risa-oasis-ui_v2";

import { ModalId } from "../../../../enums/modalId";

import { AppDispatch, RootState } from "../../../../redux/store/store";

import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { closeModal } from "../../../../redux/slice/modalSliceNew";
import CmmInputViewerModalForCmmOrders from "../../../modals/cmmInputViewerModal/cmmInputViewerModalForCmmOrders";
import ExpandableTableRowDiagnosis from "../../../modals/expandableTableRowMedication/diagnosis/expandableTableRowDiagnosis";
import ExpandableTableRowDoasge from "../../../modals/expandableTableRowMedication/dosage/expandableTableRowDosage";
import ExpandableTableRowInsurance from "../../../modals/expandableTableRowMedication/insurance/expandableTableRowInsurance";
import ExpandableTableRowMedication from "../../../modals/expandableTableRowMedication/medication/expandableTableRowMedication";
import ExpandableTableRowSecondaryDiagnosis from "../../../modals/expandableTableRowMedication/secondaryDiagnosis/expandableTableRowSecondaryDiagnosis";

interface ModalContainerProps {
  rowData?: CmmOrderTableRowData;
}

const ModalContainer = ({ rowData }: ModalContainerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { openedModalId } = useSelector(
    (state: RootState) => state.modalSliceNew,
  );

  const handleClose = () => dispatch(closeModal());

  useEffect(() => {
    if (openedModalId) {
      openModal(openedModalId);
    }
  }, [openedModalId]);

  switch (openedModalId) {
    case ModalId.EXPANDABLE_TABLE_ROW_MEDICATION_MODAL:
      return (
        <ExpandableTableRowMedication onClose={handleClose} rowData={rowData} />
      );
    case ModalId.EXPANDABLE_TABLE_ROW_INSURANCE_MODAL:
      return (
        <ExpandableTableRowInsurance onClose={handleClose} rowData={rowData} />
      );
    case ModalId.EXPANDABLE_TABLE_ROW_DOSAGE_MODAL:
      return (
        <ExpandableTableRowDoasge onClose={handleClose} rowData={rowData} />
      );
    case ModalId.EXPANDABLE_TABLE_ROW_DIAGNOSIS_MODAL:
      return (
        <ExpandableTableRowDiagnosis onClose={handleClose} rowData={rowData} />
      );
    case ModalId.EXPANDABLE_TABLE_ROW_SECONDARY_DIAGNOSIS_MODAL:
      return (
        <ExpandableTableRowSecondaryDiagnosis
          onClose={handleClose}
          rowData={rowData}
        />
      );
    case ModalId.CMM_INPUT_VIEWER_MODAL:
      return (
        <CmmInputViewerModalForCmmOrders
          onClose={handleClose}
          orderId={rowData?.id ?? ""}
        />
      );
    default:
      return null;
  }
};

export default ModalContainer;
