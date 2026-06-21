import { useEffect, useMemo, useRef, useState } from "react";
import {
  TableData,
  useTablesContext,
} from "../../context/tablesContextProvider";
import { CustomTableProps } from "../../data-model/customTableModel";
import { LoaderMessage } from "../loaderMessage/loaderMessage";
import NoData from "../noData/noData";
import { CellData } from "./table";
import TableActions from "./tableActions";
import TableWithPagination from "./tableWithPagination";
import { handleRowClickAction } from "./utils/handleRowClickAction";
import { transformRowData } from "./utils/rowDataUtils";
import { sortTableData, sortTableHeadersByOrder } from "./utils/sorting";
import updateTableDataToRender from "./utils/updateTableDataToRender";

function CustomTable(props: CustomTableProps) {
  const [computedCellData, setComputedCellData] = useState<CellData[][]>([]);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [endIndex, setEndIndex] = useState<number>(
    props?.itemsPerPage ? props.itemsPerPage - 1 : 0,
  );
  const [tableDataToRender, setTableDataToRender] = useState<any[]>([]);
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [tableWidth, setTableWidth] = useState(0);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [numberOfTimesSearchPerformed, setNumberOfTimesSearchPerformed] =
    useState<number>(0);
  const [appliedFilters, setAppliedFilters] = useState<
    { key: string; value: string; section: string }[]
  >([]);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const defaultValueRef = useRef<string | null>(null);
  const { getTableDataFromContext: getTableData, setTableDataForContext } =
    useTablesContext();
  const tableAttributes = getTableData(props?.tableName);

  useEffect(() => {
    const dataToRender = updateTableDataToRender(
      searchResults,
      tableAttributes as TableData,
      props?.itemsPerPage ?? 0,
      handlePageChange,
    );
    setTableDataToRender(dataToRender);
  }, [JSON.stringify(searchResults), JSON.stringify(tableAttributes)]);

  useEffect(() => {
    if (props.tableData) {
      setSearchResults(props.tableData as any[]);
    }
  }, [JSON.stringify(props.tableData)]);

  useEffect(() => {
    if (tableRef.current) {
      setTableWidth(tableRef.current.offsetWidth);
    }
  }, [tableRef.current]);

  useEffect(() => {
    const searchedTextFromContext = tableAttributes?.searchedText ?? null;
    defaultValueRef.current = searchedTextFromContext;
    props.searchingText && props.searchingText(defaultValueRef?.current ?? "");
  }, [props.tableName]);

  const onRowClick = (tableData: any, rowIndex: number, className: string) => {
    if (props.disableHoverAndClick) return;
    handleRowClickAction(tableData, rowIndex, className, startIndex, {
      onReviewButtonClick: props.onReviewButtonClick,
      onPatientDetailsClick: props.onPatientDetailsClick,
      onRowClick: props.onRowClick,
      onReportPrescriptionClick: props.onReportPrescriptionClick,
      onDeleteIconClick: props.onDeleteIconClick,
      onClickableTextWithDisabledStatusClick:
        props.onClickableTextWithDisabledStatusClick,
      onReRunOncoEmrClick: props.onReRunOncoEmrClick,
      onReRunCmmClick: props.onReRunCmmClick,
      onViewCmmClick: props.onViewCmmClick,
      onViewPharmaPaDiffCommentClick: props.onViewPharmaPaDiffCommentClick,
      onViewCommentClick: props.onViewCommentClick,
      handleDownloadButtonClick: props.handleDownloadButtonClick,
      onAddKeyButtonClick: props.onAddKeyButtonClick,
    });
  };

  const handleTableRowUpdate = (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => {
    const actualGlobalRowIndex = startIndex + rowIndex;

    setSearchResults((prevData) => {
      const updatedData = [...prevData];
      if (updatedData[actualGlobalRowIndex]) {
        updatedData[actualGlobalRowIndex] = {
          ...updatedData[actualGlobalRowIndex],
          [fieldKey]: newValue,
        };
      }
      return updatedData;
    });

    setTableDataToRender((prevData) => {
      const updatedData = [...prevData];
      if (updatedData[rowIndex]) {
        updatedData[rowIndex] = {
          ...updatedData[rowIndex],
          [fieldKey]: newValue,
        };
      }
      return updatedData;
    });

    // Call the prop function if it exists
    props.onTableRowUpdate?.(rowIndex, fieldKey, newValue);
  };

  function handlePageChange(start, end, data: any[]) {
    if (!data || data.length === 0) return;

    const validStart = Math.max(0, start);
    const validEnd = Math.min(end, data.length - 1);

    setStartIndex(validStart);
    setEndIndex(validEnd);

    if (validEnd >= validStart) {
      props.endIndexOfTable && props.endIndexOfTable(validEnd);
    }

    props.startIndexOfTable && props.startIndexOfTable(validStart);

    setComputedCellData(
      data
        .slice(validStart, validEnd + 1)
        .map((rowData) => transformRowData(rowData, sortedTableHeaders)),
    );
  }

  const onSortTableData = (key: string, subKey?: string, type?: string) => {
    setTableDataForContext(props.tableName, {
      sortByKey: key,
      sortBySubKey: subKey,
      sortAscending: !sortAscending,
    });
    sortTableData(
      key,
      subKey,
      searchResults,
      sortAscending,
      setSearchResults,
      setSortAscending,
      startIndex,
      endIndex,
      handlePageChange,
      type,
    );
  };

  const onSearchClicked = (searchText) => {
    setNumberOfTimesSearchPerformed((prev) => prev + 1);
    setTableDataForContext(props.tableName, {
      searchedText: searchText,
    });
    props?.searchingText && props.searchingText(searchText);
  };

  const sortedTableHeaders = sortTableHeadersByOrder(props.tableHeaders);
  const countToDisplay = props.totalCount ?? props.count;

  const paginationData = useMemo(() => {
    if (countToDisplay === 0) {
      return "Gathering metadata...";
    } else {
      return props?.isFilterApplied
        ? `Filtered ${props.count ?? 0} items out of ${countToDisplay} items`
        : `Showing ${startIndex + 1} - ${Math.min(endIndex + 1, searchResults.length)} of ${countToDisplay} items`;
    }
  }, [
    countToDisplay,
    props.isFilterApplied,
    props.count,
    startIndex,
    endIndex,
    searchResults.length,
  ]);

  return (
    <div className="table-container" ref={tableContainerRef}>
      <>
        <TableActions
          onSearchClicked={onSearchClicked}
          onRefreshButton={props.onRefreshButton}
          tableName={props.tableName}
          defaultValueRef={defaultValueRef}
          showFilterButton={props.showFilterButton}
          hideSearchBar={props.hideSearchBar}
          filterSectionsData={props.filterSectionsData}
          onFilterApplyClicked={props.onFilterApplyClicked}
          showExportButton={props.showExportButton}
          onExportButtonClick={props.onExportButtonClick}
          showRefreshButton={props.showRefreshButton}
          onBulkAssignButtonClick={props.onBulkAssignButtonClick}
          showBulkAssignButton={props.showBulkAssignButton}
          bulkAssignButtonDisabled={props.bulkAssignButtonDisabled}
          bulkAssignButtonText={props.bulkAssignButtonText}
          onRefetchPAOrderButtonClick={props.onRefetchPAOrderButtonClick}
          showRefetchPAOrderButton={props.showRefetchPAOrderButton}
          refetchPAOrderButtonDisabled={props.refetchPAOrderButtonDisabled}
          refetchPAOrderButtonText={props.refetchPAOrderButtonText}
          isRefetchingPAOrder={props.isRefetchingPAOrder}
          isDisabled={props.isDisabled}
          tableWidth={tableWidth}
          onSortTableData={onSortTableData}
          sortedTableHeaders={sortedTableHeaders}
          onSelectAll={props.onSelectAll}
          tableDataLength={
            props.tableData?.length && props.isFetching
              ? 0
              : props.tableData?.length
          }
          exportingInProgress={props.exportingInProgress}
          placeholder={props.placeholder}
          showOtherButton={props.showOtherButton}
          otherButtonMeta={props.otherButtonMeta}
          isCheckboxSelected={props.isCheckboxSelected ?? false}
          screenName={props?.screenName}
          shouldLogEvent={props?.shouldLogEvent ?? false}
          scrollableWidth={props.scrollableWidth}
        />
      </>

      {props.isFetching ? (
        <LoaderMessage message="Fetching Data ..." />
      ) : (
        <>
          {searchResults.length > 0 ? (
            <>
              {
                <TableWithPagination
                  tableName={props.tableName}
                  sortedTableHeaders={sortedTableHeaders}
                  computedCellData={computedCellData}
                  tableDataToRender={tableDataToRender}
                  tableWidth={tableWidth}
                  onSortTableData={onSortTableData}
                  onRowClick={onRowClick}
                  onAssignToClick={props.onAssignToClick}
                  onStatusClick={props.onStatusClick}
                  hidePagination={props.hidePagination}
                  count={props.count ?? undefined}
                  itemsPerPage={props.itemsPerPage}
                  pagesPerView={props.pagesPerView}
                  handlePageChange={handlePageChange}
                  triggerHandlePageChange={
                    numberOfTimesSearchPerformed +
                    (props.requestForPaginationReset ?? 0)
                  }
                  paginationData={paginationData}
                  onDeleteIconClick={props.onDeleteIconClick}
                  onClickableTextWithDisabledStatusClick={
                    props.onClickableTextWithDisabledStatusClick
                  }
                  showInLineLoader={props.showInLineLoader}
                  onComplete={props.onComplete}
                  onSelectAll={props.onSelectAll}
                  toggleCheckboxSelection={props.toggleCheckboxSelection}
                  handleDownloadButtonClick={props.handleDownloadButtonClick}
                  onTableRowUpdate={handleTableRowUpdate}
                  startIndex={startIndex}
                  isPreviousButtonDisabled={props.isPreviousButtonDisabled}
                  onSideModalClose={props.onSideModalClose}
                  onChangeEmit={props.onChangeEmit}
                  onPropagateEventOnClickInRpaStatusCell={
                    props.onPropagateEventOnClickInRpaStatusCell
                  }
                  onPropagateEventOnClickInRpaStatusTwoCell={
                    props.onPropagateEventOnClickInRpaStatusTwoCell
                  }
                  expandableRowContent={props.expandableRowContent}
                  onRowExpansionChangeFromTableBody={
                    props.onRowExpansionChangeFromTableBody
                  }
                  isCheckboxSelected={props.isCheckboxSelected}
                  isExpandableRowTable={props.isExpandableRowTable}
                  onButtonWithThreeDotsOptionClick={
                    props.onButtonWithThreeDotsOptionClick
                  }
                  scrollableWidth={props.scrollableWidth}
                  onValueChangeOfTextField={props.onValueChangeOfTextField}
                />
              }
            </>
          ) : (
            <NoData />
          )}
        </>
      )}
    </div>
  );
}

export default CustomTable;
