export const extractDateFromFileName = (fileName: string): string => {
  if (!fileName || fileName === "--") {
    return "--";
  }

  try {
    // Split by underscore and get the 4th element (index 3)
    const parts = fileName.split("_");

    if (parts.length >= 4) {
      const timestampPart = parts[3]; // Could be YYYYMMDD...

      // Extract the first 8 digits (YYYYMMDD)
      const dateMatch = timestampPart.match(/^(\d{8})/);
      if (dateMatch) {
        return dateMatch[1];
      }
    }

    return "--";
  } catch (error) {
    console.error("Error extracting date from filename:", error);
    return "--";
  }
};

export const extractFormattedDateFromFileName = (fileName: string): string => {
  const dateString = extractDateFromFileName(fileName);

  if (dateString === "--") {
    return "--";
  }

  try {
    // Parse YYYYMMDD into MM/DD/YYYY
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error("Error formatting date from filename:", error);
    return "--";
  }
};

export const extractBatchFromFileName = (fileName: string): string => {
  if (!fileName || fileName === "--") {
    return "--";
  }

  try {
    // Split by underscore and get the 4th element onwards
    const parts = fileName.split("_");

    if (parts.length >= 4) {
      // Join everything from the 4th part onwards and remove .csv
      let batchPart = parts.slice(3).join("_").replace(".csv", "");

      // Add underscore before "Batch" if not already present (e.g., "20260108Batch1" -> "20260108_Batch1")
      batchPart = batchPart.replace(/(\d{8})(Batch)/i, "$1_$2");

      return batchPart || "--";
    }

    return "--";
  } catch (error) {
    console.error("Error extracting batch from filename:", error);
    return "--";
  }
};
