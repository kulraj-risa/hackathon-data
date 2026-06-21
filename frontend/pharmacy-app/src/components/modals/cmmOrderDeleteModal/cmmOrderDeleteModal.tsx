import { useState } from "react";
import { useSelector } from "react-redux";
import { closeModal, Modal } from "risa-oasis-ui_v2";
import { deleteCmmOrder } from "../../../api/bigQuery/nycbsPharmaOrders";
import { CmmOrdersTableDataModel } from "../../../data-model/tablesData";
import { RootState } from "../../../redux/store/store";
import WarningIcon from "../../../svg/warningIcon";
import { logDataToConsole } from "../../../utils/customLogger";

interface CmmOrderDeleteModalProps {
  onClose: () => void;
  data: CmmOrdersTableDataModel | null;
  onDeleteSuccess: () => void;
}

const CmmOrderDeleteModal = (props: CmmOrderDeleteModalProps) => {
  const { data } = useSelector((state: RootState) => state.nycbsPharmaOrders);
  const [deleteStatus, setDeleteStatus] = useState<boolean>(false);
  const deleteRequestForCmmEntry = async () => {
    const orderDetailsToDelete = data?.find(
      (order) => order.identifier === props.data?.id,
    );
    if (orderDetailsToDelete) {
      setDeleteStatus(true);
      const finalDataToBeDeleted = JSON.parse(props.data?.rowData ?? "{}");
      logDataToConsole("finalDataToBeDeleted", finalDataToBeDeleted);
      try {
        await deleteCmmOrder(finalDataToBeDeleted);
      } catch (error) {
        console.error(error);
      } finally {
        setDeleteStatus(false);
        closeModal("order-delete-confirmation");
        props.onDeleteSuccess();
      }
    }
  };
  return (
    <Modal
      dialogId={"order-delete-confirmation"}
      title={"Order Delete Confirmation"}
      saveButtonText={deleteStatus ? "Deleting..." : "Delete"}
      cancelText={"Cancel"}
      onClose={props.onClose}
      onCancel={props.onClose}
      onSave={deleteRequestForCmmEntry}
      disableSave={deleteStatus}
    >
      <div className="cmm-order-delete-modal--container flex flex-col items-center justify-center gap-4">
        <div className="cmm-order-delete-moal--wairning-icon">
          <WarningIcon />
        </div>
        <div className="cmm-order-delete-modal--warning-text">
          Are you sure you want to delete this order?
        </div>
        <div className="cmm-order-delete-modal--details flex w-full flex-col items-center justify-center gap-2 rounded-md bg-primaryGray-16 p-4">
          <div className="cmm-order-delete-modal--mrn text-small font-normal">
            Patient MRN :{" "}
            <span className="cmm-order-delete-modal--mrn-value text-small font-bold">
              {props.data?.patientId ?? "--"}
            </span>
          </div>
          <div className="cmm-order-delete-modal--drug text-small font-normal">
            Drug :{" "}
            <span className="cmm-order-delete-modal--mrn-value text-small font-bold">
              {props.data?.medication ?? "--"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CmmOrderDeleteModal;
