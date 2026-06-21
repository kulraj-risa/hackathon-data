import { useState } from "react";
import { CmmOrdersTableDataModel } from "../../../data-model/tablesData";

export const useModalStates = () => {
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [data, setData] = useState<CmmOrdersTableDataModel | null>(null);
  const [openSendToPlanModal, setOpenSendToPlanModal] =
    useState<boolean>(false);
  const [selectedOrderIdForSendToPlan, setSelectedOrderIdForSendToPlan] =
    useState<string | null>(null);
  const [sendToPlanModalType, setSendToPlanModalType] = useState<
    "send_to_plan" | "retry_qa" | "fetch_qa"
  >("send_to_plan");
  const [openRerunModal, setOpenRerunModal] = useState<boolean>(false);
  const [selectedOrderIdForRerun, setSelectedOrderIdForRerun] = useState<
    string | null
  >(null);
  const [rerunType, setRerunType] = useState<"onco-emr" | "cmm" | "">("");
  const [rerunOrderData, setRerunOrderData] = useState<any>(null);
  const [openReportPrescriptionModal, setOpenReportPrescriptionModal] =
    useState<boolean>(false);
  const [
    selectedOrderIdForReportPrescription,
    setSelectedOrderIdForReportPrescription,
  ] = useState<string | null>(null);
  const [openReportMedicationModal, setOpenReportMedicationModal] =
    useState<boolean>(false);
  const [
    selectedOrderIdForReportMedication,
    setSelectedOrderIdForReportMedication,
  ] = useState<string | null>(null);

  const closeDeleteModal = () => {
    setOpenDeleteModal(false);
    setData(null);
  };

  const closeSendToPlanModal = () => {
    setOpenSendToPlanModal(false);
    setSelectedOrderIdForSendToPlan(null);
    setSendToPlanModalType("send_to_plan");
  };

  const closeRerunModal = () => {
    setOpenRerunModal(false);
    setSelectedOrderIdForRerun(null);
    setRerunType("");
    setRerunOrderData(null);
  };

  const closeReportPrescriptionModal = () => {
    setOpenReportPrescriptionModal(false);
    setSelectedOrderIdForReportPrescription(null);
  };

  const closeReportMedicationModal = () => {
    setOpenReportMedicationModal(false);
    setSelectedOrderIdForReportMedication(null);
  };

  return {
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
  };
};
