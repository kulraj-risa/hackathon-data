import moment from "moment";
import { useState } from "react";
import {
  controlToastState,
  DateRangeCalendar,
  Modal,
  TextInput,
} from "risa-oasis-ui_v2";
import { runStatusTracking } from "../../../api/bigQuery/nycbsPharmaOrders";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { logDataToConsole } from "../../../utils/customLogger";
import { getItemFromLocalStorage } from "../../../utils/localStorageHelper";

interface ValidatorInputModalProps {
  onClose: () => void;
}

const ValidatorInputModal = (props: ValidatorInputModalProps) => {
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const selectedOrganization =
    getItemFromLocalStorage(LocalStorageKeys.HEALTHCARE_FACILITY_ID) ?? "";
  const handleRunStatusTracking = async () => {
    try {
      setLoading(true);
      runStatusTracking(
        moment(dateRange.startDate).format("MM/DD/YYYY"),
        moment(dateRange.endDate).format("MM/DD/YYYY"),
        selectedOrganization,
      );
      console.log("running status tracking");
      controlToastState("validator-run-initiated");
    } catch (error) {
      logDataToConsole(error as string);
      controlToastState("validator-run-initiated-failure");
    } finally {
      setLoading(false);
      props.onClose();
    }
  };
  return (
    <Modal
      dialogId={"validator-input-modal"}
      onSave={handleRunStatusTracking}
      title={"Run Validator"}
      saveButtonText={"Run"}
      cancelText={"Cancel"}
      onCancel={() => {
        props.onClose();
      }}
      onClose={() => {
        props.onClose();
      }}
      disableSave={!dateRange.startDate || !dateRange.endDate || loading}
    >
      <div className="validator-input-modal__container flex flex-col items-center justify-center gap-2">
        <div className="input-date__container flex gap-2">
          <TextInput
            id={"startDate"}
            label={"Start Date"}
            readOnly
            defaultValue={
              dateRange.startDate
                ? moment(dateRange.startDate).format("DD MMM YYYY")
                : ""
            }
          />
          <TextInput
            id={"endDate"}
            label={"End Date"}
            readOnly
            defaultValue={
              dateRange.endDate
                ? moment(dateRange.endDate).format("DD MMM YYYY")
                : ""
            }
          />
        </div>
        <div className="input-date__date-picker">
          <DateRangeCalendar
            onDateRangeChange={(
              startDate: Date | null,
              endDate: Date | null,
            ) => {
              setDateRange({
                startDate: startDate ? startDate.toISOString() : undefined,
                endDate: endDate ? endDate.toISOString() : undefined,
              });
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ValidatorInputModal;
