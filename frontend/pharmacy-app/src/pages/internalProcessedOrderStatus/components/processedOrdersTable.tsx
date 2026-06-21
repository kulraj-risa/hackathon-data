import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "risa-oasis-ui_v2";
import CustomTable from "../../../components/custom-table/custom-table";
import CmmInputViewerModal from "../../../components/modals/cmmInputViewerModal/cmmInputViewerModal";
import ReportPrescription from "../../../components/modals/reportPrescription/reportPrescription";
import ReRunOncoEmrModal from "../../../components/modals/reRunOncoEmrModal/reRunOncoEmrModal";
import { DOC_SIZE } from "../../../constants/medicalPAbatch";
import { useTablesContext } from "../../../context/tablesContextProvider";
import {
  CmmProcessedOrderModel,
  CmmProcessedResponseModel,
} from "../../../data-model/cmmProcessedOrderModel";
import { ReRunModalType } from "../../../enums/reRunModalType";
import {
  fetchcmmProcessedOrders,
  fetchCmmProcessedOrdersAfterSearch,
  fetchMoreCmmProcessedOrders,
  hasMoreDataToLoad,
} from "../../../redux/slice/cmm/cmmProcessedOrdersSlice";
import { AppDispatch, RootState } from "../../../redux/store/store";
import { getOrgIdForFetchExternalWorklist } from "../../../utils/organizationHelper";
import {
  generateProcessedOrdersTableData,
  ProcessOrdersTableHeader,
} from "../utils/generateProcessedOrdersTableData";
const ProcessedOrdersTable = ({
  processedOrdersTableRef,
}: {
  processedOrdersTableRef: React.RefObject<HTMLDivElement>;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    data,
    loading,
    error,
    appendingOrders,
    currentlyLoadedCount,
    totalDocuments,
    lastVisible,
  } = useSelector((state: RootState) => state.cmmProcessedOrders);

  const [tableData, setTableData] = useState<any[]>([]);
  const [endIndex, setEndIndex] = useState<number>(10);
  const [reRunOncoEmrModal, setReRunOncoEmrModal] = useState<boolean>(false);
  const [batchNumberRetreived, setBatchNumberRetreived] = useState<number[]>(
    [],
  );

  const [isTableRefActive, setIsTableRefActive] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reRunModalType, setReRunModalType] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [cmmInputModal, setCmmInputModal] = useState<boolean>(false);
  const [reportPrescriptionModal, setReportPrescriptionModal] =
    useState<boolean>(false);
  const { setTableDataForContext, getTableDataFromContext } =
    useTablesContext();
  const tableAttributes = getTableDataFromContext("processedOrders");

  const initialLimit = 100;
  const finalLimitToUse = useMemo(() => {
    const dataFromContext = tableAttributes.lastBatchFetched
      ? tableAttributes.lastBatchFetched
      : 0;
    return dataFromContext == 0
      ? initialLimit
      : (dataFromContext + 1) * initialLimit;
  }, []);

  const docSize = DOC_SIZE;

  // const fetchData = () => {
  //   const orgId = getOrgIdForFetchExternalWorklist();
  //   // dispatch(fetechCmmProcessOrdersFromDb(1, finalLimitToUse));
  //   dispatch(fetchcmmProcessedOrders(orgId, finalLimitToUse));
  // };

  const handleEndIndexOfTable = (endIndex: number) => {
    setEndIndex(endIndex);
    if (
      data &&
      endIndex < (data as CmmProcessedResponseModel[]).length - 1 &&
      endIndex === (data as CmmProcessedOrderModel[]).length - 1
    ) {
      const nextBatchFetch = Math.round(
        (data as CmmProcessedOrderModel[]).length / 100,
      );
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

  const handleEndIndexFromFirebase = (endIndex: number) => {
    const batchNumber = Math.ceil(currentlyLoadedCount / 100);
    setTableDataForContext("processedOrders", {
      lastBatchFetched: batchNumber,
    });
    setEndIndex(endIndex);
  };

  useEffect(() => {
    if (processedOrdersTableRef.current) {
      setIsTableRefActive(true);
    }
  }, [processedOrdersTableRef]);

  useEffect(() => {
    if (tableData.length > 0) {
      setIsTableRefActive(true);
    }
  }, [tableData]);

  // useEffect(() => {
  //   fetchData();
  // }, []);

  // useEffect for fetching more data from the table

  useEffect(() => {
    const orgId = getOrgIdForFetchExternalWorklist();
    const hasMoreData = hasMoreDataToLoad(
      {
        cmmProcessedOrders: {
          currentlyLoadedCount,
          totalDocuments,
        },
      },
      endIndex,
    );

    if (hasMoreData && orgId && lastVisible) {
      dispatch(fetchMoreCmmProcessedOrders(orgId, finalLimitToUse));
    }
  }, [currentlyLoadedCount, totalDocuments, lastVisible, endIndex]);

  useEffect(() => {
    if (data && !loading) {
      const tableData = generateProcessedOrdersTableData(
        data as CmmProcessedOrderModel[],
      );
      setTableData(tableData);
    }
  }, [data, loading]);

  // useEffect for search bar on the table
  useEffect(() => {
    const orgId = getOrgIdForFetchExternalWorklist();
    if (orgId && isTableRefActive) {
      if (searchTerm !== "") {
        dispatch(
          fetchCmmProcessedOrdersAfterSearch(orgId, searchTerm.toLowerCase()),
        );
      } else {
        dispatch(fetchcmmProcessedOrders(orgId, finalLimitToUse));
      }
    }
    setIsTableRefActive(true);
  }, [searchTerm, isTableRefActive]);

  useEffect(() => {
    if (reRunOncoEmrModal) {
      openModal("onco-emr-re-run-confirmation");
    }
    if (cmmInputModal) {
      openModal("cmm-input-viewer-modal");
    }
    if (reportPrescriptionModal) {
      openModal("report-prescription-modal");
    }
  }, [reRunOncoEmrModal, cmmInputModal, reportPrescriptionModal]);

  return (
    <div ref={processedOrdersTableRef} className="h-full w-full">
      <CustomTable
        tableData={tableData}
        tableHeaders={ProcessOrdersTableHeader}
        tableName="processedOrders"
        isFetching={loading}
        itemsPerPage={20}
        pagesPerView={5}
        totalCount={totalDocuments ?? 0}
        count={tableData.length}
        hideSearchBar={false}
        searchingText={(searchText: string) => {
          setSearchTerm(searchText);
        }}
        endIndexOfTable={handleEndIndexFromFirebase}
        onReRunOncoEmrClick={(rowData) => {
          setSelectedOrderId(rowData.id);
          setReRunOncoEmrModal(true);
          setReRunModalType(ReRunModalType.ONCO_EMR);
        }}
        onReRunCmmClick={(rowData) => {
          setSelectedOrderId(rowData.id);
          setReRunOncoEmrModal(true);
          setReRunModalType(ReRunModalType.CMM);
        }}
        onViewCmmClick={(rowData) => {
          setSelectedOrderId(rowData.id);
          setCmmInputModal(true);
        }}
        onReportPrescriptionClick={(rowData) => {
          setSelectedOrderId(rowData.id);
          setReportPrescriptionModal(true);
        }}
        showInLineLoader={appendingOrders}
      />
      {reRunOncoEmrModal && (
        <>
          <ReRunOncoEmrModal
            onClose={() => {
              setReRunOncoEmrModal(false);
              setSelectedOrderId("");
              setReRunModalType("");
            }}
            onSave={() => {}}
            disableSave={false}
            id={selectedOrderId}
            reRunModalType={reRunModalType}
          />
        </>
      )}
      {cmmInputModal && (
        <CmmInputViewerModal
          onClose={() => {
            setCmmInputModal(false);
            setSelectedOrderId("");
          }}
          id={selectedOrderId}
        />
      )}
      {reportPrescriptionModal && (
        <ReportPrescription
          onClose={() => {
            setReportPrescriptionModal(false);
            setSelectedOrderId("");
          }}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
};

export default ProcessedOrdersTable;
