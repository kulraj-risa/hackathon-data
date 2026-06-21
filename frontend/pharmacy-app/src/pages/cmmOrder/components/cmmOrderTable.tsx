import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchPaCasesFromBigQuery } from "../../../api/bigQuery/paCasesBigQuery";
import CustomTable from "../../../components/custom-table/custom-table";
import BqExpandableRow from "../../../components/custom-table/expandableRowChild/BqExpandableRow/bqExpandableRow";
import CmmInputViewerModalForCmmOrders from "../../../components/modals/cmmInputViewerModal/cmmInputViewerModalForCmmOrders";
import CmmOrderDeleteModal from "../../../components/modals/cmmOrderDeleteModal/cmmOrderDeleteModal";
import DocViewerModal from "../../../components/modals/docViewerModal/docViewerModalNew";
import DrugLabelModal from "../../../components/modals/drugLabelModal/drugLabelModal";
import EditRecordModal from "../../../components/modals/editRecordModal/editRecordModal";
import ReportMedicationModal from "../../../components/modals/reportMedication/reportMedication";
import ReportPrescriptionModal from "../../../components/modals/reportPrescription/reportPrescription";
import RerunConfirmModal from "../../../components/modals/rerunConfirmModal/rerunConfirmModal";
import SendToPlanConfirmModal from "../../../components/modals/sendToPlanConfirmModal/sendToPlanConfirmModal";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { ModalId } from "../../../enums/modalId";
import { useDrugCohort } from "../../../hooks/useDrugCohort";
import { useDrugColorMatcher } from "../../../hooks/useDrugColorMatcher";
import { useWorklistColumnConfig } from "../../../hooks/useWorklistColumnConfig";
import { setFilter } from "../../../redux/slice/filterValuesSlice";
import { closeModal } from "../../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../../redux/store/store";
import { transformBqRowsToTableData } from "../../../utils/bqRowTransformer";
import {
  DEFAULT_FIELD_MAPPING,
  FieldMapping,
} from "../../configurations/pages/fieldMapping/defaultMapping";
import { handleButtonWithThreeDotsClick } from "../actionHandlers/buttonWiththreDotsActionHandlers";
import { useCmmOrderData } from "../hooks/useCmmOrderData";
import { useCmmOrderFilter } from "../hooks/useCmmOrderFilter";
import { useCmmOrderModals } from "../hooks/useCmmOrderModals";
import { useCmmOrderSearch } from "../hooks/useCmmOrderSearch";
import { processFilterData } from "../utils/filterDataProcessor";
import {
  handleEndIndexOfTable,
  navigateToCaseWorkspace,
  navigateToForm,
} from "../utils/tableHandlers";

void useWorklistColumnConfig;
void fetchPaCasesFromBigQuery;
void transformBqRowsToTableData;
void DEFAULT_FIELD_MAPPING;
void (0 as unknown as FieldMapping);
void BqExpandableRow;

