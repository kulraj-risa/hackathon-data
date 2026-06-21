/**
 * Formats DOB from YYYY-MM-DD to MM/DD/YYYY
 * @param dobString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in MM/DD/YYYY format, or "--" if invalid
 */
export const formatDob = (dobString: string | undefined): string => {
  if (!dobString || dobString === "--") return "--";
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return "--";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};
