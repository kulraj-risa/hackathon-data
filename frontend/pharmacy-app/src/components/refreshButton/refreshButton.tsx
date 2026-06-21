import RefreshIcon from "../../svg/refresh-icon";
interface RefreshButtonProps {
  onClick?: () => void;
}

const RefreshButton = (props: RefreshButtonProps) => {
  return (
    <div
      className="refresh-button-container flex h-10 w-10 items-center justify-center rounded-md border border-primaryGray-14 p-2 hover:cursor-pointer hover:shadow-sm"
      onClick={props.onClick && props.onClick}
    >
      <RefreshIcon />
    </div>
  );
};

export default RefreshButton;
