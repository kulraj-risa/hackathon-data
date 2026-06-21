export enum MedicalPaKeys {
  PrimaryIcdCode = "primary_diagnosis_details.icd_code",
  PrimaryIcdCodeDescription = "primary_diagnosis_details.icd_description",
  SecondaryIcdCode = "secondary_diagnosis_details.icd_code",
  SecondaryIcdCodeDescription = "secondary_diagnosis_details.icd_description",
  IcdCode = "icd_code",
  IcdCodeDescription = "icd_description",
}

export enum MedicalPaOrderFilterKeys {
  Status = "order_status",
  AuthVerificationStatus = "auth_verification_status",
  DrugNames = "regimen",
  PayerNames = "payer_names",
  Assignee = "assignee",
  DateOfService = "date_of_service",
  CreatedAt = "created_at",
  BoStatus = "bo_status",
  EvWriteBackStatus = "ev_write_back_status",
  DocumentUploadStatus = "document_upload_status",
}

export enum FinalWorklistOrderFilterKeys {
  Status = "bo_value",
  AuthStatus = "auth_status",
  DrugNames = "regimen",
  Location = "location",
  DateOfService = "date_of_service",
  CreatedAt = "upload_timestamp",
  PrimaryInsurance = "primary_insurance",
}

export enum FinalWorklistOrderStatusValues {
  Denied = "Denied",
  Authorized = "Authorized",
  Financial = "Financial",
  Hold = "Hold",
  AuthmatePending = "Authmate Pending",
  AuthmateIssue = "Authmate Issue",
  Query = "Query",
  PharmFill = "Pharm Fill",
}

export enum FinancialReviewValues {
  new = "new",
  authorized = "authorized",
  financial = "financial",
  hold = "hold",
  query = "query",
  pharm_fill = "pharm_fill",
}

// export enum AuthVerificationStatusValues {
//   AUTH_ON_FILE = "auth_on_file",
//   AUTH_REQUIRED = "auth_required",
//   NO_AUTH_NEEDED = "no_auth_required",
//   QUERY = "query",
//   HOLD = "hold",
//   DENIED = "denied",
//   NAR = "nar",
//   POD = "pod",
//   NOT_TO_WORK_FEDORA = "not_to_work_fedora",
//   NOT_TO_WORK_STAT_CASE = "not_to_work_stat_case",
//   NOT_TO_WORK = "not_to_work",
//   REQUIRED = "required",
//   NEW = "new",
//   NOT_AVAILABLE = "not_available",
//   AUTHORIZED = "authorized",
//   ORAL_DRUG = "oral_drug",
//   NOT_TO_WORK_ORAL_DRUG = "not_to_work_oral_drug",
// }
