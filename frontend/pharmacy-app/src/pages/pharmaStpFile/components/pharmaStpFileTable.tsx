import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import CustomTable from "../../../components/custom-table/custom-table";
import UploadTextNotesModal from "../../../components/modals/uploadTextNotesModal/uploadTextNotesModal";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { FilterSection, FilterValues } from "../../../data-model/filterValues";
import { TableNames } from "../../../enums/tableNames";
import { useModalOpener } from "../../../hooks/useModalOpener";
import { setFilter } from "../../../redux/slice/filterValuesSlice";
import { AppDispatch } from "../../../redux/store/store";
import { handleOpenSubmissionSummary } from "../actionHandlers/openSubmissionSummaryHandler";
import { useFilterAndSearch } from "../hooks/useFilterAndSearch";
import { useInitialDataFetchingForTable } from "../hooks/useInitialDataFetchingForTable";
import { useNextPageDataFetch } from "../hooks/useNextPageDataFetch";
import { usePharmaStpFileTableData } from "../hooks/usePharmaStpFileTableData";
import {
  generateTableDataForPharmaStpFileTable,
  PharmaStpFileTableHeader,
} from "../table/pharmaStpFileTableData";
import { createAllFilterSections } from "../utils/createFilterSections";

const PharmaStpFileTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { getTableDataFromContext, setTableDataForContext } =
    useTablesContext();

  useModalOpener();

  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const startDate = "20100101";
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const endDate = `${year}${month}${lastDay}`;
    return { startDate, endDate };
  };

  const { startDate, endDate } = getCurrentMonthDateRange();
  const pageSize = 120;

  const [filterData, setFilterData] = useState<FilterSection[]>([]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "text-note" | "track-status" | "send-sftp" | null;
  }>({
    isOpen: false,
    type: null,
  });

  const { pharmaStpFileState, setPharmaStpFileState, tableData, setTableData } =
    usePharmaStpFileTableData();

  const { initialDataFetchingExecuted, setInitialDataFetchingExecuted } =
    useInitialDataFetchingForTable(
      setPharmaStpFileState,
      setTableData,
      startDate,
      endDate,
      pageSize,
    );

  const {
    filterPayload,
    paginationResetCount,
    setSearchTerm,
    searchTerm,
    validFilters,
  } = useFilterAndSearch(
    initialDataFetchingExecuted,
    setTableData,
    setPharmaStpFileState,
    startDate,
    endDate,
    pageSize,
  );

  const { setEndIndex } = useNextPageDataFetch(
    validFilters,
    searchTerm,
    initialDataFetchingExecuted,
    pharmaStpFileState,
    setPharmaStpFileState,
    setTableData,
    startDate,
    endDate,
    pageSize,
  );

  const [allStpFileOrdersTableData, setAllStpFileOrdersTableData] = useState<
    any[]
  >([]);

  useEffect(() => {
    const formattedTableData = generateTableDataForPharmaStpFileTable(
      tableData,
      dispatch,
    );
    setAllStpFileOrdersTableData(formattedTableData);
  }, [tableData, dispatch]);

  const handleSearch = (searchText: string) => {
    setSearchTerm(searchText);
  };

  const handleRefresh = () => {
    setInitialDataFetchingExecuted(false);
  };

  const navigateToForm = (rowData: any) => {
    console.log("Row clicked:", rowData);
    // navigate(`/pharma-pa-stp-file/details/${rowData.cmmId}`);
  };

  const openModal = (type: "text-note" | "track-status" | "send-sftp") => {
    setModalState({ isOpen: true, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  const handleAddKeyButtonClick = (rowData: any) => {
    handleOpenSubmissionSummary(dispatch, rowData);
  };

  useEffect(() => {
    if (tableData && tableData.length > 0) {
      const filters = createAllFilterSections(tableData);
      setFilterData(filters);
    }
  }, [tableData]);

  const handleFilterApply = (data: FilterValues) => {
    dispatch(setFilter(data));
  };

  // Watch for shouldRefetch flag from context
  const tableContextData = getTableDataFromContext(
    TableNames.PHARMA_STP_FILE_ORDERS,
  );

  useEffect(() => {
    if (tableContextData?.shouldRefetch) {
      // Trigger refetch
      setInitialDataFetchingExecuted(false);
      // Reset the flag
      setTableDataForContext(TableNames.PHARMA_STP_FILE_ORDERS, {
        shouldRefetch: false,
      });
    }
  }, [
    tableContextData?.shouldRefetch,
    setInitialDataFetchingExecuted,
    setTableDataForContext,
  ]);

  if (pharmaStpFileState.error) {
    console.error("Error fetching STP file data:", pharmaStpFileState.error);
  }

  return (
    <>
      <CustomTable
        tableHeaders={PharmaStpFileTableHeader}
        tableData={allStpFileOrdersTableData}
        itemsPerPage={10}
        pagesPerView={4}
        count={allStpFileOrdersTableData.length}
        totalCount={pharmaStpFileState.data?.total_count ?? 0}
        isFetching={pharmaStpFileState.loading}
        tableName={TableNames.PHARMA_STP_FILE_ORDERS}
        searchingText={handleSearch}
        onReviewButtonClick={(data) => navigateToForm(data)}
        onRefreshButton={handleRefresh}
        onRowClick={(data) => navigateToForm(data)}
        isDisabled={pharmaStpFileState.loading}
        showRefreshButton={true}
        showFilterButton={true}
        filterSectionsData={filterData}
        onFilterApplyClicked={handleFilterApply}
        showOtherButton={true}
        otherButtonMeta={[
          {
            text: "Upload Outcome to EMR",
            onClick: () => openModal("text-note"),
            disabled: pharmaStpFileState.loading,
            buttonType: "secondary",
            size: "medium",
          },
          {
            text: "Track Status",
            onClick: () => openModal("track-status"),
            disabled: pharmaStpFileState.loading,
            buttonType: "secondary",
            size: "medium",
          },
          {
            text: "Submit file",
            onClick: () => openModal("send-sftp"),
            disabled: pharmaStpFileState.loading,
            buttonType: "primary",
            size: "medium",
          },
        ]}
        endIndexOfTable={setEndIndex}
        requestForPaginationReset={paginationResetCount}
        showInLineLoader={pharmaStpFileState.showInlineLoader}
        onAddKeyButtonClick={handleAddKeyButtonClick}
      />
      {modalState.isOpen && modalState.type && (
        <UploadTextNotesModal
          onClose={closeModal}
          modalType={modalState.type}
        />
      )}
    </>
  );
};

export default PharmaStpFileTable;
