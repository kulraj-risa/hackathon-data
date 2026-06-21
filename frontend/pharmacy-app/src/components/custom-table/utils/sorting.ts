import moment from "moment";

export function sortTableHeadersByOrder(headers) {
  return [...headers].sort((a, b) => a.order - b.order);
}

export const sortTableData = (
  key: string,
  subKey: string | undefined,
  tableDataToRender: any[],
  sortAscending: boolean,
  setTableDataToRender: React.Dispatch<React.SetStateAction<any[]>>,
  setSortAscending: React.Dispatch<React.SetStateAction<boolean>>,
  startIndex: number,
  endIndex: number,
  handlePageChange: (start: number, end: number, data: any[]) => void,
  type?: string,
) => {
  const sortedArrayData = [...tableDataToRender].sort((a, b) => {
    const getValue = (item: any) => (subKey ? item[key][subKey] : item[key]);
    const valA = getValue(a);
    const valB = getValue(b);

    if (type === "date") {
      const dateA = parseMDYString(moment(valA).format("MM/DD/YYYY"));
      const dateB = parseMDYString(moment(valB).format("MM/DD/YYYY"));
      return sortAscending
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    const isNumeric = (val: any) => /^-?\d+(\.\d+)?$/.test(val);

    if (isNumeric(valA) && isNumeric(valB)) {
      return sortAscending
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }

    return sortAscending
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  setTableDataToRender((prevData) => {
    const updatedTableData = [...sortedArrayData];
    handlePageChange(startIndex, endIndex, updatedTableData);
    return updatedTableData;
  });

  setSortAscending(!sortAscending);
};

function parseMDYString(dateStr: string): Date {
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}
