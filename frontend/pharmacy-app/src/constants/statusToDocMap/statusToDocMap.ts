import { DocumentType } from "../../enums/documentTypes";
import { MedicalPaOrdersAuthStatus } from "../../enums/medicalPaOrdersAuthStatus";

export interface DocumentInfo {
  documentName: string;
  documentType: DocumentType;
}

export interface StatusDocumentMapping {
  [key: string]: {
    documents: DocumentInfo[];
  };
}

// Map structure mapping auth status to document requirements
export const statusToDocumentMap: StatusDocumentMapping = {
  [MedicalPaOrdersAuthStatus.AuthByRISA]: {
    documents: [
      {
        documentName: DocumentType.FILLED_FORM,
        documentType: DocumentType.FILLED_FORM,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.DeniedByRISA]: {
    documents: [
      {
        documentName: DocumentType.FILLED_FORM,
        documentType: DocumentType.FILLED_FORM,
      },
      {
        documentName: DocumentType.DENIAL_LETTER,
        documentType: DocumentType.DENIAL_LETTER,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.NoAuthRequired]: {
    documents: [
      {
        documentName: DocumentType.NAR_LETTER,
        documentType: DocumentType.NAR_LETTER,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.Pending]: {
    documents: [
      {
        documentName: DocumentType.FILLED_FORM,
        documentType: DocumentType.FILLED_FORM,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.AuthOnFile]: {
    documents: [
      {
        documentName: DocumentType.APPROVAL_LETTER,
        documentType: DocumentType.APPROVAL_LETTER,
      },
    ],
  },
};

export const DocumentUploadModalTitleMap: { [key: string]: string } = {
  [DocumentType.FILLED_FORM]: "Upload filled form",
  [DocumentType.APPROVAL_LETTER]: "Upload approval letter",
  [DocumentType.DENIAL_LETTER]: "Upload denial letter",
  [DocumentType.NAR_LETTER]: "Upload NAR letter",
};

export const DocumentViewerTitleMap: { [key: string]: string } = {
  [DocumentType.FILLED_FORM]: "Filled form",
  [DocumentType.APPROVAL_LETTER]: "Approval letter",
  [DocumentType.DENIAL_LETTER]: "Denial letter",
  [DocumentType.NAR_LETTER]: "NAR letter",
};

export const getDocumentsForStatus = (status: string): DocumentInfo[] => {
  return statusToDocumentMap[status]?.documents || [];
};

export const getDocumentNameForStatusAndDocType = (
  status: string,
  docType: string,
): string => {
  return (
    statusToDocumentMap[status]?.documents?.find(
      (doc) => doc.documentType === docType,
    )?.documentName || ""
  );
};

export const getDocumentTitleByDocType = (docType: string): string => {
  return DocumentUploadModalTitleMap[docType] || "";
};

export const getViewerDocumentTitleByDocType = (docType: string): string => {
  return DocumentViewerTitleMap[docType] || "";
};
