import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, openModal, SpinningLoader } from "risa-oasis-ui_v2";
import { StatusTrackingModal } from "../../components/modals/statusTracking/statusTrackingModal";
import { CmmProcessedOrderModel } from "../../data-model/cmmProcessedOrderModel";
import { OrganizationType } from "../../enums/organizationTypes";
import { fetchCountData } from "../../redux/slice/cmm/cmmProcessedOrdersSlice";
import { AppDispatch, RootState } from "../../redux/store/store";
import { getOrgIdForFetchExternalWorklist } from "../../utils/organizationHelper";
import ProcessedOrdersTable from "./components/processedOrdersTable";
import RunStatus from "./components/runStatus";
import {
  generateStatusForCurrentDate,
  generateStatusForLast3Days,
  generateStatusForLastDay,
} from "./utils/generateStatusForCards";

const InternalProcessedOrderStatus = () => {
  const {
    data,
    loading,
    currentDateData,
    last3DaysData,
    lastDayData,
    countDataLoading,
  } = useSelector((state: RootState) => state.cmmProcessedOrders);
  const dispatch = useDispatch<AppDispatch>();
  const processedOrdersTableRef = useRef<HTMLDivElement>(null);
  const [statusForToday, setStatusForToday] = useState({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  });
  const [statusForLast3Days, setStatusForLast3Days] = useState({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  });
  const [statusForLastDay, setStatusForLastDay] = useState({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  });
  const [showStatusTrackingModal, setShowStatusTrackingModal] = useState(false);

  useEffect(() => {
    if (showStatusTrackingModal) {
      openModal(`status-tracking-modal`);
    }
  }, [showStatusTrackingModal]);

  const handleCloseModal = () => {
    setShowStatusTrackingModal(false);
  };

  const handleOpenModal = () => {
    setShowStatusTrackingModal(true);
  };

  const org = getOrgIdForFetchExternalWorklist();

  useEffect(() => {
    if (org) {
      dispatch(fetchCountData(org));
    }
  }, [org]);

  useEffect(() => {
    if (currentDateData && last3DaysData && lastDayData && !countDataLoading) {
      const { totalRuns, successfulRuns, failedRuns } =
        generateStatusForCurrentDate(
          currentDateData as CmmProcessedOrderModel[],
        );
      const {
        totalRuns: totalRunsLast3Days,
        successfulRuns: successfulRunsLast3Days,
        failedRuns: failedRunsLast3Days,
      } = generateStatusForLast3Days(last3DaysData as CmmProcessedOrderModel[]);
      const {
        totalRuns: totalRunsLastDay,
        successfulRuns: successfulRunsLastDay,
        failedRuns: failedRunsLastDay,
      } = generateStatusForLastDay(lastDayData as CmmProcessedOrderModel[]);
      setStatusForToday({
        totalRuns,
        successfulRuns,
        failedRuns,
      });
      setStatusForLast3Days({
        totalRuns: totalRunsLast3Days,
        successfulRuns: successfulRunsLast3Days,
        failedRuns: failedRunsLast3Days,
      });
      setStatusForLastDay({
        totalRuns: totalRunsLastDay,
        successfulRuns: successfulRunsLastDay,
        failedRuns: failedRunsLastDay,
      });
    }
  }, [currentDateData, last3DaysData, lastDayData, countDataLoading]);

  return (
    <div className="cmm_order__layout h-full w-full bg-primaryGray-16 p-2">
      <div className="cmm_order__inner-container flex h-full flex-col gap-2 overflow-hidden rounded bg-white p-4">
        <div className="flex flex-row justify-between">
          <div className="cmm_order__heading text-h11 font-bold">
            Processed Runs for CMM
          </div>
          {org === OrganizationType.ASTERA && (
            <Button
              buttonType="primary"
              size="small"
              onClick={handleOpenModal}
              disabled={false}
            >
              Send Data
            </Button>
          )}
        </div>

        <>
          <div className="cmm_order__analytics my-4 flex w-full justify-between gap-2">
            {countDataLoading ? (
              <div className="mt-5 flex h-16 w-full items-center justify-center gap-2 p-3">
                <SpinningLoader />
                <div className="font-bold">Fetching Run Count...</div>
              </div>
            ) : (
              <>
                <RunStatus
                  totalRuns={statusForToday.totalRuns}
                  successfulRuns={statusForToday.successfulRuns}
                  failedRuns={statusForToday.failedRuns}
                  heading={`Run status of ${moment().format("MMM D, YYYY")}`}
                />
                <RunStatus
                  totalRuns={statusForLastDay.totalRuns}
                  successfulRuns={statusForLastDay.successfulRuns}
                  failedRuns={statusForLastDay.failedRuns}
                  heading={`Run status of ${moment().subtract(1, "days").format("MMM D, YYYY")}`}
                />
                <RunStatus
                  totalRuns={statusForLast3Days.totalRuns}
                  successfulRuns={statusForLast3Days.successfulRuns}
                  failedRuns={statusForLast3Days.failedRuns}
                  heading={"Run status of Last 3 days"}
                />
              </>
            )}
          </div>
          <div className="cmm_order__table-container flex-1 overflow-auto">
            <ProcessedOrdersTable
              processedOrdersTableRef={processedOrdersTableRef}
            />
          </div>
        </>
      </div>

      {showStatusTrackingModal && (
        <StatusTrackingModal
          onClose={() => setShowStatusTrackingModal(false)}
        />
      )}
    </div>
  );
};

export default InternalProcessedOrderStatus;
