export const convertDateToAPIFormat = (dateStr: string): string => {
  // Check if already in YYYYMMDD format (8 digits)
  if (/^\d{8}$/.test(dateStr)) {
    return dateStr;
  }

  // Try to parse MM/DD/YYYY format
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) {
    // If parsing fails, return the original string
    return dateStr;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};
