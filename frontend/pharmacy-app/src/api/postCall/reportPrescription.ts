import { controlToastState } from "risa-oasis-ui_v2";
import { OrganizationType } from "../../enums/organizationTypes";
import { mapBqRowToFlatModel } from "../../utils/mapBqRowToFlatModel";
import { reRunWorkflows } from "../bigQuery/nycbsPharmaOrders";
import { fetchBqRecordByIdentifier } from "../bigQuery/paCasesBigQuery";

export const reportPrescriptionIssue = async (
  orderId: string,
  reason: string,
  prescriptionName: string,
  onClose?: () => void,
) => {
  try {
    const bqRow = await fetchBqRecordByIdentifier(orderId);

    if (!bqRow) {
      throw new Error("No record found in BigQuery for this order");
    }

    const orderData = mapBqRowToFlatModel(bqRow);

    let payloadBasedOnType = {};

    if (orderData?.type === "Internal") {
      payloadBasedOnType = {
        type: "Internal",
        prescriber_name: orderData?.provider_first_name
          ? `${orderData.provider_first_name} ${orderData.provider_last_name || ""}`.trim()
          : "",
        sftp_rx_bin: orderData?.sftp_rx_bin,
        sftp_member_id: orderData?.sftp_member_id,
      };
    } else if (orderData?.type === "External") {
      payloadBasedOnType = {
        type: "External",
        prescriber_name: orderData?.provider_first_name
          ? `${orderData.provider_first_name} ${orderData.provider_last_name || ""}`.trim()
          : "",
      };
    }

    const drugName = orderData?.drug_name_onco_emr;

    let basePayload = {};

    if (orderData?.org_id === OrganizationType.NYCBS_PHARMA) {
      basePayload = {
        drug_name: drugName,
        identifier: orderData?.identifier,
        patient_mrn: orderData?.patient_mrn,
        org_id: orderData?.org_id,
        is_new_request: true,
        ...payloadBasedOnType,
      };
    } else if (orderData?.org_id === OrganizationType.ASTERA) {
      basePayload = {
        drug_name: drugName,
        identifier: orderData?.identifier,
        patient_dob: orderData?.patient_dob,
        patient_last_name: orderData?.patient_last_name,
        external_source_identifier: orderData?.external_source_identifier,
        org_id: orderData?.org_id,
        is_new_request: true,
        ...payloadBasedOnType,
      };
    } else {
      basePayload = {
        drug_name: drugName,
        identifier: orderData?.identifier,
        patient_mrn: orderData?.patient_mrn,
        org_id: orderData?.org_id,
        is_new_request: true,
        ...payloadBasedOnType,
      };
    }

    const payload = {
      ...basePayload,
      report_reason: reason,
      prescription_name: prescriptionName,
    };

    const response = await reRunWorkflows(payload);
    if (response?.status === "success") {
      controlToastState("prescription-report-success");
    } else {
      controlToastState("prescription-report-error");
    }
  } catch (error) {
    console.error("Error reporting prescription:", error);
    controlToastState("re-run-error");
    throw error;
  } finally {
    if (onClose) {
      onClose();
    }
  }
};
