import { SpinningLoader } from "risa-oasis-ui_v2";
import { logSideNavClickEvent } from "../../utils/events";

interface SingleSideTabProps {
  id: string;
  label: string;
  isActive: boolean;
  onTabClick: (id: string) => void;
  isLoading?: boolean;
  count?: number;
  shouldShowCount?: boolean;
}

const SingleSideTab = (props: SingleSideTabProps) => {
  const handleClick = () => {
    logSideNavClickEvent(props.label);
    props.onTabClick(props.id);
  };

  const getCountLabel = () => {
    if (props?.count) {
      return props?.count > 99 ? "99+" : props?.count;
    }
    return 0;
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`single-side-tab-content ${props.isActive ? "active" : ""} `}
      >
        {props.label}
        {props.shouldShowCount && (
          <div className="single-side-tab-content-icon flex items-center justify-center">
            {props.isLoading ? (
              <SpinningLoader />
            ) : (
              <div className="count-holder--main-container flex aspect-square h-4 flex-col items-center justify-center gap-2 rounded-[0.5rem] bg-primaryGray-2 px-[0.25rem] py-[0.2rem]">
                <div className="count-holder-number text-xs font-semibold text-white">
                  {props?.count ? getCountLabel() : 0}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SingleSideTab;
