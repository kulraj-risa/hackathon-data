import {
  AllOrderTableColumnsKeys,
  AuthOnFilePaOrdersTableColumnKeys,
  AuthorizedPaOrdersTableColumnKeys,
  CmmOrderTableColumnKeys,
  CptCodeWithDetailsKeys,
  DeniedPaOrdersTableColumnKeys,
  EligibilityCheckTableColumnKeys,
  EligibilityErrorTableColumnKeys,
  FinancialPaOrdersTableColumnKeys,
  GenericAuthStatusTableColumnKeys,
  HoldPaOrdersTableColumnKeys,
  MedicalPaOrdersTableColumnKeys,
  MemberTableColumnKeys,
  MyPaOrdersTableColumnKeys,
  NarPaOrdersTableColumnKeys,
  NotToWorkFedoraPaOrdersTableColumnKeys,
  NotToWorkPaOrdersTableColumnKeys,
  NotToWorkStatCasePaOrdersTableColumnKeys,
  NycbsPharmaOrderDataKeys,
  PatientOrdersTableColumnKeys,
  PendingPaOrdersTableColumnKeys,
  PharmaStpFileTableColumnKeys,
  PharmfillPaOrdersTableColumnKeys,
  PodPaOrdersTableColumnKeys,
  QueryPaOrdersTableColumnKeys,
} from "./../enums/tableColumnKeys";

import {
  TableCellAddKeyButton,
  TableCellButtonWithThreeDots,
  TableCellClickableBadgeForOpeningModal,
  TableCellForAuthRequired,
  TableCellMultiline,
  TableCellWithBadge,
  TableCellWithCheckbox,
  TableCellWithColoredText,
  TableCellWithDisabledStatus,
  TableCellWithImage,
  TableDataForAssignModal,
  TableStringWithBadge,
} from "./tableCells";

// TODO: File should be 150 lines or less, divide into smaller files

export interface AllOrderForTable {
  patientName?: string;
  patientID?: string;
  planName?: string;
  planID?: string;
  authorizationId?: string;
  authRequired?: string;
  priority?: string;
  type?: string;
  dateOfService?: string;
  location?: string;
  status?: string;
  assignedTo?: string;
  cptCodesWithPaStatus?: CptCodeWithPaStatus[];
  docId?: string;
}

export interface PatientOrdersForTable {
  authId?: string;
  authRequired?: string;
  dateOfService?: string;
  location?: string;
  planName?: string;
  priority?: string;
  status?: string;
  submissionDate?: string;
  submittedBy?: string;
  docId?: string;
  cptCodesWithPaStatus?: CptCodeWithPaStatus[];
}

export interface EligibilityErrors {
  patientName?: string;
  patientID?: string;
  payerName?: string;
  payerId?: string;
  priority?: string;
  type?: string;
  orderDate?: string;
  location?: string;
  docId?: string;
  error?: string;
  authRequired?: string;
  cptCodesWithPaStatus?: CptCodeWithPaStatus[];
}

export interface CptCodeWithPaStatus {
  text?: string;
  value?: boolean;
}

export interface AllOrderTableData {
  [AllOrderTableColumnsKeys.PatientName]: TableCellMultiline;
  [AllOrderTableColumnsKeys.PlanDetails]: TableCellMultiline;
  [AllOrderTableColumnsKeys.Authorization]: string;
  [AllOrderTableColumnsKeys.AuthRequired]: TableCellForAuthRequired;
  [AllOrderTableColumnsKeys.Priority]: TableCellWithColoredText | string;
  [AllOrderTableColumnsKeys.Type]: string;
  [AllOrderTableColumnsKeys.DateOfService]: string;
  [AllOrderTableColumnsKeys.Location]: string;
  [AllOrderTableColumnsKeys.Status]: TableCellWithBadge | string;
  [AllOrderTableColumnsKeys.DocId]: string;
}

export interface AllOrdersTableDataForAdmin extends AllOrderTableData {
  [AllOrderTableColumnsKeys.AssignedTo]: TableCellClickableBadgeForOpeningModal;
}

