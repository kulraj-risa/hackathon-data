import { getRowDataToPass } from "./rowDataUtils";

export const handleRowClickAction = (
  tableData: any,
  rowIndex: number,
  className: string,
  startIndex: number,
  props: {
    onReviewButtonClick?: (rowData: any) => void;
    onPatientDetailsClick?: (rowData: any) => void;
    onRowClick?: (rowData: any) => void;
    onDeleteIconClick?: (rowData: any) => void;
    onClickableTextWithDisabledStatusClick?: (rowData: any) => void;
    onReRunOncoEmrClick?: (rowData: any) => void;
    onReRunCmmClick?: (rowData: any) => void;
    onViewCmmClick?: (rowData: any) => void;
    onViewPharmaPaDiffCommentClick?: (rowData: any) => void;
    onViewCommentClick?: (rowData: any) => void;
    onAddKeyButtonClick?: (rowData: any) => void;
    handleDownloadButtonClick?: (id: string) => void;
    onReportPrescriptionClick?: (rowData: any) => void;
    onRowExpansionChangeFromTableBody?: (expanded: boolean, id: string) => void;
  },
): void => {
  const rowDataToPass = getRowDataToPass(tableData, rowIndex, startIndex);

  if (
    className.includes("button-link__button") ||
    className.includes("status-button__status") ||
    className.includes("button-link__viewDetails")
  ) {
    props.onReviewButtonClick?.(rowDataToPass);
  } else if (className.includes("info__authRequired")) {
    navigator.clipboard.writeText(rowDataToPass.docId);
  } else if (
    className.includes("multiline__patientName") ||
    className.includes("multiline__patientDetails")
  ) {
    props.onPatientDetailsClick?.(rowDataToPass);
  } else if (className.includes("copy-data__cmmKey")) {
    navigator.clipboard.writeText(rowDataToPass.cmmKey);
  } else if (className.includes("delete-icon__cmmOrderDeleteIcon")) {
    props.onDeleteIconClick?.(rowDataToPass);
  } else if (
    className.includes("clickable-text-with-disabled-status__downloadFile")
  ) {
    props.onClickableTextWithDisabledStatusClick?.(rowDataToPass);
  } else if (className.includes("button-link__reRunOncoEmr")) {
    props.onReRunOncoEmrClick?.(rowDataToPass);
  } else if (className.includes("button-link__reRunCmm")) {
    props.onReRunCmmClick?.(rowDataToPass);
  } else if (className.includes("button-link__viewCmmInput")) {
    props.onViewCmmClick?.(rowDataToPass);
  } else if (className.includes("button-link__pharmaPaDiffAction")) {
    props.onViewPharmaPaDiffCommentClick?.(rowDataToPass);
  } else if (className.includes("button-link__pharmaPaDiffViewComment")) {
    props.onViewCommentClick?.(rowDataToPass);
  } else if (className.includes("download-button__pdfEmbedPage")) {
    props.handleDownloadButtonClick?.(rowDataToPass.id);
  } else if (className.includes("view-icon__viewInfoForAuditTrial")) {
    return;
  } else if (className.includes("add-key-button__add")) {
    props.onAddKeyButtonClick?.(rowDataToPass);
  } else if (className.includes("button-link__reportPrescriptionInaccuracy")) {
    props.onReportPrescriptionClick?.(rowDataToPass);
  } else if (className.includes("add-key-button__sftp")) {
    props.onAddKeyButtonClick?.(rowDataToPass);
  } else if (className.includes("expandable-row-icon__expandableRowIcon")) {
    props.onRowExpansionChangeFromTableBody?.(
      rowDataToPass.isExpanded,
      rowDataToPass.id,
    );
  } else if (className.includes("record-closed-by")) {
    // POC cell click handled internally by RecordClosedByCell — don't navigate
    return;
  } else {
    props.onRowClick?.(rowDataToPass);
  }
};
