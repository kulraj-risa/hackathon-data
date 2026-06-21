import { CmmStatusModel } from "../../data-model/cmmStatusModel";
import { CmmStatusType } from "../../enums/cmmStatusType";
import { InfoIcon } from "../../svg/info-icon";
import TickWithWavyCircle from "../../svg/tickWithWavyCircle";
import WarningIcon from "../../svg/warningIcon";

interface StatusBlockProps {
  data?: CmmStatusModel;
}
const StatusBlock = (props: StatusBlockProps) => {
  const colorOfBlockBasedOnStatus = () => {
    if (props?.data?.type === CmmStatusType.SUCCESS) {
      return "#00775E";
    } else if (props?.data?.type === CmmStatusType.WARNING) {
      return "#EF6C00";
    } else if (props?.data?.type === CmmStatusType.ERROR) {
      return "#BB0202";
    } else {
      return "#0041a3";
    }
  };

  const decideIconBasedOnTheStatus = () => {
    if (props?.data?.type === CmmStatusType.SUCCESS) {
      return <TickWithWavyCircle width="24" height="24" fillColor="#fff" />;
    } else if (props?.data?.type === CmmStatusType.WARNING) {
      return (
        <WarningIcon
          height="24"
          width="24"
          innerFillColor="#EF6C00"
          outerFillColor="#fff"
        />
      );
    } else if (props?.data?.type === CmmStatusType.ERROR) {
      return (
        <WarningIcon
          height="24"
          width="24"
          innerFillColor="#BB0202"
          outerFillColor="#fff"
        />
      );
    } else {
      return <InfoIcon height="24" width="24" stroke="#fff" />;
    }
  };
  return (
    <div
      className="status-block__container mb-4 flex items-start gap-3 rounded p-4 text-white"
      style={{ backgroundColor: colorOfBlockBasedOnStatus() }}
    >
      <div className="status-block__icon">{decideIconBasedOnTheStatus()}</div>
      <div className="statu-block__text">
        <div className="status-block__header-text mb-1 text-body font-semibold leading-6">
          {props?.data?.status}
        </div>
        <div className="status-block__sub-text text-h12 font-normal leading-h12">
          {props?.data?.message.split("\n").map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusBlock;
