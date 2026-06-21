import { useDispatch } from "react-redux";
import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";

import { setOpenedModalId } from "../../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../../redux/store/store";
import EyeIcon from "../../../../svg/eye";

interface InternalChildCardProps {
  title: string;
  primaryDescription: string[];
  secondaryDescription: string[];
  showIcon?: boolean;
  isPrimaryInformation?: boolean;
  width?: string;
  modalId?: string;
  rowData?: CmmOrderTableRowData;
  onIconClick?: () => void;
}

const InternalChildCard = ({
  title,
  primaryDescription,
  secondaryDescription,
  showIcon,
  isPrimaryInformation,
  width,
  modalId,
  rowData,
  onIconClick,
}: InternalChildCardProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleEyeIconClick = () => {
    if (onIconClick) {
      onIconClick();
    } else if (modalId) {
      dispatch(setOpenedModalId({ id: modalId }));
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-3">
      <div className="flex min-w-0 flex-col gap-1 text-sm">
        <div className="flex flex-row items-center gap-2">
          <div className="shrink-0 font-bold">{title}</div>

          {showIcon && <EyeIcon onClick={handleEyeIconClick} />}
        </div>
        <div
          className="max-w-full truncate text-primaryGray-6"
          title={primaryDescription.join(" - ")}
          dangerouslySetInnerHTML={{
            __html: primaryDescription.join(" &#8226; "),
          }}
        />
      </div>
      <div
        className="max-w-full truncate text-sm"
        title={secondaryDescription.slice(0, 3).join(" - ")}
        dangerouslySetInnerHTML={{
          __html: secondaryDescription.join(" &#8226; "),
        }}
      />
    </div>
  );
};

export default InternalChildCard;
