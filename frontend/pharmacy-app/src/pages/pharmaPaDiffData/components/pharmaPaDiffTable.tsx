import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { openModal } from "risa-oasis-ui_v2";
import { getFileDownloadUrl } from "../../../api/firebase/firestoreService";
import CustomTable from "../../../components/custom-table/custom-table";
import ViewCommentModal from "../../../components/modals/viewComment/viewCommentModal";
import { PHARMA_PA_DIFF_TABLE_DOC_SIZE } from "../../../constants/medicalPAbatch";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { FilterSection, FilterValues } from "../../../data-model/filterValues";
import { CmmDocType } from "../../../enums/cmmDocTypes";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import {
  fetchCmmFormDiffTableData,
  fetchCmmFormDiffTableDataAfterSearch,
  fetchMorefetchCmmFormDiffTableData,
} from "../../../redux/slice/cmm/cmmFormDiffTableDataSlice";
import { setFilter } from "../../../redux/slice/filterValuesSlice";
import { fetchSingleOrderDocs } from "../../../redux/slice/nycbsPharmaExternal/nycbsDocumentsSlice";
import { AppDispatch, RootState } from "../../../redux/store/store";
import { getItemFromLocalStorage } from "../../../utils/localStorageHelper";
import {
  createFilterForDateOfService,
  createFilterForDrugName,
  createFilterForFormName,
  createFilterForStatus,
  diffTableColumnHeaders,
  generateTableDataForCmmFormDiffTable,
} from "../utils/diffTableDataCreation";

