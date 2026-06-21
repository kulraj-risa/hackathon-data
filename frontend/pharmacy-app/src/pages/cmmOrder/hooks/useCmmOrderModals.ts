import { useModalOpener } from "../../../hooks/useModalOpener";
import {
  handleConfirmRerun as confirmRerun,
  handleOpenRerunModal as openRerunModalHandler,
} from "../actionHandlers/rerunModalHandlers";
import {
  handleConfirmSendToPlan as confirmSendToPlan,
  handleOpenSendToPlanModal as openSendToPlanModalHandler,
} from "../actionHandlers/sendToPlanModalHandlers";
import { useModalStates } from "./useModalStates";

export const useCmmOrderModals = (
  ordersData: any[] | null,
  userEmail: string,
  resetAndFetchOrders: () => void,
  searchText: string,
  search: () => void,
  fetchAllOrders: () => void,
) => {
  const {
    openDeleteModal,
    setOpenDeleteModal,
    data,
    setData,
    openSendToPlanModal,
    setOpenSendToPlanModal,
    selectedOrderIdForSendToPlan,
    setSelectedOrderIdForSendToPlan,
    sendToPlanModalType,
    setSendToPlanModalType,
    openRerunModal,
    setOpenRerunModal,
    selectedOrderIdForRerun,
    setSelectedOrderIdForRerun,
    rerunType,
    setRerunType,
    rerunOrderData,
    setRerunOrderData,
    closeDeleteModal,
    closeSendToPlanModal,
    closeRerunModal,
    openReportPrescriptionModal,
    setOpenReportPrescriptionModal,
    selectedOrderIdForReportPrescription,
    setSelectedOrderIdForReportPrescription,
    closeReportPrescriptionModal,
    openReportMedicationModal,
    setOpenReportMedicationModal,
    selectedOrderIdForReportMedication,
    setSelectedOrderIdForReportMedication,
    closeReportMedicationModal,
  } = useModalStates();

  // Use global modal opener hook
  useModalOpener({
    openDeleteModal,
    openSendToPlanModal,
    openRerunModal,
    openReportPrescriptionModal,
    openReportMedicationModal,
  });

  const handleSendToPlanModalOpen = (
    orderId: string,
    modalType: "send_to_plan" | "retry_qa" | "fetch_qa" = "send_to_plan",
  ) => {
    openSendToPlanModalHandler(
      orderId,
      setSelectedOrderIdForSendToPlan,
      setOpenSendToPlanModal,
      setSendToPlanModalType,
      modalType,
    );
  };

  const handleSendToPlanConfirm = async () => {
    await confirmSendToPlan(
      selectedOrderIdForSendToPlan,
      userEmail,
      resetAndFetchOrders,
      setOpenSendToPlanModal,
      setSelectedOrderIdForSendToPlan,
      sendToPlanModalType,
      setSendToPlanModalType,
    );
  };

  const handleRerunModalOpen = (orderId: string, type: string) => {
    openRerunModalHandler(
      orderId,
      type,
      ordersData,
      setRerunOrderData,
      setSelectedOrderIdForRerun,
      setRerunType,
      setOpenRerunModal,
    );
  };

  const handleRerunConfirm = async () => {
    await confirmRerun(
      selectedOrderIdForRerun,
      rerunType,
      resetAndFetchOrders,
      setOpenRerunModal,
      setSelectedOrderIdForRerun,
      setRerunType,
      setRerunOrderData,
    );
  };

  const onCmmOrderDeleteSuccess = () => {
    setOpenDeleteModal(false);
    setData(null);
    if (searchText && searchText.length >= 3) {
      search();
    } else {
      fetchAllOrders();
    }
  };

  const handleReportPrescriptionModalOpen = (orderId: string) => {
    setSelectedOrderIdForReportPrescription(orderId);
    setOpenReportPrescriptionModal(true);
  };

  const handleReportMedicationModalOpen = (orderId: string) => {
    setSelectedOrderIdForReportMedication(orderId);
    setOpenReportMedicationModal(true);
  };

  return {
    openDeleteModal,
    setOpenDeleteModal,
    data,
    setData,
    openSendToPlanModal,
    sendToPlanModalType,
    openRerunModal,
    rerunType,
    rerunOrderData,
    handleSendToPlanModalOpen,
    handleSendToPlanConfirm,
    handleRerunModalOpen,
    handleRerunConfirm,
    onCmmOrderDeleteSuccess,
    closeDeleteModal,
    closeSendToPlanModal,
    closeRerunModal,
    openReportPrescriptionModal,
    selectedOrderIdForReportPrescription,
    handleReportPrescriptionModalOpen,
    closeReportPrescriptionModal,
    openReportMedicationModal,
    selectedOrderIdForReportMedication,
    handleReportMedicationModalOpen,
    closeReportMedicationModal,
  };
};
