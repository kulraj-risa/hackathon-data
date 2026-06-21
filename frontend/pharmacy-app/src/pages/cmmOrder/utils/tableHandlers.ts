import { NavigateFunction } from "react-router-dom";
import { PaginationKeys } from "../../../enums/nycbsPharmaOrder";

export const handleEndIndexOfTable = (
  endIndex: number,
  ordersData: any[] | null,
  pageData: any,
  finalLimitToUse: number,
  setEndIndex: (index: number) => void,
  setBatchNumberRetreived: (callback: (prev: number[]) => number[]) => void,
  setTableDataForContext: (name: string, data: any) => void,
) => {
  setEndIndex(endIndex);
  if (
    ordersData &&
    pageData?.[PaginationKeys.TotalCount] !== null &&
    endIndex < (pageData?.[PaginationKeys.TotalCount] ?? 0) - 1 &&
    endIndex === ordersData.length - 1
  ) {
    const nextBatchFetch = Math.round(ordersData.length / finalLimitToUse);
    if (nextBatchFetch > 0) {
      setBatchNumberRetreived((prevBatchNumberRetrieved) => {
        if (!prevBatchNumberRetrieved.includes(nextBatchFetch)) {
          setTableDataForContext("allCmmOrders", {
            lastBatchFetched: nextBatchFetch,
          });
          return [...prevBatchNumberRetrieved, nextBatchFetch];
        }
        return prevBatchNumberRetrieved;
      });
    }
  }
};

export const handleRowExpandChangeFromTableBody = (
  expanded: boolean,
  id: string,
  tableDataForTable: any[],
  setTableDataForTable: (data: any[]) => void,
) => {
  const newTableData = tableDataForTable.map((row) =>
    row.id === id
      ? {
          ...row,
          expandableRowIcon: {
            ...row.expandableRowIcon,
            isExpanded: expanded,
          },
        }
      : {
          ...row,
          expandableRowIcon: {
            ...row.expandableRowIcon,
            isExpanded: false, // Close all other rows
          },
        },
  );
  setTableDataForTable(newTableData);
};

export const navigateToForm = (rowData: any, navigate: NavigateFunction) => {
  const docId = rowData["id"];
  navigate(`/pharma-pa-worklists/insurance-details/${docId}`);
};

// Clicking a patient row opens the two-pane Case Workspace: the patient's
// documents on the left, the AI-filled questionnaire (with confidence &
// reasoning) on the right.
export const navigateToCaseWorkspace = (
  rowData: any,
  navigate: NavigateFunction,
) => {
  const docId = rowData["id"] ?? rowData["identifier"] ?? rowData["case_id"];
  navigate(`/pharma-pa-worklists/pharma-pa-case/${docId}`);
};
