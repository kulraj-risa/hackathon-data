import { executeSendToPlan } from "../utils/executeSendToPlan";

export const handleOpenSendToPlanModal = (
  orderId: string,
  setSelectedOrderIdForSendToPlan: (orderId: string) => void,
  setOpenSendToPlanModal: (open: boolean) => void,
  setSendToPlanModalType: (
    type: "send_to_plan" | "retry_qa" | "fetch_qa",
  ) => void,
  modalType: "send_to_plan" | "retry_qa" | "fetch_qa" = "send_to_plan",
) => {
  setSelectedOrderIdForSendToPlan(orderId);
  setSendToPlanModalType(modalType);
  setOpenSendToPlanModal(true);
};

export const handleConfirmSendToPlan = async (
  selectedOrderIdForSendToPlan: string | null,
  userEmail: string,
  resetAndFetchOrders: () => void,
  setOpenSendToPlanModal: (open: boolean) => void,
  setSelectedOrderIdForSendToPlan: (orderId: string | null) => void,
  modalType: "send_to_plan" | "retry_qa" | "fetch_qa",
  setSendToPlanModalType: (
    type: "send_to_plan" | "retry_qa" | "fetch_qa",
  ) => void,
) => {
  if (selectedOrderIdForSendToPlan) {
    // Same API call for both send_to_plan and retry_qa
    await executeSendToPlan(
      selectedOrderIdForSendToPlan,
      userEmail,
      resetAndFetchOrders,
    );
    setOpenSendToPlanModal(false);
    setSelectedOrderIdForSendToPlan(null);
    setSendToPlanModalType("send_to_plan");
  }
};
