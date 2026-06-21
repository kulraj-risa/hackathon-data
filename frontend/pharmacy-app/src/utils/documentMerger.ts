import { mergePdfs } from "../pages/pharmaQuestionaire/utils/pdfMerger";
import { logError } from "./customLogger";

interface MergeDocumentsResult {
  mergedFile: File;
  fileName: string;
}

export const mergeDocuments = async (
  documents: File[],
  baseFileName: string,
): Promise<MergeDocumentsResult | null> => {
  try {
    if (!documents || documents.length === 0) {
      logError(
        new Error("No documents provided for merging"),
        "No documents provided for merging",
      );
      return null;
    }

    // Single document - return as is with appropriate filename
    if (documents.length === 1) {
      const sanitizedBaseName = baseFileName.replace(/\s+/g, "_");
      const fileName = `${sanitizedBaseName}_final_document.pdf`;
      return {
        mergedFile: documents[0],
        fileName,
      };
    }

    // Multiple documents - merge them
    const mergedDocInfo = await mergePdfs(documents);
    if (!mergedDocInfo || !mergedDocInfo.mergedPdf) {
      logError(
        new Error("Failed to merge documents"),
        "Failed to merge documents",
      );
      return null;
    }

    // Convert merged blob to File object
    const sanitizedBaseName = baseFileName.replace(/\s+/g, "_");
    const fileName = `${sanitizedBaseName}_merged_document.pdf`;
    const mergedFile = new File([mergedDocInfo.mergedPdf], fileName, {
      type: "application/pdf",
    });

    return {
      mergedFile,
      fileName,
    };
  } catch (error) {
    logError(error as Error, "Error in mergeDocuments");
    return null;
  }
};
