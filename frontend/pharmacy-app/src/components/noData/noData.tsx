import { InfoIcon } from "../../svg/info-icon";

interface NoDataProps {
  height?: string;
  width?: string;
  stroke?: string;
  text?: string;
}

const NoData = (props: NoDataProps) => {
  return (
    <div className="no-data-container">
      <InfoIcon
        height={props.height || "24"}
        width={props.width || "24"}
        stroke={props.stroke || "#0056D6"}
      />
      <div className="no-data-container__text">
        {props.text || "No Data Found"}
      </div>
    </div>
  );
};

export default NoData;
