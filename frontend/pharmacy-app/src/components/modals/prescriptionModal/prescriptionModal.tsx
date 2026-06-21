import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Modal } from "risa-oasis-ui_v2";
import { RootState } from "../../../redux/store/store";
import {
  formatCommaSeparatedName,
  formatProviderName,
} from "../../../utils/stringModifications";
import DrugDetails from "./components/drugDetails";
import PatientDetails from "./components/patientDetails";

interface PrescriptionModalProps {
  onClose: () => void;
  id: string;
}

/**
 * Build patient & drug details directly from singleCmmOrderData (flat BQ model)
 * — same mapping as the expanded row Medication / Dosage prescription tabs.
 */
function buildDetailsFromFlatModel(data: Record<string, any> | null) {
  if (!data) return { patientDetails: [], drugDetails: [] };

  const patientName = formatCommaSeparatedName(
    data.patient_first_name && data.patient_last_name
      ? `${data.patient_first_name} ${data.patient_last_name}`
      : (data.provider_full_name ?? ""),
  );

  const patientDetails = [
    {
      header: "Patient Name",
      body:
        patientName ||
        `${data.patient_first_name ?? ""} ${data.patient_last_name ?? ""}`.trim(),
    },
    { header: "Patient MRN", body: data.patient_mrn ?? "" },
    { header: "Date of Birth", body: data.patient_dob ?? "" },
    {
      header: "Date of Prescription",
      body: data.prescription_data?.prescription_date ?? "",
    },
    { header: "Address", body: data.provider_address_street1 ?? "" },
    {
      header: "Prescriber",
      body: formatProviderName(data.provider_full_name ?? ""),
    },
    { header: "Prescriber Credentials", body: data.provider_credentials ?? "" },
  ];

  const prescriptionData = data.prescription_data ?? {};

  const drugDetails = [
    {
      header: "Drug Name",
      body: prescriptionData.prescription_description ?? "",
    },
    {
      header: "Drug Instructions",
      body: prescriptionData.prescription_instructions ?? "",
    },
    {
      header: "Dispense Amount",
      body: prescriptionData.dispense_qty ?? "",
    },
    {
      header: "Refill Amount",
      body: prescriptionData.refill_qty ?? "",
    },
  ];

  return { patientDetails, drugDetails };
}

const PrescriptionModal = (props: PrescriptionModalProps) => {
  const { data: singleCmmOrderData, loading } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const { patientDetails, drugDetails } = useMemo(
    () => buildDetailsFromFlatModel(singleCmmOrderData ?? null),
    [singleCmmOrderData],
  );

  return (
    <Modal
      dialogId={"prescription-modal"}
      onSave={props.onClose}
      title={"Patient Prescription"}
      saveButtonText={"Close"}
      cancelText={"Cancel"}
      onCancel={props.onClose}
      onClose={props.onClose}
      heightPercentage={70}
      showSingleButton={true}
      hideFooter={true}
    >
      {loading ? (
        <div className="flex h-full items-center justify-center p-8 text-primaryGray-9">
          Loading prescription data...
        </div>
      ) : (
        <>
          <div className="patient-details__container">
            <PatientDetails data={patientDetails} />
          </div>
          <div className="drug-details__container mt-4">
            <DrugDetails data={drugDetails} />
          </div>
        </>
      )}
    </Modal>
  );
};

export default PrescriptionModal;
