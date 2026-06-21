import { getFileDownloadUrl } from "../firebase/firestoreService";

export interface CsvFetchResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export const fetchCsvData = async (
  csvPath: string,
): Promise<CsvFetchResponse> => {
  try {
    const downloadUrl = await getFileDownloadUrl(csvPath);

    if (!downloadUrl) {
      return {
        success: false,
        error: "Failed to get download URL from Firebase Storage",
      };
    }

    const response = await fetch(downloadUrl);

    if (response.ok) {
      const csvText = await response.text();
      return {
        success: true,
        data: csvText,
      };
    } else {
      return {
        success: false,
        error: `Failed to fetch CSV: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error fetching CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};
