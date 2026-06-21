import moment from "moment";
import React from "react";

interface DateCellProps {
  value: any;
  [key: string]: any;
}

export const DateCell: React.FC<DateCellProps> = ({ value }) => {
  return (
    <>
      {value === "" || value === null || value === undefined
        ? "N/A"
        : moment(value).format("MM/DD/YYYY")}
    </>
  );
};

export default DateCell;
