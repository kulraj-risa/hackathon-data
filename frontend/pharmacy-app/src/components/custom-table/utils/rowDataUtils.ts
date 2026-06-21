export function transformRowData(rowData, sortedTableHeaders) {
  return sortedTableHeaders.map((header) => {
    const key = header.key;
    let value = rowData[key] !== undefined ? rowData[key] : "";

    if (
      header.subKey &&
      value &&
      typeof value === "object" &&
      header.type === "string"
    ) {
      value = value[header.subKey] !== undefined ? value[header.subKey] : "";
    }

    return {
      value,
      type: header.type,
      width: header.width,
      header: key,
      rowData: rowData,
      fieldKey: key,
      originalRowData: rowData,
    };
  });
}

export function getRowDataToPass(tableData, rowIndex, startIndex) {
  const rowDataToPassIndex = rowIndex + startIndex;
  const rowDataToPass = tableData[rowDataToPassIndex];
  return rowDataToPass;
}
