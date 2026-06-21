import { logError } from "../../utils/customLogger";
import { getFileFromNycbsSftp } from "./getFileFromNycbsSftp";

/**
 * Downloads a file by creating a blob and triggering a browser download
 */
const triggerFileDownload = (
  content: string | ArrayBuffer,
  filename: string,
): void => {
  // Create a blob from the file content
  const blob = new Blob([content], { type: "application/octet-stream" });

  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Downloads files from NYCBS SFTP
 * @param filenames - Array of filenames to download
 * @returns Promise that resolves when all files are downloaded
 */
export const downloadFilesFromSftp = async (
  filenames: string[],
): Promise<void> => {
  const downloadPromises = filenames.map(async (filename) => {
    const response = await getFileFromNycbsSftp(filename);

    if (response.success) {
      if (response.file_content) {
        triggerFileDownload(response.file_content, filename);
      } else if (response.data) {
        triggerFileDownload(response.data, filename);
      } else if (response.content) {
        triggerFileDownload(response.content, filename);
      } else if (response.file_data) {
        // Handle base64 encoded data
        try {
          const base64Data = response.file_data;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          triggerFileDownload(bytes, filename);
        } catch (e) {
          console.error("Error decoding base64 data:", e);
        }
      } else {
        logError(
          new Error("No file content found in response"),
          Object.keys(response),
        );
      }
    } else {
      console.error("Response not successful", response);
    }

    return response;
  });

  await Promise.all(downloadPromises);
};