export interface PatientOrdersTableData {
  [PatientOrdersTableColumnKeys.AUTH_ID]: string;
  [PatientOrdersTableColumnKeys.AUTH_REQUIRED]: TableCellForAuthRequired;
  [PatientOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [PatientOrdersTableColumnKeys.LOCATION]: string;
  [PatientOrdersTableColumnKeys.PLAN_NAME]: string;
  [PatientOrdersTableColumnKeys.PRIORITY]: TableCellWithColoredText | string;
  [PatientOrdersTableColumnKeys.STATUS]: TableCellWithBadge | string;
  [PatientOrdersTableColumnKeys.SUBMISSION_DATE]: string;
  [PatientOrdersTableColumnKeys.SUBMITTED_BY]: string;
  [PatientOrdersTableColumnKeys.DOC_ID]: string;
}

export interface CptCodeTabeWithDetailsData {
  [CptCodeWithDetailsKeys.StartFrom]: string;
  [CptCodeWithDetailsKeys.EndAt]: string;
  [CptCodeWithDetailsKeys.JCodes]: string;
  [CptCodeWithDetailsKeys.Description]: string;
  [CptCodeWithDetailsKeys.PaRequired]: TableCellWithBadge;
  [CptCodeWithDetailsKeys.Visits]: string;
  [CptCodeWithDetailsKeys.RemainingVisits]: string;
  [CptCodeWithDetailsKeys.VisitsAllowed]: string;
}

export interface MemberTableData {
  [MemberTableColumnKeys.Name]: TableStringWithBadge;
  [MemberTableColumnKeys.Email]: string;
  [MemberTableColumnKeys.Role]: string;
  [MemberTableColumnKeys.Options]: TableCellWithImage;
}

export interface PaOrdersTableData {
  [AllOrderTableColumnsKeys.PatientName]: TableCellMultiline;
  [AllOrderTableColumnsKeys.PlanDetails]: TableCellMultiline;
  [AllOrderTableColumnsKeys.AuthRequired]: TableCellForAuthRequired;
  [AllOrderTableColumnsKeys.Priority]: TableCellWithColoredText | string;
  [AllOrderTableColumnsKeys.Type]: string;
  [AllOrderTableColumnsKeys.DateOfService]: string;
  [AllOrderTableColumnsKeys.Location]: string;
  [AllOrderTableColumnsKeys.DocId]: string;
}

export interface PaOrdersTableDataForAdmin extends PaOrdersTableData {
  [AllOrderTableColumnsKeys.AssignedTo]: TableCellClickableBadgeForOpeningModal;
}

export interface EligibilityErrorTableData {
  [EligibilityErrorTableColumnKeys.PatientName]: TableCellMultiline;
  [EligibilityErrorTableColumnKeys.PayerDetails]: TableCellMultiline;
  [EligibilityErrorTableColumnKeys.AuthRequired]: TableCellForAuthRequired;
  [EligibilityErrorTableColumnKeys.Priority]: TableCellWithColoredText | string;
  [EligibilityErrorTableColumnKeys.DocId]: string;
  [EligibilityErrorTableColumnKeys.Type]: string;
  [EligibilityErrorTableColumnKeys.OrderDate]: string;
  [EligibilityErrorTableColumnKeys.Location]: string;
  [EligibilityErrorTableColumnKeys.Error]: TableCellClickableBadgeForOpeningModal;
}

export interface CmmOrdersTableDataModel {
  [CmmOrderTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [CmmOrderTableColumnKeys.DATE_OF_BIRTH]: TableCellMultiline;
  [CmmOrderTableColumnKeys.DATE_OF_SERVICE]: string;
  [CmmOrderTableColumnKeys.MEDICATION]: string;
  [CmmOrderTableColumnKeys.PROVIDER_DETAILS]: string;
  [CmmOrderTableColumnKeys.INSURANCE_STATE]: string;
  [CmmOrderTableColumnKeys.ACTION]: TableCellButtonWithThreeDots;
  [CmmOrderTableColumnKeys.ID]: string;
  [CmmOrderTableColumnKeys.STATUS]: TableCellWithBadge;
  [CmmOrderTableColumnKeys.CMM_KEY]: string;
  [CmmOrderTableColumnKeys.FORM_NAME]: string;
  [CmmOrderTableColumnKeys.DELETE_ICON]: string;
  [CmmOrderTableColumnKeys.PATIENT_ID]: string;
  [CmmOrderTableColumnKeys.ROW_DATA]: string;
  [CmmOrderTableColumnKeys.NO_DATA_FIELDS]: TableCellWithBadge;
}

export interface PharmaStpFileTableDataModel {
  [PharmaStpFileTableColumnKeys.BATCH]: string;
  [PharmaStpFileTableColumnKeys.DATE_OF_WORK]: string;
  [PharmaStpFileTableColumnKeys.PATIENT_MRN]: string;
  [PharmaStpFileTableColumnKeys.PATIENT_NAME]: TableCellMultiline;
  [PharmaStpFileTableColumnKeys.DOB]: string;
  [PharmaStpFileTableColumnKeys.DRUG]: string;
  [PharmaStpFileTableColumnKeys.INSURANCE_ID]: TableCellMultiline;
  [PharmaStpFileTableColumnKeys.PHARMACY_TYPE]: string;
  [PharmaStpFileTableColumnKeys.BIN]: string;
  [PharmaStpFileTableColumnKeys.CMM_ID]: string;
  [PharmaStpFileTableColumnKeys.SECOND_STP_STATUS]: TableCellWithBadge;
  [PharmaStpFileTableColumnKeys.RESPONSE_STATUS]: TableCellWithBadge;
  [PharmaStpFileTableColumnKeys.ADD]: TableCellAddKeyButton;
  [PharmaStpFileTableColumnKeys.POC]: string;
  [PharmaStpFileTableColumnKeys.SFTP]: TableCellAddKeyButton;
}

export interface NycbsPharmaOrderDataModel {
  [NycbsPharmaOrderDataKeys.PATIENT_DETAILS]: TableCellMultiline;
  [NycbsPharmaOrderDataKeys.DATE_OF_BIRTH]: string;
  [NycbsPharmaOrderDataKeys.MEDICATION]: string;
  [NycbsPharmaOrderDataKeys.PROVIDER_DETAILS]: string;
  [NycbsPharmaOrderDataKeys.DATE_OF_SERVICE]: string;
  [NycbsPharmaOrderDataKeys.ASSIGNEE]: TableDataForAssignModal;
  [NycbsPharmaOrderDataKeys.KEY]: string;
  [NycbsPharmaOrderDataKeys.STATUS]: string;
}

export interface EligibilityCheckTableData {
  [EligibilityCheckTableColumnKeys.ID]: string;
  [EligibilityCheckTableColumnKeys.CREATED_AT]: string;
  [EligibilityCheckTableColumnKeys.REPORT_DATE]: string;
  [EligibilityCheckTableColumnKeys.TOTAL_ORDERS]: string;
  [EligibilityCheckTableColumnKeys.STATUS]: TableCellWithColoredText | string;
  [EligibilityCheckTableColumnKeys.DOWNLOAD_FILE]: TableCellWithDisabledStatus;
  [EligibilityCheckTableColumnKeys.VIEW_DETAILS]: string;
}

export interface MedicalPaOrdersTableData {
  [MedicalPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [MedicalPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [MedicalPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [MedicalPaOrdersTableColumnKeys.MEDICATION]: string;
  [MedicalPaOrdersTableColumnKeys.ASSIGNEE]: TableCellClickableBadgeForOpeningModal;
  [MedicalPaOrdersTableColumnKeys.ROW_DATA]: string;
  [MedicalPaOrdersTableColumnKeys.ID]: string;
  [MedicalPaOrdersTableColumnKeys.CREATED_AT]: string;
  [MedicalPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
  [MedicalPaOrdersTableColumnKeys.STATUS]: TableCellWithBadge;
  [MedicalPaOrdersTableColumnKeys.SELECT]: TableCellWithCheckbox;
  [MedicalPaOrdersTableColumnKeys.PROVIDER]: string;
  [MedicalPaOrdersTableColumnKeys.BO_VALUE]: TableCellWithBadge;
  [MedicalPaOrdersTableColumnKeys.RPA_STATUS]: {
    status: string;
    filePaths: string[];
  };
}

export interface MedicalPaOrdersTableDataForNonAdmin {
  [MedicalPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [MedicalPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [MedicalPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [MedicalPaOrdersTableColumnKeys.MEDICATION]: string;
  [MedicalPaOrdersTableColumnKeys.ASSIGNEE]: string;
  [MedicalPaOrdersTableColumnKeys.ROW_DATA]: string;
  [MedicalPaOrdersTableColumnKeys.ID]: string;
  [MedicalPaOrdersTableColumnKeys.CREATED_AT]: string;
  [MedicalPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
  [MedicalPaOrdersTableColumnKeys.STATUS]: TableCellWithBadge;
  [MedicalPaOrdersTableColumnKeys.RPA_STATUS]: {
    status: string;
    filePaths: string[];
  };
}

export interface MyMedicalPaOrdersTableData {
  [MyPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [MyPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [MyPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [MyPaOrdersTableColumnKeys.MEDICATION]: string;
  [MyPaOrdersTableColumnKeys.ROW_DATA]: string;
  [MyPaOrdersTableColumnKeys.ID]: string;
  [MyPaOrdersTableColumnKeys.CREATED_AT]: string;
  [MyPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface AuthorizedPaOrdersTableData {
  [AuthorizedPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [AuthorizedPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [AuthorizedPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [AuthorizedPaOrdersTableColumnKeys.MEDICATION]: string;
  [AuthorizedPaOrdersTableColumnKeys.STATE]: string;
  [AuthorizedPaOrdersTableColumnKeys.ROW_DATA]: string;
  [AuthorizedPaOrdersTableColumnKeys.ID]: string;
  [AuthorizedPaOrdersTableColumnKeys.CREATED_AT]: string;
  [AuthorizedPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface AuthOnFilePaOrdersTableData {
  [AuthOnFilePaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [AuthOnFilePaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [AuthOnFilePaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [AuthOnFilePaOrdersTableColumnKeys.MEDICATION]: string;
  [AuthOnFilePaOrdersTableColumnKeys.STATE]: string;
  [AuthOnFilePaOrdersTableColumnKeys.ROW_DATA]: string;
  [AuthOnFilePaOrdersTableColumnKeys.ID]: string;
  [AuthOnFilePaOrdersTableColumnKeys.CREATED_AT]: string;
  [AuthOnFilePaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface NarPaOrdersTableData {
  [NarPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [NarPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [NarPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [NarPaOrdersTableColumnKeys.MEDICATION]: string;
  [NarPaOrdersTableColumnKeys.STATE]: string;
  [NarPaOrdersTableColumnKeys.ROW_DATA]: string;
  [NarPaOrdersTableColumnKeys.ID]: string;
  [NarPaOrdersTableColumnKeys.CREATED_AT]: string;
  [NarPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface PendingPaOrdersTableData {
  [PendingPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [PendingPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [PendingPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [PendingPaOrdersTableColumnKeys.MEDICATION]: string;
  [PendingPaOrdersTableColumnKeys.STATE]: string;
  [PendingPaOrdersTableColumnKeys.ROW_DATA]: string;
  [PendingPaOrdersTableColumnKeys.ID]: string;
  [PendingPaOrdersTableColumnKeys.CREATED_AT]: string;
  [PendingPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface DeniedPaOrdersTableData {
  [DeniedPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [DeniedPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [DeniedPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [DeniedPaOrdersTableColumnKeys.MEDICATION]: string;
  [DeniedPaOrdersTableColumnKeys.STATE]: string;
  [DeniedPaOrdersTableColumnKeys.ROW_DATA]: string;
  [DeniedPaOrdersTableColumnKeys.ID]: string;
  [DeniedPaOrdersTableColumnKeys.CREATED_AT]: string;
  [DeniedPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface NotToWorkPaOrdersTableData {
  [NotToWorkPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [NotToWorkPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [NotToWorkPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [NotToWorkPaOrdersTableColumnKeys.MEDICATION]: string;
  [NotToWorkPaOrdersTableColumnKeys.STATE]: string;
  [NotToWorkPaOrdersTableColumnKeys.ROW_DATA]: string;
  [NotToWorkPaOrdersTableColumnKeys.ID]: string;
  [NotToWorkPaOrdersTableColumnKeys.CREATED_AT]: string;
  [NotToWorkPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface NotToWorkFedoraPaOrdersTableData {
  [NotToWorkFedoraPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [NotToWorkFedoraPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [NotToWorkFedoraPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [NotToWorkFedoraPaOrdersTableColumnKeys.MEDICATION]: string;
  [NotToWorkFedoraPaOrdersTableColumnKeys.STATE]: string;
  [NotToWorkFedoraPaOrdersTableColumnKeys.ROW_DATA]: string;
  [NotToWorkFedoraPaOrdersTableColumnKeys.ID]: string;
  [NotToWorkFedoraPaOrdersTableColumnKeys.CREATED_AT]: string;
  [NotToWorkFedoraPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface NotToWorkStatCasePaOrdersTableData {
  [NotToWorkStatCasePaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [NotToWorkStatCasePaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [NotToWorkStatCasePaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [NotToWorkStatCasePaOrdersTableColumnKeys.MEDICATION]: string;
  [NotToWorkStatCasePaOrdersTableColumnKeys.ASSIGNEE]: TableCellClickableBadgeForOpeningModal;
  [NotToWorkStatCasePaOrdersTableColumnKeys.STATE]: string;
  [NotToWorkStatCasePaOrdersTableColumnKeys.ROW_DATA]: string;
  [NotToWorkStatCasePaOrdersTableColumnKeys.ID]: string;
  [NotToWorkStatCasePaOrdersTableColumnKeys.CREATED_AT]: string;
  [NotToWorkStatCasePaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface PodPaOrdersTableData {
  [PodPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [PodPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [PodPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [PodPaOrdersTableColumnKeys.MEDICATION]: string;
  [PodPaOrdersTableColumnKeys.STATE]: string;
  [PodPaOrdersTableColumnKeys.ROW_DATA]: string;
  [PodPaOrdersTableColumnKeys.ID]: string;
  [PodPaOrdersTableColumnKeys.CREATED_AT]: string;
  [PodPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface FinancialPaOrdersTableData {
  [FinancialPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [FinancialPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [FinancialPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [FinancialPaOrdersTableColumnKeys.MEDICATION]: string;
  [FinancialPaOrdersTableColumnKeys.STATE]: string;
  [FinancialPaOrdersTableColumnKeys.ROW_DATA]: string;
  [FinancialPaOrdersTableColumnKeys.ID]: string;
  [FinancialPaOrdersTableColumnKeys.CREATED_AT]: string;
  [FinancialPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface HoldPaOrdersTableData {
  [HoldPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [HoldPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [HoldPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [HoldPaOrdersTableColumnKeys.MEDICATION]: string;
  [HoldPaOrdersTableColumnKeys.STATE]: string;
  [HoldPaOrdersTableColumnKeys.ROW_DATA]: string;
  [HoldPaOrdersTableColumnKeys.ID]: string;
  [HoldPaOrdersTableColumnKeys.CREATED_AT]: string;
  [HoldPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface GenericAuthStatusTableData {
  [GenericAuthStatusTableColumnKeys.PATIENT_DETAILS_WITH_LEFT_BORDER]: TableCellMultiline;
  [GenericAuthStatusTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [GenericAuthStatusTableColumnKeys.DATE_OF_SERVICE]: string;
  [GenericAuthStatusTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [GenericAuthStatusTableColumnKeys.MEDICATION]: string;
  [GenericAuthStatusTableColumnKeys.STATE]: string;
  [GenericAuthStatusTableColumnKeys.ROW_DATA]: string;
  [GenericAuthStatusTableColumnKeys.ID]: string;
  [GenericAuthStatusTableColumnKeys.CREATED_AT]: string;
  [GenericAuthStatusTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface PharmfillPaOrdersTableData {
  [PharmfillPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [PharmfillPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [PharmfillPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [PharmfillPaOrdersTableColumnKeys.MEDICATION]: string;
  [PharmfillPaOrdersTableColumnKeys.STATE]: string;
  [PharmfillPaOrdersTableColumnKeys.ROW_DATA]: string;
  [PharmfillPaOrdersTableColumnKeys.ID]: string;
  [PharmfillPaOrdersTableColumnKeys.CREATED_AT]: string;
  [PharmfillPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}

export interface QueryPaOrdersTableData {
  [QueryPaOrdersTableColumnKeys.PATIENT_DETAILS]: TableCellMultiline;
  [QueryPaOrdersTableColumnKeys.DATE_OF_SERVICE]: string;
  [QueryPaOrdersTableColumnKeys.PLAN_DETAILS]: TableCellMultiline;
  [QueryPaOrdersTableColumnKeys.MEDICATION]: string;
  [QueryPaOrdersTableColumnKeys.STATE]: string;
  [QueryPaOrdersTableColumnKeys.ROW_DATA]: string;
  [QueryPaOrdersTableColumnKeys.ID]: string;
  [QueryPaOrdersTableColumnKeys.CREATED_AT]: string;
  [QueryPaOrdersTableColumnKeys.AUTH_VERIFICATION]: TableCellWithBadge;
}