const PharmaPaDiffTable = ({
  pharmaPaDiffTableRef,
}: {
  pharmaPaDiffTableRef: React.RefObject<HTMLDivElement>;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [viewCommentModal, setViewCommentModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [isTableRefActive, setIsTableRefActive] = useState(false);
  const [endIndex, setEndIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [filterData, setFilterData] = useState<FilterSection[]>([]);

  const navigate = useNavigate();
  const {
    data,
    loading,
    currentlyLoadedCount,
    totalDocuments,
    showinLineLoader,
  } = useSelector((state: RootState) => state.cmmFormDiffTableData);

  const { filters } = useSelector((state: RootState) => state.filterValues);
  const [searchText, setSearchText] = useState("");
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [currentComment, setCurrentComment] = useState<string>("");

  const { currentData, loading: cmmDiffLoading } = useSelector(
    (state: RootState) => state.cmmDiffData,
  );

  const selectedOrganization =
    getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";

  const { data: singleOrderDocs, loading: singleOrderDocsLoading } =
    useSelector((state: RootState) => state.nycbsDocuments);

  const [tableData, setTableData] = useState<any[]>([]);

  const { getTableDataFromContext, setTableDataForContext } =
    useTablesContext();
  const tableAttributes = getTableDataFromContext("pharmaPaDiffTable");

  const computedPageSize = useMemo(() => {
    const isLastBatchFetchedIsGreaterThanZero =
      tableAttributes?.lastBatchFetched &&
      tableAttributes?.lastBatchFetched > 0;
    const pageSize = isLastBatchFetchedIsGreaterThanZero
      ? (tableAttributes?.lastBatchFetched ?? 1) * PHARMA_PA_DIFF_TABLE_DOC_SIZE
      : PHARMA_PA_DIFF_TABLE_DOC_SIZE;
    return pageSize;
  }, [tableAttributes]);

  const handleEndIndexOfTable = (endIndex: number) => {
    const batchNumber = Math.ceil(
      currentlyLoadedCount / PHARMA_PA_DIFF_TABLE_DOC_SIZE,
    );
    setTableDataForContext("pharmaPaDiffTable", {
      lastBatchFetched: batchNumber,
    });
    setEndIndex(endIndex);
  };

  const hasMoreData = useMemo(() => {
    if (
      endIndex === currentlyLoadedCount - 1 &&
      currentlyLoadedCount < totalDocuments
    ) {
      return true;
    }
    return false;
  }, [endIndex, totalDocuments, currentlyLoadedCount]);

  const handleRefreshButtonClick = () => {
    if (searchText === "") {
      dispatch(fetchCmmFormDiffTableData(computedPageSize));
    } else {
      dispatch(fetchCmmFormDiffTableDataAfterSearch(searchText));
    }
  };

  useEffect(() => {
    if (isTableRefActive) {
      if (searchText && searchText.trim().length > 0) {
        dispatch(fetchCmmFormDiffTableDataAfterSearch(searchText));
      } else {
        dispatch(fetchCmmFormDiffTableData(computedPageSize));
      }
    }
  }, [searchText, isTableRefActive, selectedOrganization]);

  useEffect(() => {
    if (hasMoreData) {
      dispatch(
        fetchMorefetchCmmFormDiffTableData(PHARMA_PA_DIFF_TABLE_DOC_SIZE),
      );
    }
  }, [hasMoreData]);

  useEffect(() => {
    if (viewCommentModal) {
      openModal("view-comment-modal");
    }
  }, [viewCommentModal]);

  useEffect(() => {
    if (!loading && data) {
      data.length > 0
        ? setTableData(generateTableDataForCmmFormDiffTable(data))
        : setTableData([]);
    } else {
      setTableData([]);
    }
  }, [data, loading]);

  useEffect(() => {
    if (pharmaPaDiffTableRef.current) {
      setIsTableRefActive(true);
    }
  }, [pharmaPaDiffTableRef]);

  const getLatestDocDownloadUrlOfRequiredDocType = async (
    docType: CmmDocType,
  ) => {
    const docs = singleOrderDocs?.filter(
      (doc) => doc.document_type === docType,
    );

    if (docs && docs.length > 0) {
      const latestDoc = docs.sort(
        (a, b) =>
          new Date(b?.created_at ?? "").getTime() -
          new Date(a?.created_at ?? "").getTime(),
      )[0];

      const url = await getFileDownloadUrl(latestDoc?.file_path ?? "");
      return url;
    }

    return null;
  };

  useEffect(() => {
    const fetchUrl = async () => {
      if (data && data.length > 0) {
        const docType =
          currentStatus === "Denied"
            ? CmmDocType.DENIAL_LETTER
            : CmmDocType.APPROVAL_LETTER;

        const url = await getLatestDocDownloadUrlOfRequiredDocType(docType);
        if (url) {
          setPdfUrl(url);
        } else {
          setPdfUrl("");
        }
        setIsPdfLoading(false);
      }
    };
    if (
      !singleOrderDocsLoading &&
      singleOrderDocs &&
      singleOrderDocs.length > 0 &&
      currentStatus !== ""
    ) {
      fetchUrl();
    }
  }, [currentStatus, singleOrderDocsLoading, singleOrderDocs]);

  const validFilters = useMemo(() => {
    return filters.filter((filter) => filter.name === "pharmaPaDiffTable");
  }, [filters]);

  const isFilterApplied = useMemo(() => {
    return (
      validFilters &&
      validFilters.length > 0 &&
      validFilters?.[0]?.["filterCount"] > 0
    );
  }, [validFilters]);

  useEffect(() => {
    data &&
      data.length > 0 &&
      setFilterData([
        createFilterForFormName(),
        createFilterForDateOfService(),
        createFilterForStatus(),
        createFilterForDrugName(),
      ]);
  }, [data]);

  const handleFilterApply = (data: FilterValues) => {
    setFilterData(data as unknown as FilterSection[] | []);
    dispatch(setFilter(data));
  };

  return (
    <>
      <div ref={pharmaPaDiffTableRef} className="h-full">
        <CustomTable
          tableHeaders={diffTableColumnHeaders}
          endIndexOfTable={handleEndIndexOfTable}
          tableData={tableData}
          tableName={"pharmaPaDiffTable"}
          itemsPerPage={10}
          count={currentlyLoadedCount}
          totalCount={totalDocuments}
          onRowClick={(rowData) => {
            navigate(`/pharma-pa-diff-data/diff-data-viewer/${rowData.id}`);
          }}
          pagesPerView={4}
          hideSearchBar={false}
          searchingText={(text) => setSearchText(text)}
          onViewPharmaPaDiffCommentClick={(rowData) => {
            navigate(`/pharma-pa-diff-data/diff-data-viewer/${rowData.id}`);
          }}
          isFetching={loading}
          onViewCommentClick={(rowData) => {
            setCurrentStatus(rowData.pharmaPaDiffStatusString);
            setCurrentComment(rowData.pharmaPaDiffCommentString);
            setViewCommentModal(true);
            dispatch(fetchSingleOrderDocs(rowData.id));
            setIsPdfLoading(true);
          }}
          showInLineLoader={showinLineLoader}
          showRefreshButton={true}
          onRefreshButton={handleRefreshButtonClick}
          isDisabled={loading}
          showFilterButton={false}
          filterSectionsData={filterData}
          onFilterApplyClicked={handleFilterApply}
          isFilterApplied={isFilterApplied}
        />
      </div>
      {viewCommentModal && (
        <ViewCommentModal
          onClose={() => {
            setViewCommentModal(false);
            setPdfUrl("");
            setIsPdfLoading(false);
            setCurrentStatus("");
            setCurrentComment("");
          }}
          comment={currentComment}
          isLoading={cmmDiffLoading}
          status={currentStatus}
          pdfUrl={pdfUrl ?? ""}
          isPdfLoading={singleOrderDocsLoading || isPdfLoading}
        />
      )}
    </>
  );
};

export default PharmaPaDiffTable;
