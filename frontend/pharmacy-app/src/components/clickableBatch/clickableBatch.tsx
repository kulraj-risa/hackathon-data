import ChevronDown from "../../svg/chevron-down";

interface ClickableBatchProps {
  onClick?: () => void;
  text: string;
}
const ClickableBatch = (props: ClickableBatchProps) => {
  return (
    <div
      className="clickable-batch--container"
      onClick={props.onClick ? props.onClick : undefined}
    >
      <div className="clickable-batch--text">{props.text}</div>
      <div className="clickable-batch--icon">
        <ChevronDown />
      </div>
    </div>
  );
};

export default ClickableBatch;
