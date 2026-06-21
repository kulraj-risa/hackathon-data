import moment from "moment";

interface StatusForToday {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
}

const TodayRunStatus = (props: StatusForToday) => {
  return (
    <div className="cmm_order__analytics--today flex flex-1 flex-col gap-4 rounded-md border border-primaryGray-15 p-4">
      <div className="today-date">
        Run status of {moment().format("MMM D, YYYY")}
      </div>
      <div className="today-analytics flex gap-4">
        <div className="nycbs-medical-pa-details--info-title flex-1 rounded-md border border-secondaryYellow-2 bg-secondaryYellow-11 p-2 text-tiny font-normal text-secondaryYellow-2">
          <div>Total Runs</div>
          <div className="text-body font-bold">{props.totalRuns}</div>
        </div>
        <div className="nycbs-medical-pa-details--info-title flex-1 rounded-md border border-[#005D49] bg-[#E6F3F0] p-2 text-tiny font-normal text-[#005D49]">
          <div>Successful Runs</div>
          <div className="text-body font-bold">{props.successfulRuns}</div>
        </div>
        <div className="nycbs-medical-pa-details--info-title flex-1 rounded-md border border-tertiaryRed-3 bg-tertiaryRed-11 p-2 text-tiny font-normal text-tertiaryRed-3">
          <div>Failed Runs</div>
          <div className="text-body font-bold">{props.failedRuns}</div>
        </div>
      </div>
    </div>
  );
};

export default TodayRunStatus;