/** Flatten nested object to dot-notation key-value pairs for search */
function flattenForSearch(obj: any, prefix = ""): string[] {
  if (obj === null || obj === undefined) return [];
  if (Array.isArray(obj)) return [JSON.stringify(obj)];
  if (typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) =>
      flattenForSearch(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [String(obj)];
}

const CmmOrderTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { headers: worklistHeaders } = useWorklistColumnConfig();
  const { getTableDataFromContext, setTableDataForContext } =
    useTablesContext();
  const tableAttributes = getTableDataFromContext("allCmmOrders");
  const { openedModalId, metaData } = useSelector(
    (state: RootState) => state.modalSliceNew,
  );

  const initialLimit = 120;
  const [endIndex, setEndIndex] = useState<number>(0);
  const [fetchDrugModalOpen, setFetchDrugModalOpen] = useState(false);

  // Track Outcome modal
  const [trackOutcomeOpen, setTrackOutcomeOpen] = useState(false);
  const [trackDateRange, setTrackDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [trackingResult, setTrackingResult] = useState<{
    total: number;
    approved: number;
    denied: number;
    pending: number;
    other: number;
    rows: Record<string, any>[];
  } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Raw BigQuery rows (unfiltered)
  const [rawBqRows, setRawBqRows] = useState<Record<string, any>[]>([]);
  const [bqTableData, setBqTableData] = useState<Record<string, any>[]>([]);
  const [bqLoading, setBqLoading] = useState(true);
  const [bqError, setBqError] = useState<string | null>(null);

  // Workflow timeline modal
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowEvents, setWorkflowEvents] = useState<any[]>([]);
  const [workflowPatientName, setWorkflowPatientName] = useState("");

  // Client-side search
  const [clientSearch, setClientSearch] = useState("");

  // Edit modal
  const [editModalRow, setEditModalRow] = useState<Record<string, any> | null>(
    null,
  );

  const getFieldMapping = (): FieldMapping[] => {
    try {
      const stored = localStorage.getItem("field_mapping");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.mappings?.length) return parsed.mappings;
      }
    } catch {
      // use default
    }
    return DEFAULT_FIELD_MAPPING;
  };

  const loadBigQueryData = useCallback(async () => {
    setBqLoading(true);
    setBqError(null);
    try {
      const bqResponse = await fetchPaCasesFromBigQuery();
      setRawBqRows(bqResponse.rows);
    } catch (err: any) {
      setBqError(err?.message ?? "Failed to fetch BigQuery data");
    } finally {
      setBqLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBigQueryData();
  }, [loadBigQueryData]);

  // Apply client-side search filter
  const searchedRows = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return rawBqRows;

    // MRN-specific search: "mrn:12345" or "mrn 12345"
    const mrnMatch = term.match(/^mrn[:\s]+(.+)/);
    if (mrnMatch) {
      const mrnTerm = mrnMatch[1].trim();
      return rawBqRows.filter((row) => {
        const mrn = String(
          row?.patient?.patient_mrn ?? row?.patient_mrn ?? "",
        ).toLowerCase();
        return mrn.includes(mrnTerm);
      });
    }

    // General search across all fields
    return rawBqRows.filter((row) => {
      const values = flattenForSearch(row);
      return values.some((v) => v.toLowerCase().includes(term));
    });
  }, [rawBqRows, clientSearch]);

  /**
   * Reorder rows by explicit identifier order, then append any remaining rows.
   */
  const PREFERRED_ORDER: string[] = [
    "d98ab953-9c93-4012-a713-b77675ac7f4c",
    "2e514531-dd9e-4063-9edf-1824239e1610",
    "2c418dd9-6ec1-44ba-93f8-0a20183fdc62",
    "a0c7e86d-1545-4445-9d1a-14cea85ef275",
    "24808ae1-be30-44e5-b090-459d7ce2eda8",
    "205f6a08-a9c0-4229-862d-25c44c0fdc91",
    "51c36fb7-9278-436c-b2c6-98ce3826bb8e",
    "444d5220-a11b-4a7d-9e9a-8cd6f194fcff",
    "7e1873c8-7a3c-43f4-82b6-4dbffedfd401",
    "a25a8356-d0c2-41db-9af6-ebda856676f4",
    "c380a6dc-a4cc-407a-9757-236a309d486d",
    "6e8caa9c-4576-447b-bc9c-eeb2e75940f9",
    "1e079377-1ea1-4b15-9da3-b46e0df7b2c3",
    "d6a3310b-7148-4097-ae22-17a0187fbd5f",
    "f05de2c6-a858-4afd-b6ce-1e3bfd4828f4",
    "7138b9f8-cd8e-47e8-a10c-389cb9e7592f",
    "6a14e637-b49b-46cf-aeff-b04b5381a5ba",
    "a742cc56-7d73-4f08-bd05-b47f4f23e7c6",
    "f82f7862-878a-41b9-be8e-ca2fbd9b8ae2",
    "93804e5e-e9bd-481f-871e-87494f3fd3c0",
    "ff339668-f2c1-4411-8ddf-fef01e9e00b0",
    "08eb447d-6885-4e6b-b366-dbecc5ea91a7",
    "96d285ea-48a8-4e1c-8334-1d33f0096a10",
    "489bf6d0-a305-4b36-9e48-72280f785771",
    "9592af29-49a5-4fe5-b7eb-f2408db7a2ec",
  ];

  const filteredRows = useMemo(() => {
    const orderMap = new Map<string, number>();
    PREFERRED_ORDER.forEach((id, idx) => orderMap.set(id, idx));

    const ordered: Record<string, any>[] = [];
    const rest: Record<string, any>[] = [];

    for (const row of searchedRows) {
      const id = row?.identifier ?? row?.case_id ?? "";
      if (orderMap.has(id)) {
        ordered.push(row);
      } else {
        rest.push(row);
      }
    }

    // Sort the matched rows by the explicit order
    ordered.sort((a, b) => {
      const idA = a?.identifier ?? a?.case_id ?? "";
      const idB = b?.identifier ?? b?.case_id ?? "";
      return (orderMap.get(idA) ?? 0) - (orderMap.get(idB) ?? 0);
    });

    return [...ordered, ...rest];
  }, [searchedRows]);

  // Transform filtered rows into table data
  useEffect(() => {
    const mapping = getFieldMapping();
    const transformed = transformBqRowsToTableData(
      filteredRows,
      mapping,
      worklistHeaders,
    );
    setBqTableData(transformed);
  }, [filteredRows, worklistHeaders]);

  // Build unique drug list from BigQuery rows for the Drug Label modal
  const uniqueDrugList = useMemo(() => {
    const drugs = new Set<string>();
    rawBqRows.forEach((row) => {
      const name = row?.drug?.drug_name_onco_emr || row?.drug?.drug_name;
      if (name) drugs.add(String(name));
    });
    return Array.from(drugs).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
  }, [rawBqRows]);

  // Fetch drug cohort data
  const { drugCohort, loading: drugCohortLoading } = useDrugCohort();
  const { getDrugColor } = useDrugColorMatcher(drugCohort);

  const finalLimitToUse = useMemo(() => {
    const dataFromContext = tableAttributes.lastBatchFetched
      ? tableAttributes.lastBatchFetched
      : 0;
    const limitToFetch =
      dataFromContext == 0
        ? initialLimit
        : (dataFromContext + 1) * initialLimit;
    return limitToFetch;
  }, []);

  const {
    ordersData,
    loading,
    pageData,
    showInLineLoader,
    filters,
    uniqueDrugnames,
    uniqueFormNames,
    user,
    allCmmOrdersTableData,
    tableDataForTable,
    setTableDataForTable,
  } = useCmmOrderData(getDrugColor);

  const validFilters = useMemo(() => {
    return filters.filter((filter) => filter.name === "allCmmOrders");
  }, [filters]);

  const {
    searchText,
    initialSearch,
    batchNumberRetreived,
    setBatchNumberRetreived,
    filterState,
    setFilterState,
    search,
    fetchAllOrders,
    resetAndFetchOrders,
    handleSearch,
  } = useCmmOrderSearch(finalLimitToUse, validFilters, processFilterData);

  const { filterData, filterForTable, setFilterForTable } = useCmmOrderFilter(
    filters,
    uniqueDrugnames,
    uniqueFormNames,
    finalLimitToUse,
    processFilterData,
    initialSearch,
    fetchAllOrders,
    filterState,
    setFilterState,
    endIndex,
    allCmmOrdersTableData,
  );

  const {
    openDeleteModal,
    setOpenDeleteModal,
    data,
    setData,
    openSendToPlanModal,
    sendToPlanModalType,
    openRerunModal,
    rerunType,
    rerunOrderData,
    handleSendToPlanModalOpen,
    handleSendToPlanConfirm,
    handleRerunModalOpen,
    handleRerunConfirm,
    onCmmOrderDeleteSuccess,
    closeDeleteModal,
    closeSendToPlanModal,
    closeRerunModal,
    openReportPrescriptionModal,
    selectedOrderIdForReportPrescription,
    handleReportPrescriptionModalOpen,
    closeReportPrescriptionModal,
    openReportMedicationModal,
    selectedOrderIdForReportMedication,
    handleReportMedicationModalOpen,
    closeReportMedicationModal,
  } = useCmmOrderModals(
    ordersData,
    user?.email ?? "",
    resetAndFetchOrders,
    searchText,
    search,
    fetchAllOrders,
  );

  const handleCloseCmmInputModal = () => {
    dispatch(closeModal());
  };

  const handleClientSearch = useCallback((text: string) => {
    setClientSearch(text);
  }, []);

  const handleEditRecord = useCallback(
    (rowId: string) => {
      const raw = rawBqRows.find(
        (r) => (r.identifier ?? r.case_id ?? "") === rowId,
      );
      if (raw) setEditModalRow(raw);
    },
    [rawBqRows],
  );

  void drugCohortLoading;
  void batchNumberRetreived;
  void setBatchNumberRetreived;
  void handleSearch;
  void filterForTable;
  void setFilterForTable;

  return (
    <>
      {bqError && (
        <div className="border-b border-primaryGray-14 bg-red-50 px-4 py-2 text-x-tiny text-tertiaryRed-3">
          {bqError}
        </div>
      )}

      {/* MRN search hint */}
      {clientSearch.toLowerCase().startsWith("mrn") && (
        <div className="border-b border-primaryGray-14 bg-tertiaryBlue-13 px-4 py-1.5 text-overline text-tertiaryBlue-3">
          Searching by MRN — tip: type{" "}
          <code className="rounded bg-tertiaryBlue-10 px-1">mrn:12345</code> for
          exact MRN lookup
        </div>
      )}

      <CustomTable
        tableHeaders={worklistHeaders}
        tableData={bqTableData}
        itemsPerPage={10}
        pagesPerView={4}
        count={filteredRows.length}
        totalCount={rawBqRows.length}
        isFetching={bqLoading}
        tableName={"allCmmOrders"}
        searchingText={handleClientSearch}
        endIndexOfTable={(index) =>
          handleEndIndexOfTable(
            index,
            ordersData,
            pageData,
            finalLimitToUse,
            setEndIndex,
            setBatchNumberRetreived,
            setTableDataForContext,
          )
        }
        onReviewButtonClick={(data) => navigateToForm(data, navigate)}
        onRefreshButton={loadBigQueryData}
        onRowClick={(data) => navigateToCaseWorkspace(data, navigate)}
        isDisabled={loading}
        onDeleteIconClick={(data) => {
          setOpenDeleteModal(true);
          setData(data);
        }}
        showFilterButton={!loading && clientSearch.length <= 3}
        filterSectionsData={filterData}
        onFilterApplyClicked={(data) => {
          setFilterForTable(data);
          dispatch(setFilter(data));
        }}
        showInLineLoader={showInLineLoader}
        showRefreshButton={true}
        showOtherButton={true}
        otherButtonMeta={[
          {
            text: "Fetch Drug Usage",
            onClick: () => setFetchDrugModalOpen(true),
            disabled: false,
            buttonType: "secondary",
            size: "medium",
          },
          {
            text: "Track Outcome",
            onClick: () => {
              setTrackOutcomeOpen(true);
              setTrackingResult(null);
              setTrackDateRange({ startDate: "", endDate: "" });
            },
            disabled: false,
            buttonType: "primary",
            size: "medium",
          },
        ]}
        expandableRowContent={(rowData) => (
          <BqExpandableRow rowData={rowData} />
        )}
        onRowExpansionChangeFromTableBody={(expanded, id) => {
          setBqTableData((prev) =>
            prev.map((row) =>
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
                      isExpanded: false,
                    },
                  },
            ),
          );
        }}
        isExpandableRowTable={true}
        onButtonWithThreeDotsOptionClick={(optionId, rowId) => {
          if (optionId === "workflow_timeline") {
            const rowEntry = bqTableData.find((r) => r.id === rowId);
            if (rowEntry?.rowData) {
              try {
                const raw = JSON.parse(rowEntry.rowData);
                const events = raw.events ?? [];
                const name = [raw.patient?.first_name, raw.patient?.last_name]
                  .filter(Boolean)
                  .join(" ");
                setWorkflowEvents(events);
                setWorkflowPatientName(name);
                setWorkflowModalOpen(true);
              } catch {
                setWorkflowEvents([]);
                setWorkflowPatientName("");
                setWorkflowModalOpen(true);
              }
            }
            return;
          }
          if (optionId === "edit_record") {
            handleEditRecord(rowId);
            return;
          }
          handleButtonWithThreeDotsClick(
            optionId,
            rowId,
            user?.email ?? "",
            resetAndFetchOrders,
            handleSendToPlanModalOpen,
            handleRerunModalOpen,
            navigate,
            handleReportPrescriptionModalOpen,
            handleReportMedicationModalOpen,
          );
        }}
      />

      {editModalRow && (
        <EditRecordModal
          rowData={editModalRow}
          onClose={() => setEditModalRow(null)}
          onSaved={() => {
            setEditModalRow(null);
            loadBigQueryData();
          }}
        />
      )}

      {openDeleteModal && (
        <CmmOrderDeleteModal
          onClose={closeDeleteModal}
          data={data}
          onDeleteSuccess={onCmmOrderDeleteSuccess}
        />
      )}
      {openSendToPlanModal && (
        <SendToPlanConfirmModal
          onClose={closeSendToPlanModal}
          onSaveClick={handleSendToPlanConfirm}
          modalType={sendToPlanModalType}
        />
      )}
      {openRerunModal && rerunType && (
        <RerunConfirmModal
          onClose={closeRerunModal}
          onSaveClick={handleRerunConfirm}
          rerunType={rerunType}
          orderData={rerunOrderData}
        />
      )}
      {openedModalId === ModalId.CMM_INPUT_VIEWER_MODAL && (
        <CmmInputViewerModalForCmmOrders
          onClose={handleCloseCmmInputModal}
          orderId={metaData?.orderId ?? ""}
        />
      )}
      {openReportPrescriptionModal && (
        <ReportPrescriptionModal
          onClose={closeReportPrescriptionModal}
          orderId={selectedOrderIdForReportPrescription ?? ""}
        />
      )}
      {openReportMedicationModal && (
        <ReportMedicationModal
          onClose={closeReportMedicationModal}
          orderId={selectedOrderIdForReportMedication ?? ""}
        />
      )}
      {openedModalId === ModalId.DOC_VIEWER_MODAL && (
        <DocViewerModal
          onClose={handleCloseCmmInputModal}
          type="clinical_attachment"
        />
      )}
      {fetchDrugModalOpen && (
        <DrugLabelModal
          onClose={() => {
            setFetchDrugModalOpen(false);
          }}
          drugList={uniqueDrugList}
        />
      )}

      {/* ── Track Outcome Modal ── */}
      {trackOutcomeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => {
            setTrackOutcomeOpen(false);
            setTrackingResult(null);
          }}
          style={{ animation: "wfFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "wfSlideUp .2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
              <h3 className="text-body font-bold text-primaryGray-1">
                Track Outcome
              </h3>
              <button
                className="rounded-full p-1.5 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                onClick={() => {
                  setTrackOutcomeOpen(false);
                  setTrackingResult(null);
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 bg-primaryGray-16/50 px-6 py-6">
              <p className="text-small text-primaryGray-6">
                Select a date range to analyze case outcomes within the
                specified period.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                    Start Date <span className="text-[#CC0300]">*</span>
                  </label>
                  <input
                    type="date"
                    value={trackDateRange.startDate}
                    onChange={(e) =>
                      setTrackDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    max={
                      trackDateRange.endDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:ring-1 focus:ring-primaryGray-9/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-x-tiny font-medium text-primaryGray-6">
                    End Date <span className="text-[#CC0300]">*</span>
                  </label>
                  <input
                    type="date"
                    value={trackDateRange.endDate}
                    onChange={(e) =>
                      setTrackDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    min={trackDateRange.startDate}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-md border border-primaryGray-14 bg-white px-3 py-2 text-small text-primaryGray-1 outline-none transition-all duration-150 placeholder:text-primaryGray-11 focus:border-primaryGray-9 focus:ring-1 focus:ring-primaryGray-9/20"
                  />
                </div>
              </div>

              {/* Results */}
              {isTracking && (
                <div className="flex items-center justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primaryGray-14 border-t-primaryGray-1" />
                  <span className="ml-3 text-small text-primaryGray-6">
                    Analyzing outcomes…
                  </span>
                </div>
              )}

              {trackingResult && !isTracking && (
                <div className="flex flex-col gap-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="flex flex-col items-center rounded-lg border border-primaryGray-14 bg-primaryGray-16/40 px-3 py-3">
                      <span className="text-h11 font-bold text-primaryGray-1">
                        {trackingResult.total}
                      </span>
                      <span className="text-x-tiny font-medium text-primaryGray-6">
                        Total
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-3">
                      <span className="text-h11 font-bold text-[#065F46]">
                        {trackingResult.approved}
                      </span>
                      <span className="text-x-tiny font-medium text-[#065F46]">
                        Approved
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-3">
                      <span className="text-h11 font-bold text-[#991B1B]">
                        {trackingResult.denied}
                      </span>
                      <span className="text-x-tiny font-medium text-[#991B1B]">
                        Denied
                      </span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-3">
                      <span className="text-h11 font-bold text-[#92400E]">
                        {trackingResult.pending}
                      </span>
                      <span className="text-x-tiny font-medium text-[#92400E]">
                        Pending
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {trackingResult.total > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-primaryGray-16">
                        {trackingResult.approved > 0 && (
                          <div
                            className="h-full bg-[#10B981] transition-all duration-500"
                            style={{
                              width: `${(trackingResult.approved / trackingResult.total) * 100}%`,
                            }}
                            title={`Approved: ${trackingResult.approved}`}
                          />
                        )}
                        {trackingResult.denied > 0 && (
                          <div
                            className="h-full bg-[#EF4444] transition-all duration-500"
                            style={{
                              width: `${(trackingResult.denied / trackingResult.total) * 100}%`,
                            }}
                            title={`Denied: ${trackingResult.denied}`}
                          />
                        )}
                        {trackingResult.pending > 0 && (
                          <div
                            className="h-full bg-[#F59E0B] transition-all duration-500"
                            style={{
                              width: `${(trackingResult.pending / trackingResult.total) * 100}%`,
                            }}
                            title={`Pending: ${trackingResult.pending}`}
                          />
                        )}
                        {trackingResult.other > 0 && (
                          <div
                            className="h-full bg-[#9CA3AF] transition-all duration-500"
                            style={{
                              width: `${(trackingResult.other / trackingResult.total) * 100}%`,
                            }}
                            title={`Other: ${trackingResult.other}`}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-x-tiny text-primaryGray-6">
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#10B981]" />{" "}
                          Approved
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" />{" "}
                          Denied
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />{" "}
                          Pending
                        </span>
                        {trackingResult.other > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-[#9CA3AF]" />{" "}
                            Other
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detail list */}
                  {trackingResult.rows.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-primaryGray-14">
                      <table className="w-full text-small">
                        <thead>
                          <tr className="border-b border-primaryGray-14 bg-primaryGray-16/60">
                            <th className="px-3 py-2 text-left text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                              Patient
                            </th>
                            <th className="px-3 py-2 text-left text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                              Drug
                            </th>
                            <th className="px-3 py-2 text-left text-x-tiny font-semibold uppercase tracking-wider text-primaryGray-6">
                              Outcome
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {trackingResult.rows.map((row, idx) => {
                            const outcomeLower = (
                              row.outcome || ""
                            ).toLowerCase();
                            const outcomeColor = outcomeLower.includes(
                              "approved",
                            )
                              ? "#065F46"
                              : outcomeLower.includes("denied")
                                ? "#991B1B"
                                : outcomeLower.includes("pending")
                                  ? "#92400E"
                                  : "#0F0F0F";
                            const outcomeBg = outcomeLower.includes("approved")
                              ? "#ECFDF5"
                              : outcomeLower.includes("denied")
                                ? "#FEF2F2"
                                : outcomeLower.includes("pending")
                                  ? "#FFFBEB"
                                  : "#F5F5F5";
                            return (
                              <tr
                                key={idx}
                                className="border-b border-primaryGray-14 last:border-b-0"
                              >
                                <td className="px-3 py-2 text-primaryGray-1">
                                  {row.patient}
                                </td>
                                <td className="px-3 py-2 text-primaryGray-6">
                                  {row.drug}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className="inline-block rounded-full px-2.5 py-0.5 text-x-tiny font-semibold"
                                    style={{
                                      backgroundColor: outcomeBg,
                                      color: outcomeColor,
                                    }}
                                  >
                                    {row.outcome || "No Outcome"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-primaryGray-14 px-6 py-4">
              <span className="text-x-tiny text-primaryGray-9">
                {trackingResult ? (
                  `${trackingResult.total} case${trackingResult.total !== 1 ? "s" : ""} found`
                ) : (
                  <>
                    <span className="text-[#CC0300]">*</span> Required fields
                  </>
                )}
              </span>
              <div className="flex gap-3">
                <button
                  className="rounded-md border border-primaryGray-14 bg-white px-5 py-2 text-small font-semibold text-primaryGray-1 transition-colors duration-150 hover:bg-primaryGray-16"
                  onClick={() => {
                    setTrackOutcomeOpen(false);
                    setTrackingResult(null);
                  }}
                >
                  {trackingResult ? "Close" : "Cancel"}
                </button>
                {!trackingResult && (
                  <button
                    className="rounded-md border border-primaryGray-1 bg-primaryGray-1 px-6 py-2.5 text-small font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={
                      !trackDateRange.startDate ||
                      !trackDateRange.endDate ||
                      isTracking
                    }
                    onClick={() => {
                      setIsTracking(true);
                      // Simulate a brief loading, then compute results from local data
                      setTimeout(() => {
                        const start = new Date(trackDateRange.startDate);
                        const end = new Date(trackDateRange.endDate);
                        end.setHours(23, 59, 59, 999);

                        const matchedRows: Record<string, any>[] = [];
                        let approved = 0,
                          denied = 0,
                          pending = 0,
                          other = 0;

                        rawBqRows.forEach((row) => {
                          const createdAt =
                            row?.created_at || row?.workflow?.created_at || "";
                          const rowDate = createdAt
                            ? new Date(createdAt)
                            : null;

                          if (rowDate && rowDate >= start && rowDate <= end) {
                            const outcome = (
                              row?.workflow?.final_outcome ||
                              row?.workflow?.status ||
                              ""
                            ).toString();
                            const outcomeLower = outcome
                              .toLowerCase()
                              .replace(/\s+/g, "_");

                            const patientFirst =
                              row?.patient?.patient_first_name || "";
                            const patientLast =
                              row?.patient?.patient_last_name || "";
                            const patientName =
                              `${patientFirst} ${patientLast}`.trim() ||
                              "Unknown";
                            const drug =
                              row?.drug?.drug_name_onco_emr ||
                              row?.drug?.drug_name ||
                              "—";

                            if (
                              outcomeLower.includes("approved") ||
                              outcomeLower.includes("auth_on_file") ||
                              outcomeLower.includes("approval")
                            ) {
                              approved++;
                            } else if (
                              outcomeLower.includes("denied") ||
                              outcomeLower.includes("denial")
                            ) {
                              denied++;
                            } else if (
                              outcomeLower.includes("pending") ||
                              outcomeLower.includes("sent_to_plan") ||
                              outcomeLower.includes("waiting") ||
                              outcomeLower.includes("in_progress") ||
                              outcomeLower.includes("form_filled")
                            ) {
                              pending++;
                            } else {
                              other++;
                            }

                            matchedRows.push({
                              patient: patientName,
                              drug,
                              outcome: outcome || "No Outcome",
                            });
                          }
                        });

                        setTrackingResult({
                          total: matchedRows.length,
                          approved,
                          denied,
                          pending,
                          other,
                          rows: matchedRows,
                        });
                        setIsTracking(false);
                      }, 800);
                    }}
                  >
                    Track
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── Workflow Timeline Modal ───── */}
      {workflowModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setWorkflowModalOpen(false)}
          style={{ animation: "wfFadeIn .15s ease-out" }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div
            className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "wfSlideUp .2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primaryGray-14 px-6 py-4">
              <div>
                <h3 className="text-body font-bold text-primaryGray-1">
                  Workflow Timeline
                </h3>
                {workflowPatientName && (
                  <p className="mt-0.5 text-x-tiny text-primaryGray-9">
                    {workflowPatientName} &middot; {workflowEvents.length} steps
                  </p>
                )}
              </div>
              <button
                className="rounded-full p-1.5 text-primaryGray-9 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                onClick={() => setWorkflowModalOpen(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Timeline Body */}
            <div className="flex-1 overflow-auto bg-primaryGray-16/50 px-6 py-5">
              {workflowEvents.length > 0 ? (
                <div className="relative">
                  {workflowEvents.map((event: any, idx: number) => {
                    const isLast = idx === workflowEvents.length - 1;
                    const status = event.event_status ?? "";
                    const sLower = status.toLowerCase();
                    const isSuccess = sLower === "success";
                    const isError = sLower === "error";
                    const badgeStyle = isSuccess
                      ? { bg: "#E6F3F0", color: "#005D49" }
                      : isError
                        ? { bg: "#FFE8E8", color: "#CC0300" }
                        : sLower === "pending" || sLower === "in progress"
                          ? { bg: "#FFF3E0", color: "#C24400" }
                          : { bg: "#F5F5F5", color: "#0F0F0F" };

                    return (
                      <div key={idx} className="relative flex gap-4">
                        {/* Timeline rail */}
                        <div className="flex flex-col items-center">
                          <div
                            className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                            style={{
                              borderColor: badgeStyle.color,
                              backgroundColor: badgeStyle.bg,
                            }}
                          >
                            {isSuccess ? (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={badgeStyle.color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : isError ? (
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={badgeStyle.color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            ) : (
                              <div
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: badgeStyle.color }}
                              />
                            )}
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 bg-primaryGray-14" />
                          )}
                        </div>

                        {/* Step card */}
                        <div
                          className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-3"}`}
                        >
                          <div className="rounded-lg border border-primaryGray-14 bg-white px-4 py-3 transition-shadow duration-150 hover:shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <span className="text-small font-semibold text-primaryGray-1">
                                  {event.event_action_name ?? "—"}
                                </span>
                                {event.event_action_description && (
                                  <p className="mt-1 text-xs leading-relaxed text-primaryGray-9">
                                    {event.event_action_description}
                                  </p>
                                )}
                              </div>
                              <span
                                className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-x-tiny font-semibold"
                                style={{
                                  backgroundColor: badgeStyle.bg,
                                  color: badgeStyle.color,
                                }}
                              >
                                {status || "—"}
                              </span>
                            </div>
                            {event.event_platform && (
                              <span
                                className="mt-2 inline-block rounded px-2 py-0.5 text-x-tiny font-semibold"
                                style={{
                                  backgroundColor:
                                    event.event_platform === "OncoEMR"
                                      ? "#EDE9FE"
                                      : event.event_platform === "CoverMyMeds"
                                        ? "#E0F2FE"
                                        : event.event_platform === "Internal"
                                          ? "#FFF3E0"
                                          : "#F5F5F5",
                                  color:
                                    event.event_platform === "OncoEMR"
                                      ? "#6D28D9"
                                      : event.event_platform === "CoverMyMeds"
                                        ? "#0369A1"
                                        : event.event_platform === "Internal"
                                          ? "#C24400"
                                          : "#0F0F0F",
                                }}
                              >
                                {event.event_platform}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-small text-primaryGray-9">
                  No workflow events found
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-primaryGray-14 bg-primaryGray-16 px-5 py-3">
              <button
                className="rounded-md border border-primaryGray-1 bg-primaryGray-1 px-5 py-2 text-small font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-black"
                onClick={() => setWorkflowModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wfFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wfSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </>
  );
};

export default CmmOrderTable;
