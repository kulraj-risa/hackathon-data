import { capitalizeWordsSeperatedByUnderScore } from "../../../utils/stringModifications";
import { TableCellType } from "../../custom-table/table";
import { CsvData } from "../csvTable";

/**
 * Sanitizes CSV cell values to prevent formula injection attacks
 *
 * CSV injection (also known as Formula injection) is a vulnerability where
 * malicious formulas can be injected into CSV files. When these files are
 * opened in spreadsheet applications like Excel, the formulas can execute
 * potentially harmful commands.
 *
 * This function prevents such attacks by prefixing cells that start with
 * dangerous characters (=, +, @, -) with a single quote, which neutralizes
 * the formula execution.
 *
 * @param value - The cell value to sanitize
 * @returns Sanitized cell value safe from formula injection
 */
export const sanitizeCsvCell = (value: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  const dangerousChars = ["=", "+", "@", "-"];
  const firstChar = value.charAt(0);

  if (dangerousChars.includes(firstChar)) {
    return `'${value}`;
  }

  return value;
};

export const generateTableHeaders = (csvData: CsvData) => {
  if (!csvData || !csvData.headers.length) {
    return [];
  }

  const baseWidth = Math.floor(100 / csvData.headers.length);
  const remainder = 100 - baseWidth * csvData.headers.length;

  return csvData.headers.map((header, index) => {
    const sanitizedHeader = sanitizeCsvCell(header);
    const isAuthStatusField =
      sanitizedHeader.toLowerCase().includes("auth") &&
      sanitizedHeader.toLowerCase().includes("status");

    return {
      label: capitalizeWordsSeperatedByUnderScore(sanitizedHeader),
      key: sanitizedHeader,
      order: index + 1,
      width: baseWidth + (index < remainder ? 1 : 0),
      type: isAuthStatusField ? TableCellType.BADGE : TableCellType.STRING,
      sortable: true,
    };
  });
};

export const generateTableData = (csvData: CsvData) => {
  if (!csvData || !csvData.rows.length) {
    return [];
  }

  return csvData.rows.map((row, rowIndex) => {
    const rowObject: Record<string, any> = { id: rowIndex.toString() };
    csvData.headers.forEach((header, headerIndex) => {
      const rawCellValue = row[headerIndex] || "";
      const sanitizedHeader = sanitizeCsvCell(header);
      const cellValue = sanitizeCsvCell(rawCellValue);

      if (
        sanitizedHeader.toLowerCase().includes("auth") &&
        sanitizedHeader.toLowerCase().includes("status")
      ) {
        rowObject[sanitizedHeader] = {
          text: capitalizeWordsSeperatedByUnderScore(cellValue),
          color: "#0F0F0F",
          bgColor: "#F5F5F5",
        };
      } else {
        rowObject[sanitizedHeader] = cellValue;
      }
    });
    return rowObject;
  });
};
