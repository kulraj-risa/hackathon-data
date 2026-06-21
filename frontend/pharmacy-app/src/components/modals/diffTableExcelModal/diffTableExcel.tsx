import moment from "moment";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  controlToastState,
  Modal,
  SpinningLoader,
  TextInput,
} from "risa-oasis-ui_v2";
import { generateTableDataForCmmFormDiffTable } from "../../../pages/pharmaPaDiffData/utils/diffTableDataCreation";
import { fetchCmmFormDiffTableDataForDateRange } from "../../../redux/slice/cmm/cmmFormDiffTableDataSlice";
import { AppDispatch, RootState } from "../../../redux/store/store";
import {
  exportDataFromTableForCmmDiffData,
  exportDataToExcel,
} from "../../../utils/exportDataToExcel";
import { DateRangeCalendarNew } from "../../DateRangeCalendar/DateRangeCalendar";

interface DiffTableExcelProps {
  onClose: () => void;
  isLoading: boolean;
}

const DiffTableExcel = ({ onClose, isLoading }: DiffTableExcelProps) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Get the diff data from Redux store
  const { data: diffData, loading } = useSelector(
    (state: RootState) => state.cmmFormDiffTableData,
  );

  const handleSave = async () => {
    if (!startDate || !endDate) {
      controlToastState("please-select-both-start-and-end-dates");
      onClose();
      return;
    }

    try {
      setIsExporting(true);

      // Fetch data for the specific date range from the API
      const fetchedData = await dispatch(
        fetchCmmFormDiffTableDataForDateRange(startDate, endDate),
      );

      if (!fetchedData || fetchedData.length === 0) {
        controlToastState("no-diff-data-available-for-selected-date-range");
        onClose();
        return;
      }

      // Generate table data from fetched records
      const tableData = generateTableDataForCmmFormDiffTable(fetchedData);

      // Generate Excel data from table data
      const excelData = exportDataFromTableForCmmDiffData(tableData);

      const startDateFormatted = moment(startDate).format("MM-DD-YYYY");
      const endDateFormatted = moment(endDate).format("MM-DD-YYYY");
      const filename = `cmm-diff-data-${startDateFormatted}-to-${endDateFormatted}`;

      exportDataToExcel(excelData, filename);
      controlToastState("excel-exported-successfully");
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      controlToastState("error-exporting-data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Modal
      dialogId="diff-table-excel"
      onSave={handleSave}
      title="Diff Table Excel"
      saveButtonText={isExporting ? "Exporting..." : "Export"}
      cancelText="Cancel"
      onClose={onClose}
    >
      <div className="validator-input-modal__container flex flex-col items-center justify-center gap-2">
        {isExporting ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <SpinningLoader />
            <div className="text-center">
              <div className="font-semibold">Fetching data for export...</div>
              <div className="text-sm text-gray-600">
                This may take a few moments depending on the date range
                selected.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="input-date__container flex gap-2">
              <TextInput
                id={"startDate"}
                label={"Start Date"}
                readOnly
                defaultValue={
                  startDate ? moment(startDate).format("DD MMM YYYY") : ""
                }
              />
              <TextInput
                id={"endDate"}
                label={"End Date"}
                readOnly
                defaultValue={
                  endDate ? moment(endDate).format("DD MMM YYYY") : ""
                }
              />
            </div>
            <div className="input-date__date-picker">
              <DateRangeCalendarNew
                onDateRangeChange={handleDateRangeChange}
                initialStartDate={moment().toDate()}
                initialEndDate={moment().toDate()}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DiffTableExcel;
