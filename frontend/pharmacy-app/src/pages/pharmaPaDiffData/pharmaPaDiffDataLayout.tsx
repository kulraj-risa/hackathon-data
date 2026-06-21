import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Button, openModal, SpinningLoader } from "risa-oasis-ui_v2";
import DiffStatus from "../../components/diffStatus/diffStatus";

import DiffTableExcel from "../../components/modals/diffTableExcelModal/diffTableExcel";
import ValidatorInputModal from "../../components/modals/validatorInputModal/validatorInputModal";
import { RootState } from "../../redux/store/store";
import PharmaPaDiffTable from "./components/pharmaPaDiffTable";

const PharmaPaDiffDataLayout = () => {
  const pharmaPaDiffTableRef = useRef<HTMLDivElement>(null);
  const [showValidatorInputModal, setShowValidatorInputModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);

  useEffect(() => {
    if (showValidatorInputModal) {
      openModal("validator-input-modal");
    }
  }, [showValidatorInputModal]);

  useEffect(() => {
    if (exportModal) {
      openModal("diff-table-excel");
    }
  }, [exportModal]);

  const getLastDataDay = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const uniqueDates = [
      ...new Set(
        data.map((item) => moment(item.created_at).format("MM/DD/YYYY")),
      ),
    ].sort((a, b) => moment(b, "MM/DD/YYYY").diff(moment(a, "MM/DD/YYYY")));

    const today = moment().format("MM/DD/YYYY");
    return uniqueDates.find((date) => date !== today) || uniqueDates[0];
  };

  const getSecondLastDataDay = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const uniqueDates = [
      ...new Set(
        data.map((item) => moment(item.created_at).format("MM/DD/YYYY")),
      ),
    ].sort((a, b) => moment(b, "MM/DD/YYYY").diff(moment(a, "MM/DD/YYYY")));

    return uniqueDates[1];
  };

  const getFormDiffCountforLastDataDay = (data: any[]) => {
    const lastDataDay = getLastDataDay(data);
    if (!getLastDataDay) return 0;

    const lastDataDayData = data.filter(
      (item) => moment(item.created_at).format("MM/DD/YYYY") === lastDataDay,
    );

    const formDiffCountByDate1 = lastDataDayData.filter((item) => {
      const cmmInput = item?.differences_from_baseline?.cmm_input;
      return (
        cmmInput &&
        Object.keys(cmmInput).filter(
          (key) => key !== "comment" && key !== "status",
        ).length > 0
      );
    }).length;

    return formDiffCountByDate1;
  };

  const getQADiffCountforLastDataDay = (data: any[]) => {
    const lastDataDay = getLastDataDay(data);
    if (!getLastDataDay) return 0;

    const lastDataDayData = data.filter(
      (item) => moment(item.created_at).format("MM/DD/YYYY") === lastDataDay,
    );

    const qaDiffCountByDate1 = lastDataDayData.filter((item) => {
      const cmmInput = item?.differences_from_baseline?.questionnaire;
      const questionnaireBaselineNull =
        item?.differences_from_baseline?.questionnaire_baseline_null;
      // Skip if questionnaire_baseline_null is true
      if (questionnaireBaselineNull === true) {
        return false;
      }

      return cmmInput && Object.keys(cmmInput).length > 0;
    }).length;

    return qaDiffCountByDate1;
  };

  const getFormDiffCountforSecondLastDataDay = (data: any[]) => {
    const secondLastDataDay = getSecondLastDataDay(data);
    if (!secondLastDataDay) return 0;

    const secondLastDataDayData = data.filter(
      (item) =>
        moment(item.created_at).format("MM/DD/YYYY") === secondLastDataDay,
    );

    const formDiffCountByDate2 = secondLastDataDayData.filter((item) => {
      const cmmInput = item?.differences_from_baseline?.cmm_input;
      return (
        cmmInput &&
        Object.keys(cmmInput).filter(
          (key) => key !== "comment" && key !== "status",
        ).length > 0
      );
    }).length;

    return formDiffCountByDate2;
  };

  const getQaDiffCountforSecondLastDataDay = (data: any[]) => {
    const secondLastDataDay = getSecondLastDataDay(data);
    if (!secondLastDataDay) return 0;

    const secondLastDataDayData = data.filter(
      (item) =>
        moment(item.created_at).format("MM/DD/YYYY") === secondLastDataDay,
    );

    const qaDiffCountByDate2 = secondLastDataDayData.filter((item) => {
      const cmmInput = item?.differences_from_baseline?.questionnaire;
      const questionnaireBaselineNull =
        item?.differences_from_baseline?.questionnaire_baseline_null;

      if (questionnaireBaselineNull === true) {
        return false;
      }

      return (
        cmmInput &&
        Object.keys(cmmInput).filter(
          (key) => key !== "comment" && key !== "status",
        ).length > 0
      );
    }).length;

    return qaDiffCountByDate2;
  };

  const getApprovedCountforLastDataDay = (data: any[]) => {
    const lastDataDay = getLastDataDay(data);
    if (!lastDataDay) return 0;

    const lastDataDayData = data.filter(
      (item) =>
        moment(item.created_at).format("MM/DD/YYYY") === lastDataDay &&
        item.final_cmm_data?.status === "Approved",
    );

    return lastDataDayData.length;
  };

  const getDeniedCountforLastDataDay = (data: any[]) => {
    const lastDataDay = getLastDataDay(data);
    if (!lastDataDay) return 0;

    const lastDataDayData = data.filter(
      (item) =>
        moment(item.created_at).format("MM/DD/YYYY") === lastDataDay &&
        item.final_cmm_data?.status === "Denied",
    );
    return lastDataDayData.length;
  };

  const getOtherStatusCountforLastDataDay = (data: any[]) => {
    const lastDataDay = getLastDataDay(data);
    if (!lastDataDay) return 0;

    const lastDataDayData = data.filter(
      (item) =>
        moment(item.created_at).format("MM/DD/YYYY") === lastDataDay &&
        item.final_cmm_data?.status &&
        item.final_cmm_data.status !== "Approved" &&
        item.final_cmm_data.status !== "Denied",
    );

    return lastDataDayData.length;
  };

  const { data: cmmFormDiffTableData, loading: cmmFormDiffTableDataLoading } =
    useSelector((state: RootState) => state.cmmFormDiffTableData);

  const formDiffCountLastDataDay = getFormDiffCountforLastDataDay(
    cmmFormDiffTableData || [],
  );
  const qaDiffCountLastDataDay = getQADiffCountforLastDataDay(
    cmmFormDiffTableData || [],
  );

  const otherStatusCountLastDataDay = getOtherStatusCountforLastDataDay(
    cmmFormDiffTableData || [],
  );

  const approvedCountLastDataDay = getApprovedCountforLastDataDay(
    cmmFormDiffTableData || [],
  );

  const deniedCountLastDataDay = getDeniedCountforLastDataDay(
    cmmFormDiffTableData || [],
  );

  const formDiffCountSecondLastDataDay = getFormDiffCountforSecondLastDataDay(
    cmmFormDiffTableData || [],
  );

  const qaDiffCountSecondLastDataDay = getQaDiffCountforSecondLastDataDay(
    cmmFormDiffTableData || [],
  );

  const lastDataDay = getLastDataDay(cmmFormDiffTableData || []);
  const secondLastDataDay = getSecondLastDataDay(cmmFormDiffTableData || []);

  return (
    <div className="pharma-pa-diff-data__layout h-full w-full bg-primaryGray-16 p-2">
      <div className="pharma-pa-diff-data__inner-container flex h-full flex-col gap-4 overflow-hidden rounded bg-white p-4">
        {/* Header Section */}
        <div className="pharma-pa-diff__header-container flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="pharma-pa-diff-data__heading text-h11 font-bold">
              PA Diff Data
            </div>
            <div className="action-button flex flex-row gap-3">
              <Button
                disabled={cmmFormDiffTableDataLoading}
                children={"Export to Excel"}
                onClick={() => {
                  setExportModal(true);
                }}
                buttonType={"primary"}
                size={"small"}
              />

              <Button
                disabled={false}
                children={"Validate"}
                onClick={() => {
                  setShowValidatorInputModal(true);
                }}
                buttonType={"secondary"}
                size={"small"}
              ></Button>
            </div>
          </div>
          {/* Analytics Section */}
          {cmmFormDiffTableDataLoading ? (
            <div className="mb-2 flex h-16 w-full items-center justify-center gap-2 p-3">
              <SpinningLoader />
              <div className="font-bold">Fetching Analytics...</div>
            </div>
          ) : (
            <div className="cmm_order__analytics flex w-full justify-between gap-2">
              <DiffStatus
                totalRuns={qaDiffCountLastDataDay + formDiffCountLastDataDay}
                successfulRuns={formDiffCountLastDataDay}
                failedRuns={qaDiffCountLastDataDay}
                heading={`Diff Count of ${lastDataDay ? moment(lastDataDay, "MM/DD/YYYY").format("MMM D, YYYY") : "No Data"}`}
                statusHeadings={["Total Diff ", "Form Diff ", "QA Diff "]}
              />

              <DiffStatus
                totalRuns={approvedCountLastDataDay}
                successfulRuns={deniedCountLastDataDay}
                failedRuns={otherStatusCountLastDataDay}
                heading={`Status Count of ${lastDataDay ? moment(lastDataDay, "MM/DD/YYYY").format("MMM D, YYYY") : "No Data"}`}
                statusHeadings={["Approved", "Denied", "Other Status"]}
              />

              <DiffStatus
                totalRuns={
                  formDiffCountSecondLastDataDay + qaDiffCountSecondLastDataDay
                }
                successfulRuns={formDiffCountSecondLastDataDay}
                failedRuns={qaDiffCountSecondLastDataDay}
                heading={`Diff Count of ${secondLastDataDay ? moment(secondLastDataDay, "MM/DD/YYYY").format("MMM D, YYYY") : "No Data"}`}
                statusHeadings={[
                  "Total Diff Count",
                  "Form Diff Count",
                  "QA Diff Count",
                ]}
              />
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="pharma-pa-diff-data__table-container flex-1 overflow-auto">
          <PharmaPaDiffTable pharmaPaDiffTableRef={pharmaPaDiffTableRef} />
        </div>
      </div>
      {showValidatorInputModal && (
        <ValidatorInputModal
          onClose={() => setShowValidatorInputModal(false)}
        />
      )}
      {exportModal && (
        <DiffTableExcel
          onClose={() => setExportModal(false)}
          isLoading={cmmFormDiffTableDataLoading}
        />
      )}
    </div>
  );
};

export default PharmaPaDiffDataLayout;
