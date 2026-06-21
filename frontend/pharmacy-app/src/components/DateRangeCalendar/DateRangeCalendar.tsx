import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import "./DateRangeCalendar.scss";

interface DateRangeCalendarProps {
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  resetSelection?: boolean;
  shouldReTriggerOnDateChange?: boolean;
  id?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DateRangeCalendarNew(props: DateRangeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(
    () => props.initialStartDate || new Date(),
  );
  const [startDate, setStartDate] = useState<Date | null>(
    () => props.initialStartDate || null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    () => props.initialEndDate || null,
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const hasTriggeredInitialCallback = useRef(false);

  useEffect(() => {
    if (
      props.initialStartDate &&
      props.initialEndDate &&
      !hasTriggeredInitialCallback.current &&
      props.shouldReTriggerOnDateChange
    ) {
      setStartDate(props.initialStartDate);
      setEndDate(props.initialEndDate);
    }
  }, [props.initialStartDate, props.initialEndDate]);

  useEffect(() => {
    if (props.id) {
      setStartDate(props.initialStartDate || null);
      setEndDate(props.initialEndDate || null);
    }
  }, [props.id, props.initialStartDate, props.initialEndDate]);

  useEffect(() => {
    if (props.resetSelection) {
      setStartDate(null);
      setEndDate(null);
      props.onDateRangeChange?.(null, null);
      hasTriggeredInitialCallback.current = false;
    }
  }, [props.resetSelection, props.onDateRangeChange]);

  useEffect(() => {
    if (
      props.initialStartDate &&
      props.initialEndDate &&
      !hasTriggeredInitialCallback.current
    ) {
      props.onDateRangeChange?.(props.initialStartDate, props.initialEndDate);
      hasTriggeredInitialCallback.current = true;
    }
  }, [props.initialStartDate, props.initialEndDate, props.onDateRangeChange]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  }, []);

  const { getDaysInMonth, isToday } = useDateUtils();

  const handleMonthClick = useCallback(() => {
    setShowMonthSelector(!showMonthSelector);
    setShowYearSelector(false);
  }, [showMonthSelector]);

  const handleYearClick = useCallback(() => {
    setShowYearSelector(!showYearSelector);
    setShowMonthSelector(false);
  }, [showYearSelector]);

  const handleMonthSelect = useCallback(
    (monthIndex: number) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
      setShowMonthSelector(false);
    },
    [currentMonth],
  );

  const handleYearSelect = useCallback(
    (year: number) => {
      setCurrentMonth(new Date(year, currentMonth.getMonth()));
      setShowYearSelector(false);
    },
    [currentMonth],
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1),
    );
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1),
    );
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      if (!startDate || (startDate && endDate)) {
        setStartDate(date);
        setEndDate(null);
      } else {
        if (date < startDate) {
          setStartDate(date);
          setEndDate(null);
        } else {
          setEndDate(date);
          props.onDateRangeChange?.(startDate, date);
        }
      }
    },
    [startDate, endDate, props.onDateRangeChange],
  );

  const handleDateHover = useCallback(
    (date: Date) => {
      if (startDate && !endDate) {
        setHoverDate(date);
      }
    },
    [startDate, endDate],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverDate(null);
  }, []);

  const days = useMemo(
    () => getDaysInMonth(currentMonth),
    [currentMonth, getDaysInMonth],
  );

  const weekDays = useMemo(
    () =>
      WEEKDAYS.map((day, index) => (
        <div key={index} className="weekday-cell">
          {day.substring(0, 2)}
        </div>
      )),
    [],
  );

  const isInRange = useCallback(
    (date: Date) => {
      if (!startDate) return false;
      if (endDate) {
        const normalizedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const normalizedStartDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        );
        const normalizedEndDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
        );
        return (
          normalizedDate >= normalizedStartDate &&
          normalizedDate <= normalizedEndDate
        );
      }
      if (hoverDate) {
        return (
          (date >= startDate && date <= hoverDate) ||
          (date >= hoverDate && date <= startDate)
        );
      }
      return false;
    },
    [startDate, endDate, hoverDate],
  );

  const getCellClassName = useCallback(
    (date: Date | null) => {
      if (!date) return "calendar-cell";

      const classNames = ["calendar-cell", "has-date"];

      const normalizedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

      if (startDate) {
        const normalizedStartDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        );
        if (normalizedDate.getTime() === normalizedStartDate.getTime()) {
          classNames.push("start-date");
        }
      }

      if (endDate) {
        const normalizedEndDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
        );
        if (normalizedDate.getTime() === normalizedEndDate.getTime()) {
          classNames.push("end-date");
        }
      }

      if (isInRange(date)) {
        classNames.push("in-range");
      }

      if (isToday(date)) {
        classNames.push("today");
      }

      return classNames.join(" ");
    },
    [startDate, endDate, isInRange, isToday],
  );

  const calendarCells = useMemo(
    () =>
      days.map((date, index) => (
        <div
          key={index}
          className={getCellClassName(date)}
          onClick={() => date && handleDateClick(date)}
          onMouseEnter={() => date && handleDateHover(date)}
          onMouseLeave={handleMouseLeave}
        >
          <span>{date ? date.getDate() : "\u00A0"}</span>
        </div>
      )),
    [
      days,
      getCellClassName,
      handleDateClick,
      handleDateHover,
      handleMouseLeave,
    ],
  );

  return (
    <div className="date-range-calendar">
      <div className="month-header">
        <button
          className="nav-button"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={24} strokeWidth={1.67} />
        </button>
        <div className="month-year-selector">
          <span className="month-text" onClick={handleMonthClick}>
            {MONTHS[currentMonth.getMonth()]}
          </span>
          <span className="year-text" onClick={handleYearClick}>
            {currentMonth.getFullYear()}
          </span>
          {showMonthSelector && (
            <div className="selector-dropdown month-dropdown">
              {MONTHS.map((month, index) => (
                <div
                  key={month}
                  className={`selector-item ${
                    index === currentMonth.getMonth() ? "selected" : ""
                  }`}
                  onClick={() => handleMonthSelect(index)}
                >
                  {month}
                </div>
              ))}
            </div>
          )}
          {showYearSelector && (
            <div className="selector-dropdown year-dropdown">
              {years.map((year) => (
                <div
                  key={year}
                  className={`selector-item ${
                    year === currentMonth.getFullYear() ? "selected" : ""
                  }`}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            className="nav-button"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={24} strokeWidth={1.67} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        <div className="weekdays">{weekDays}</div>
        <div className="days">{calendarCells}</div>
      </div>
    </div>
  );
}

const useDateUtils = () => {
  const formatMonth = useCallback((date: Date) => {
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }, []);

  const getDaysInMonth = useCallback((date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days: (Date | null)[] = Array(firstDayOfMonth).fill(null);

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  return {
    formatMonth,
    getDaysInMonth,
    isToday,
  };
};
