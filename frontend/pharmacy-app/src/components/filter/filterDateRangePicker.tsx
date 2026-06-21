import moment from "moment";
import { useEffect, useState } from "react";
import { TextInput } from "risa-oasis-ui_v2";
import { DateRangeCalendarNew } from "../DateRangeCalendar/DateRangeCalendar";

interface FilterDateRangePickerProps {
  id?: string;
  label?: string;
  onDateRangeChange?: (data: {
    id: string;
    values: string[];
    valuesLabel?: string[];
    type: "string" | "number" | "date";
  }) => void;
  defaultValues?: string[];
}
const FilterDateRangePicker = (props: FilterDateRangePickerProps) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isClearAllClicked, setIsClearAllClicked] = useState(false);

  useEffect(() => {
    if (props.defaultValues) {
      const newStartDate = props.defaultValues[0]
        ? moment(props.defaultValues[0]).toDate()
        : null;
      const newEndDate = props.defaultValues[1]
        ? moment(props.defaultValues[1]).toDate()
        : null;

      if (
        newStartDate?.getTime() !== startDate?.getTime() ||
        newEndDate?.getTime() !== endDate?.getTime()
      ) {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
      }
    } else if (startDate !== null || endDate !== null) {
      setStartDate(null);
      setEndDate(null);
    }
  }, [props.defaultValues]);

  useEffect(() => {
    if (startDate && endDate) {
      const formattedStartDate = moment(startDate).format("MM/DD/YYYY");
      const formattedEndDate = moment(endDate).format("MM/DD/YYYY");

      const startDateLabel = moment(startDate).format("DD MMM YYYY");
      const endDateLabel = moment(endDate).format("DD MMM YYYY");

      const dataToEmit = {
        id: props.id as string,
        values: [formattedStartDate, formattedEndDate],
        valuesLabel: [`${startDateLabel}`, `${endDateLabel}`],
        type: "date" as const,
      };
      props.onDateRangeChange?.(dataToEmit);
    }
  }, [startDate, endDate]);

  const handleClearAllClicked = () => {
    setStartDate(null);
    setEndDate(null);
    setIsClearAllClicked(true);
    props.onDateRangeChange?.({
      id: props.id as string,
      values: [],
      valuesLabel: [],
      type: "date",
    });
  };

  return (
    <div className="filter-options-container flex h-full flex-col gap-2 overflow-hidden px-5">
      <div className="filter-options--header mt-4 text-body font-semibold text-primaryGray-2">
        {props.label}
      </div>
      <div className="filter-options--actions flex justify-end gap-3">
        <div
          className="filter-options--actions__clear-all text-small font-semibold text-tertiaryRed-4 hover:cursor-pointer hover:shadow-sm"
          onClick={handleClearAllClicked}
        >
          Clear Selection
        </div>
      </div>
      <div className="filter-options--display-box flex justify-between gap-4">
        <TextInput
          id={"start-date"}
          label={"From"}
          readOnly
          defaultValue={
            startDate !== null ? moment(startDate).format("DD MMM YYYY") : ""
          }
        />
        <TextInput
          id={"end-date"}
          label={"To"}
          readOnly
          defaultValue={
            endDate !== null ? moment(endDate).format("DD MMM YYYY") : ""
          }
        />
      </div>
      <div className="filter-options--date-picker mt-4 flex justify-center">
        <DateRangeCalendarNew
          onDateRangeChange={(dates, end) => {
            setIsClearAllClicked(false);
            setStartDate(dates);
            setEndDate(end);
          }}
          initialStartDate={startDate ? new Date(startDate) : undefined}
          initialEndDate={endDate ? new Date(endDate) : undefined}
          resetSelection={isClearAllClicked}
          shouldReTriggerOnDateChange={true}
          id={props.id}
        />
      </div>
    </div>
  );
};

export default FilterDateRangePicker;
