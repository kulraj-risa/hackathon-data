import EmptyAnalytics from "../../svg/emptyAnalytics";

interface NoDataProps {
  height?: string;
  width?: string;
  stroke?: string;
  startDate?: string;
  endDate?: string;
}

const NoData = (props: NoDataProps) => {
  return (
    <div className="no-analytics-data-container mt-20 flex h-full w-full flex-col items-center">
      <div className="">
        <EmptyAnalytics />
      </div>
      <div className="text-center text-lg">
        There are no patient metrics available between this date range. <br />
        {props.startDate && props.endDate && (
          <span>Please pick the dates starting from {props.startDate}.</span>
        )}
      </div>
    </div>
  );
};

export default NoData;
