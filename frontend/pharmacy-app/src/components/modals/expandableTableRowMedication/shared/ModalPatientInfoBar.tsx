import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { CopyIcon } from "../../../../svg/copy-icon";
import { calculateAge } from "../../../../utils/ageCalculator";

interface ModalPatientInfoBarProps {
  rowData?: CmmOrderTableRowData;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Shared patient info bar for expandable row modals.
 * Exactly replicates the EV-BV page patient bar:
 *   [Name • MRN • DOB (age) • Drug]  [drug_type]  [generic_brand]  Cmm Key: XXX
 */
const ModalPatientInfoBar = ({ rowData }: ModalPatientInfoBarProps) => {
  // Parse the raw BigQuery row to get all fields directly
  let rawRow: Record<string, any> = {};
  try {
    if (rowData?.rowData && typeof rowData.rowData === "string") {
      rawRow = JSON.parse(rowData.rowData);
    }
  } catch {
    // ignore
  }

  const patient = rawRow?.patient ?? {};
  const drug = rawRow?.drug ?? {};
  const workflow = rawRow?.workflow ?? {};

  // Patient name: "First Last"
  const patientName = (() => {
    const first = patient?.first_name ?? "";
    const last = patient?.last_name ?? "";
    if (first || last) {
      return `${capitalize(first)} ${capitalize(last)}`.trim();
    }
    return rowData?.patientDetails?.mainText ?? "";
  })();

  // MRN from raw row
  const mrn = patient?.patient_mrn ?? rowData?.patientId ?? "";

  // DOB
  const dob = patient?.dob ?? rowData?.dateOfBirth?.mainText ?? "";
  const age = calculateAge(dob);

  // Drug name (drug_name_onco_emr like EV-BV page)
  const drugName =
    drug?.drug_name_onco_emr ??
    drug?.drug_name ??
    rowData?.medication?.split(" ")[0] ??
    "";

  // Badges
  const drugType = rawRow?.drug_type ?? "";
  const genericBrand = rawRow?.generic_brand ?? "";

  // CMM Key
  const cmmKey = workflow?.cmm_result_key ?? rowData?.cmmKey ?? "";

  return (
    <div className="flex w-full items-center gap-2 border-b border-primaryGray-15 pb-3">
      <div className="mx-2 rounded-[1.875rem] bg-primaryGray-16 px-4 text-small font-semibold leading-6 text-primaryGray-1">
        {patientName}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {mrn}
        &nbsp;&nbsp;<span>&#8226;</span>&nbsp;&nbsp;
        {dob}&nbsp;&nbsp;({age}yrs) &nbsp;&nbsp;
        <span>&#8226;</span>&nbsp;&nbsp; &nbsp;&nbsp;{drugName}
      </div>

      {drugType && (
        <div
          className="rounded-[1.875rem] px-4 text-small font-semibold leading-6"
          style={{ backgroundColor: "#CC0300", color: "#FFFFFF" }}
        >
          {drugType}
        </div>
      )}

      {genericBrand && (
        <div
          className="rounded-[1.875rem] px-4 text-small font-semibold leading-6"
          style={{ backgroundColor: "#0056D6", color: "#FFFFFF" }}
        >
          {genericBrand}
        </div>
      )}

      {cmmKey && (
        <div className="cmm-result-key ml-auto flex items-center gap-2 text-small">
          Cmm Key:{" "}
          <span className="font-bold">
            {cmmKey}
            &nbsp;
          </span>
          <div
            className="cmm-result-key copy-icon hover:cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(cmmKey);
            }}
          >
            <CopyIcon />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalPatientInfoBar;
