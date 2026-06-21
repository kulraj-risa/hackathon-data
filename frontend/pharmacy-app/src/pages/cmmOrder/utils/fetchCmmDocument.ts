import { getAllDocumentsForOrder } from "../../../api/bigQuery/nycbsPharmaOrders";
import { getRapidsFileDownloadUrl } from "../../../api/firebase/rapidsFirestore";
import { NycbDocumentModel } from "../../../data-model/nycbsPharmaOrder";
import { CmmDocType } from "../../../enums/cmmDocType";

/**
 * Fetches the latest document of a specific type for a given order
 * @param orderId - The order identifier
 * @param docType - The type of document to fetch (e.g., CMM_SCREENSHOT, CLINICAL_ATTACHMENT, etc.)
 * @param signal - Optional AbortSignal for cancelling the request
 * @returns The download URL of the latest document, or null if not found
 */
export const fetchLatestCmmDocumentUrl = async (
  orderId: string,
  docType: CmmDocType,
  signal?: AbortSignal,
): Promise<string | null> => {
  try {
    const results = await getAllDocumentsForOrder(orderId, signal);
    const documents: NycbDocumentModel[] = results["details"] || [];

    const filteredDocs = documents.filter(
      (doc) => doc.document_type === docType,
    );

    if (filteredDocs && filteredDocs.length > 0) {
      const latestDoc = filteredDocs.sort(
        (a, b) =>
          new Date(b?.created_at ?? "").getTime() -
          new Date(a?.created_at ?? "").getTime(),
      )[0];

      const url = await getRapidsFileDownloadUrl(latestDoc?.file_path ?? "");
      return url;
    }

    return null;
  } catch (error) {
    // Re-throw abort errors
    if ((error as Error).name === "AbortError") {
      throw error;
    }
    console.error(`Error fetching ${docType} document:`, error);
    throw error;
  }
};

/**
 * Fetches the latest CMM screenshot document URL for a given order
 * @param orderId - The order identifier
 * @param signal - Optional AbortSignal for cancelling the request
 * @returns The download URL of the latest CMM screenshot, or null if not found
 */
export const fetchLatestCmmScreenshotUrl = async (
  orderId: string,
  signal?: AbortSignal,
): Promise<string | null> => {
  return fetchLatestCmmDocumentUrl(orderId, CmmDocType.CMM_SCREENSHOT, signal);
};

/**
 * Fetches all documents for a given order and returns them grouped by document type
 * @param orderId - The order identifier
 * @returns Object with documents grouped by type
 */
export const fetchAllCmmDocuments = async (
  orderId: string,
): Promise<Record<string, NycbDocumentModel[]>> => {
  try {
    const results = await getAllDocumentsForOrder(orderId);
    const documents: NycbDocumentModel[] = results["details"] || [];

    const groupedDocuments: Record<string, NycbDocumentModel[]> = {};

    documents.forEach((doc) => {
      const docType = doc.document_type || "unknown";
      if (!groupedDocuments[docType]) {
        groupedDocuments[docType] = [];
      }
      groupedDocuments[docType].push(doc);
    });

    // Sort each group by created_at date (newest first)
    Object.keys(groupedDocuments).forEach((key) => {
      groupedDocuments[key].sort(
        (a, b) =>
          new Date(b?.created_at ?? "").getTime() -
          new Date(a?.created_at ?? "").getTime(),
      );
    });

    return groupedDocuments;
  } catch (error) {
    console.error("Error fetching all CMM documents:", error);
    throw error;
  }
};
