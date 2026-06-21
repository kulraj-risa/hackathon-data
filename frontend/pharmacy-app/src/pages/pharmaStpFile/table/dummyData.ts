import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";

export const dummyData: PharmaStpFileModel[] = [
  {
    identifier: "dummy-id-1",
    seq: "12345",
    pharmacy_type: "Internal",
    poc: "Dr. Smith",
    patient_mrn: "123456",
    patient_name: "John Doe",
    dob: "1985-04-12",
    insuranceid: "INS123456",
    provider_name: "Dr. Smith",
    drug: "Atorvastatin 20mg",
    pharmacy: "NYCBS In House",
    bin: "610140",
    pharmacy_phone: null,
    rx_due_date: "2025-12-10",
    second_stp_status: "Not Sent",
    sftp_status: "Not Sent",
    covermymed_id: "CMM-1001",
    response_status: "Form Filled",
    filename: "NYCBS_RXSM_RisaHealth_20251120_0930.csv",
    org_id: "org123",
    dumped_at: "2025-11-20T09:30:00.000Z",
  },
  // Additional dummy entries can be added here if needed
  // This file is kept for reference but the table now uses real API data
];
