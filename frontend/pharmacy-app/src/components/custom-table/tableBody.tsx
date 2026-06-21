import React, { useCallback } from "react";
import { CellData } from "./table";
import { TableCell } from "./tableCell/tableCell";

interface TableBodyProps {
  computedCellData: CellData[][];
  tableDataToRender: any[];
  tableWidth: number;
  onRowClick: (tableData: any[], rowIndex: number, className: string) => void;
  onAssignToClick?: (data: any) => void;
  onStatusClick?: (data: any) => void;
  onDeleteIconClick?: (data: any) => void;
  onClickableTextWithDisabledStatusClick?: (data: any) => void;
  onComplete?: () => void;
  toggleCheckboxSelection?: (id: string) => void;
  handleDownloadButtonClick?: (id: string) => void;
  onValueChange?: (value: string) => void;
  onTableRowUpdate?: (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => void;
  startIndex?: number;
  onSideModalClose?: () => void;
  onChangeEmit?: (data: {
    name: string;
    required: boolean;
    value: boolean;
  }) => void;
  onPropagateEventOnClickInRpaStatusCell?: (id: string) => void;
  onPropagateEventOnClickInRpaStatusTwoCell?: (id: string) => void;
  onValueChangeOfTextField?: (value: string, id: string) => void;
  onExpandableRowIconClick?: (id: string) => void;
  expandableRowContent?: (rowData: any, rowIndex: number) => React.ReactNode;
  onRowExpansionChangeFromTableBody?: (expanded: boolean, id: string) => void;
  sortedTableHeaders?: any[]; // Add this to get column count for colSpan
  isExpandableRowTable?: boolean;
  onButtonWithThreeDotsOptionClick?: (optionId: string, rowId: string) => void;
  scrollableWidth?: number;
}

const TableBody: React.FC<TableBodyProps> = ({
  computedCellData,
  tableDataToRender,
  tableWidth,
  onRowClick,
  onAssignToClick,
  onStatusClick,
  onDeleteIconClick,
  onClickableTextWithDisabledStatusClick,
  onComplete,
  toggleCheckboxSelection,
  handleDownloadButtonClick,
  onTableRowUpdate,
  onValueChange,
  startIndex,
  onSideModalClose,
  onChangeEmit,
  onPropagateEventOnClickInRpaStatusCell,
  onPropagateEventOnClickInRpaStatusTwoCell,
  onValueChangeOfTextField,
  onExpandableRowIconClick,
  expandableRowContent,
  onRowExpansionChangeFromTableBody,
  sortedTableHeaders,
  isExpandableRowTable,
  onButtonWithThreeDotsOptionClick,
  scrollableWidth,
}) => {
  const isRowExpanded = useCallback(
    (rowIndex: number): boolean => {
      const actualRowIndex = rowIndex + (startIndex ?? 0);
      const rowData = tableDataToRender[actualRowIndex];
      return rowData?.expandableRowIcon?.isExpanded ?? false;
    },
    [tableDataToRender, startIndex],
  );

  const handleTableRowUpdate = (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => {
    onTableRowUpdate?.(rowIndex, fieldKey, newValue);
  };

  const onRowExpansionChange = (
    expanded: boolean,
    id: string,
    rowIndex: number,
  ) => {
    onRowExpansionChangeFromTableBody?.(expanded, id);
  };

  const handleValueChange = (value: string) => {
    onValueChange?.(value);
  };

  const columnCount =
    computedCellData[0]?.length || sortedTableHeaders?.length || 1;

  return (
    <tbody>
      {!isExpandableRowTable ? (
        <>
          {computedCellData.map((rowData, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                display: "flex",
                width: scrollableWidth ? `${scrollableWidth}%` : "100%",
              }}
            >
              {rowData.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`table-cell ${cell.type}__${cell.header}`}
                  style={{
                    width: `${cell?.width}%`,
                  }}
                  onClick={() =>
                    onRowClick(
                      tableDataToRender,
                      rowIndex,
                      `table-cell ${cell.type}__${cell.header}`,
                    )
                  }
                >
                  <TableCell
                    type={cell.type}
                    id={cell.rowData?.id}
                    value={cell.value}
                    header={cell.header}
                    rowIndex={rowIndex}
                    globalRowIndex={
                      startIndex ? startIndex + rowIndex : rowIndex
                    }
                    rowData={cell.rowData}
                    handleAssignToClick={onAssignToClick}
                    handleStatusClick={onStatusClick}
                    handleDeleteIconClick={onDeleteIconClick}
                    handleClickableTextWithDisabledStatusClick={
                      onClickableTextWithDisabledStatusClick
                    }
                    onComplete={onComplete}
                    toggleCheckboxSelection={toggleCheckboxSelection}
                    handleDownloadButtonClick={handleDownloadButtonClick}
                    onTableRowUpdate={handleTableRowUpdate}
                    onValueChange={handleValueChange}
                    onSideModalClose={onSideModalClose}
                    onChangeEmit={onChangeEmit}
                    onPropagateEventOnClickInRpaStatusCell={
                      onPropagateEventOnClickInRpaStatusCell
                    }
                    onValueChangeOfTextField={onValueChangeOfTextField}
                    onButtonWithThreeDotsOptionClick={
                      onButtonWithThreeDotsOptionClick
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </>
      ) : (
        <>
          {computedCellData.map((rowData, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Main row with table cells */}
              <tr
                style={{ display: "block", width: "100%" }}
                className={isRowExpanded(rowIndex) ? "expanded-row" : ""}
              >
                <td
                  colSpan={columnCount}
                  style={{
                    padding: 0,
                    border: "none",
                    display: "block",
                    width: "100%",
                  }}
                >
                  <div
                    style={{ display: "flex", width: "100%" }}
                    className={`${isRowExpanded(rowIndex) ? "single-row--container shadow" : "single-row--container"}`}
                  >
                    {rowData.map((cell, cellIndex) => (
                      <div
                        key={cellIndex}
                        className={`table-cell ${cell.type}__${cell.header} ${isRowExpanded(rowIndex) ? "expanded" : ""}`}
                        style={{
                          width: `${cell?.width}%`,
                          padding: "0.75rem 0.75rem",
                          textAlign: "left",
                          borderBottom: `${rowIndex === computedCellData.length - 1 ? "none" : "1px solid #e5e7eb"}`,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          ...(cellIndex === 0
                            ? {
                                position: "sticky" as const,
                                left: 0,
                                zIndex: 1,
                              }
                            : {}),
                        }}
                        onClick={() =>
                          onRowClick(
                            tableDataToRender,
                            rowIndex,
                            `table-cell ${cell.type}__${cell.header}`,
                          )
                        }
                      >
                        <TableCell
                          type={cell.type}
                          id={cell.rowData?.id}
                          value={cell.value}
                          header={cell.header}
                          rowIndex={rowIndex}
                          globalRowIndex={
                            startIndex ? startIndex + rowIndex : rowIndex
                          }
                          rowData={cell.rowData}
                          handleAssignToClick={onAssignToClick}
                          handleStatusClick={onStatusClick}
                          handleDeleteIconClick={onDeleteIconClick}
                          handleClickableTextWithDisabledStatusClick={
                            onClickableTextWithDisabledStatusClick
                          }
                          onComplete={onComplete}
                          toggleCheckboxSelection={toggleCheckboxSelection}
                          handleDownloadButtonClick={handleDownloadButtonClick}
                          onTableRowUpdate={handleTableRowUpdate}
                          onValueChange={handleValueChange}
                          onSideModalClose={onSideModalClose}
                          onChangeEmit={onChangeEmit}
                          onPropagateEventOnClickInRpaStatusCell={
                            onPropagateEventOnClickInRpaStatusCell
                          }
                          onPropagateEventOnClickInRpaStatusTwoCell={
                            onPropagateEventOnClickInRpaStatusTwoCell
                          }
                          onRowExpandChange={(expanded, id) => {
                            onRowExpansionChange(expanded, id, rowIndex);
                          }}
                          onButtonWithThreeDotsOptionClick={
                            onButtonWithThreeDotsOptionClick
                          }
                        />
                      </div>
                    ))}
                  </div>
                </td>
              </tr>

              {/* Expandable content row */}
              {expandableRowContent && isRowExpanded(rowIndex) && (
                <tr
                  style={{
                    display: "block",
                    width: "100%",
                    borderLeft: `4px solid ${tableDataToRender[rowIndex + (startIndex ?? 0)]?.expandableRowIcon?.borderColor}`,
                  }}
                >
                  <td
                    colSpan={columnCount}
                    style={{
                      padding: 0,
                      border: "none",
                      display: "block",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        overflow: "auto",
                        padding: "0.5rem 1rem 0.5rem 3%",
                        borderBottom: `${rowIndex === computedCellData.length - 1 ? "none" : "1px solid #e5e7eb"}`,
                        marginTop: "2px",
                        marginBottom: "2px",
                      }}
                      className={`${isRowExpanded(rowIndex) ? "slide-down" : "slide-up"}`}
                    >
                      {typeof expandableRowContent === "function" &&
                        expandableRowContent(
                          tableDataToRender[rowIndex + (startIndex ?? 0)],
                          rowIndex + (startIndex ?? 0),
                        )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </>
      )}
    </tbody>
  );
};

export default TableBody;
