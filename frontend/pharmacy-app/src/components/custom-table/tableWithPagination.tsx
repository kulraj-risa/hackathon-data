import React from "react";
import { SpinningLoader } from "risa-oasis-ui_v2";
import Pagination from "../pagination/pagination";
import { CellData } from "./table";
import TableBody from "./tableBody";

interface TableWithPaginationProps {
  tableName: string;
  sortedTableHeaders: any[];
  computedCellData: CellData[][];
  tableDataToRender: any[];
  tableWidth: number;
  onSortTableData: (key: string, subKey?: string, type?: string) => void;
  onRowClick: (tableData: any[], rowIndex: number, className: string) => void;
  onAssignToClick?: (data: any) => void;
  onStatusClick?: (data: any) => void;
  onDeleteIconClick?: (data: any) => void;
  hidePagination?: boolean;
  count?: number;
  itemsPerPage?: number;
  pagesPerView?: number;
  handlePageChange: (startIndex: number, endIndex: number, data: any[]) => void;
  triggerHandlePageChange: number;
  paginationData: React.ReactNode;
  onClickableTextWithDisabledStatusClick?: (data: any) => void;
  showInLineLoader?: boolean;
  onComplete?: () => void;
  onSelectAll?: () => void;
  toggleCheckboxSelection?: (id: string) => void;
  handleDownloadButtonClick?: (id: string) => void;
  onTableRowUpdate?: (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => void;
  startIndex?: number;
  isPreviousButtonDisabled?: boolean;
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
  isCheckboxSelected?: boolean;
  isExpandableRowTable?: boolean;
  onButtonWithThreeDotsOptionClick?: (optionId: string, rowId: string) => void;
  scrollableWidth?: number;
}

const TableWithPagination: React.FC<TableWithPaginationProps> = (props) => {
  return (
    <>
      <div
        className={`table ${props.scrollableWidth ? "scrollable-table" : ""}`}
        style={{
          width: props.scrollableWidth ? `${props.scrollableWidth}%` : "100%",
          overflowX: "hidden",
        }}
      >
        <table key={props.tableName}>
          <TableBody
            computedCellData={props.computedCellData}
            tableDataToRender={props.tableDataToRender}
            tableWidth={props.tableWidth}
            onRowClick={props.onRowClick}
            onAssignToClick={props.onAssignToClick}
            onStatusClick={props.onStatusClick}
            onDeleteIconClick={props.onDeleteIconClick}
            onClickableTextWithDisabledStatusClick={
              props.onClickableTextWithDisabledStatusClick
            }
            onComplete={props.onComplete}
            toggleCheckboxSelection={props.toggleCheckboxSelection}
            handleDownloadButtonClick={props.handleDownloadButtonClick}
            onTableRowUpdate={props.onTableRowUpdate}
            startIndex={props.startIndex}
            onSideModalClose={props.onSideModalClose}
            onChangeEmit={props.onChangeEmit}
            onPropagateEventOnClickInRpaStatusCell={
              props.onPropagateEventOnClickInRpaStatusCell
            }
            onPropagateEventOnClickInRpaStatusTwoCell={
              props.onPropagateEventOnClickInRpaStatusTwoCell
            }
            onValueChangeOfTextField={props.onValueChangeOfTextField}
            onExpandableRowIconClick={
              props.onPropagateEventOnClickInRpaStatusTwoCell
            }
            expandableRowContent={props.expandableRowContent}
            onRowExpansionChangeFromTableBody={
              props.onRowExpansionChangeFromTableBody
            }
            sortedTableHeaders={props.sortedTableHeaders}
            isExpandableRowTable={props.isExpandableRowTable}
            onButtonWithThreeDotsOptionClick={
              props.onButtonWithThreeDotsOptionClick
            }
            scrollableWidth={props.scrollableWidth ?? 100}
          />
        </table>
      </div>
      {props.showInLineLoader && (
        <div className="table-loader mb-4 mr-4 flex items-center justify-end gap-2 text-small font-regular">
          <SpinningLoader />
          Loading Data ...
        </div>
      )}
      {!props.hidePagination && (
        <div
          className="table-pagination mt-4"
          style={{
            width: props.scrollableWidth ? `${props.scrollableWidth}%` : "100%",
          }}
        >
          {(props.count ?? 0) > 0 && (
            <>
              <Pagination
                itemsCount={props.count ?? 0}
                itemsPerPage={props.itemsPerPage ?? 0}
                pagesPerView={props.pagesPerView ?? 0}
                sendStartAndEndIndex={props.handlePageChange}
                triggerHandlePageChange={props.triggerHandlePageChange}
                tableName={props.tableName}
                isPreviousButtonDisabled={props.isPreviousButtonDisabled}
              />
              <div className="pagination-details">{props.paginationData}</div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default TableWithPagination;
