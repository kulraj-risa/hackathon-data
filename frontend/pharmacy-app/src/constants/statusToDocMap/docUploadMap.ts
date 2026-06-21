import { DocumentType } from "../../enums/documentTypes";
import { MedicalPaOrdersAuthStatus } from "../../enums/medicalPaOrdersAuthStatus";

export interface DocumentInfo {
  doc_title?: string;
  doc_type?: string;
  doc_path?: string;
  uploaded_text?: string;
  text_to_display?: string;
  isUploaded?: boolean;
  id?: string;
}

export interface StatusDocumentUploadMapping {
  [key: string]: {
    documents: DocumentInfo[];
  };
}

export const statusToDocumentUploadMap: StatusDocumentUploadMapping = {
  [MedicalPaOrdersAuthStatus.AuthByRISA]: {
    documents: [
      {
        doc_title: DocumentType.FILLED_FORM,
        doc_type: DocumentType.FILLED_FORM,
        uploaded_text: "Filled form.pdf",
        text_to_display: "Upload filled form",
        doc_path: "",
        isUploaded: false,
      },
      {
        doc_title: DocumentType.APPROVAL_LETTER,
        doc_type: DocumentType.APPROVAL_LETTER,
        uploaded_text: "Approval letter.pdf",
        text_to_display: "Upload approval letter",
        doc_path: "",
        isUploaded: false,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.DeniedByRISA]: {
    documents: [
      {
        doc_title: DocumentType.FILLED_FORM,
        doc_type: DocumentType.FILLED_FORM,
        uploaded_text: "Filled form.pdf",
        text_to_display: "Upload filled form",
        isUploaded: false,
      },
      {
        doc_title: DocumentType.DENIAL_LETTER,
        doc_type: DocumentType.DENIAL_LETTER,
        uploaded_text: "Denial letter.pdf",
        text_to_display: "Upload denial letter",
        doc_path: "",
        isUploaded: false,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.NoAuthRequired]: {
    documents: [
      {
        doc_title: DocumentType.NAR_LETTER,
        doc_type: DocumentType.NAR_LETTER,
        uploaded_text: "NAR letter.pdf",
        text_to_display: "Upload NAR letter",
        doc_path: "",
        isUploaded: false,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.Pending]: {
    documents: [
      {
        doc_title: DocumentType.FILLED_FORM,
        doc_type: DocumentType.FILLED_FORM,
        uploaded_text: "Filled form.pdf",
        text_to_display: "Upload filled form",
        doc_path: "",
        isUploaded: false,
      },
    ],
  },
  [MedicalPaOrdersAuthStatus.AuthOnFile]: {
    documents: [
      {
        doc_title: DocumentType.APPROVAL_LETTER,
        doc_type: DocumentType.APPROVAL_LETTER,
        uploaded_text: "Approval letter.pdf",
        text_to_display: "Upload approval letter",
        doc_path: "",
        isUploaded: false,
      },
    ],
  },
};

export const getDocumentsUploadStatusForStatus = (
  status?: string,
): DocumentInfo[] => {
  return statusToDocumentUploadMap[status || ""]?.documents || [];
};
