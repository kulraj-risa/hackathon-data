import { executeRerunFromCmm } from "../utils/executeRerunFromCmm";
import { executeRerunFromOncoEmr } from "../utils/executeRerunFromOncoEmr";

export const handleOpenRerunModal = (
  orderId: string,
  type: string,
  ordersData: any[] | null,
  setRerunOrderData: (data: any) => void,
  setSelectedOrderIdForRerun: (orderId: string) => void,
  setRerunType: (type: "onco-emr" | "cmm" | "") => void,
  setOpenRerunModal: (open: boolean) => void,
) => {
  // Find the order data from the current orders
  const order = ordersData?.find((order) => order.identifier === orderId);

  if (order) {
    setRerunOrderData({
      patientMrn: order.patient_mrn,
      drugName: order.drug_name,
      orgId: order.org_id,
      identifier: order.identifier,
    });
  }

  setSelectedOrderIdForRerun(orderId);
  setRerunType(type as "onco-emr" | "cmm");
  setOpenRerunModal(true);
};

export const handleConfirmRerun = async (
  selectedOrderIdForRerun: string | null,
  rerunType: "onco-emr" | "cmm" | "",
  resetAndFetchOrders: () => void,
  setOpenRerunModal: (open: boolean) => void,
  setSelectedOrderIdForRerun: (orderId: string | null) => void,
  setRerunType: (type: "onco-emr" | "cmm" | "") => void,
  setRerunOrderData: (data: any) => void,
) => {
  if (selectedOrderIdForRerun && rerunType) {
    if (rerunType === "onco-emr") {
      await executeRerunFromOncoEmr(
        selectedOrderIdForRerun,
        resetAndFetchOrders,
      );
    } else if (rerunType === "cmm") {
      await executeRerunFromCmm(selectedOrderIdForRerun, resetAndFetchOrders);
    }
    setOpenRerunModal(false);
    setSelectedOrderIdForRerun(null);
    setRerunType("");
    setRerunOrderData(null);
  }
};
