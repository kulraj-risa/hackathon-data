interface DiffStatusProps {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  heading: string;
  statusHeadings: [string, string, string];
}

const DiffStatus = (props: DiffStatusProps) => {
  return (
    <div className="cmm_order__analytics--today flex flex-1 flex-col gap-4 rounded-md border border-primaryGray-14 p-4 shadow-md">
      <div className="today-date text-small">{props.heading}</div>
      <div className="today-analytics flex gap-4">
        <div className="nycbs-medical-pa-details--info-title flex-1 rounded-md border border-secondaryYellow-2 bg-secondaryYellow-11 p-2 text-tiny font-normal text-secondaryYellow-2 shadow-md">
          <div>{props.statusHeadings[0]}</div>
          <div className="text-body font-bold">{props.totalRuns}</div>
        </div>
        <div className="nycbs-medical-pa-details--info-title flex-1 rounded-md border border-tertiaryRed-3 bg-tertiaryRed-11 p-2 text-tiny font-normal text-tertiaryRed-3 shadow-md">
          <div>{props.statusHeadings[1]}</div>
          <div className="text-body font-bold">{props.successfulRuns}</div>
        </div>
        <div className="nycbs-medical-pa-details--info-title flex-1 rounded-md border border-tertiaryRed-3 bg-tertiaryRed-11 p-2 text-tiny font-normal text-tertiaryRed-3 shadow-md">
          <div>{props.statusHeadings[2]}</div>
          <div className="text-body font-bold">{props.failedRuns}</div>
        </div>
      </div>
    </div>
  );
};

export default DiffStatus;
