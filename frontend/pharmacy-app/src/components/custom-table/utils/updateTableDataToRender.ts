import moment from "moment";
import { TableData } from "../../../context/tablesContextProvider";

type SortType = "date" | "string" | "number";

interface SortOptions {
  key: string;
  subKey?: string;
  type?: SortType;
  sortAscending: boolean;
}

const updateTableDataToRender = (
  searchResults: any[],
  tableAttributes: TableData,
  itemsPerPage: number,
  handlePageChange: (startIndex: number, endIndex: number, data: any[]) => void,
): any[] => {
  if (searchResults.length === 0) return [];

  const sortByKey = tableAttributes?.sortByKey;
  const sortBySubKey = tableAttributes?.sortBySubKey;

  const getIndices = (): { startIndex: number; endIndex: number } => {
    const startIndex = Number(tableAttributes?.startIndex) || 0;
    const endIndex = Number(tableAttributes?.endIndex) || itemsPerPage - 1;
    return { startIndex, endIndex };
  };

  const updateTableData = (startIndex: number, endIndex: number): any[] => {
    let updatedTableData = searchResults;
    if (sortByKey || sortBySubKey) {
      updatedTableData = sortTableData(updatedTableData, {
        key: sortByKey as string,
        subKey: sortBySubKey ? (sortBySubKey as string) : undefined,
        sortAscending: Boolean(tableAttributes?.sortAscending) ?? true,
      });
    }
    handlePageChange(startIndex, endIndex, updatedTableData);
    return updatedTableData;
  };

  const { startIndex, endIndex } = getIndices();

  return startIndex < searchResults.length
    ? updateTableData(startIndex, endIndex)
    : updateTableData(0, itemsPerPage - 1);
};

export function sortTableData<T extends Record<string, any>>(
  data: T[],
  { key, subKey, type = "string", sortAscending }: SortOptions,
): T[] {
  const getValue = (item: T) => (subKey ? item[key]?.[subKey] : item[key]);

  const isNumeric = (val: any): boolean => /^-?\d+(\.\d+)?$/.test(val);

  const parseMDYString = (dateStr: string): Date => {
    const [month, day, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  return [...data].sort((a, b) => {
    const valA = getValue(a);
    const valB = getValue(b);

    if (type === "date") {
      const dateA = parseMDYString(moment(valA).format("MM/DD/YYYY"));
      const dateB = parseMDYString(moment(valB).format("MM/DD/YYYY"));
      return sortAscending
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    if (isNumeric(valA) && isNumeric(valB)) {
      return sortAscending
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }

    return sortAscending
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
}

export default updateTableDataToRender;
