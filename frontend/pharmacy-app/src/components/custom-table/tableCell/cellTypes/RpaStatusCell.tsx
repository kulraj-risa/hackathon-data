import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { EVWriteBackStatus } from "../../../../enums/evBvWriteBackStatus";
import { MedicalPaOrdersAuthStatus } from "../../../../enums/medicalPaOrdersAuthStatus";
import { ModalId } from "../../../../enums/modalId";
import { setOpenedModalId } from "../../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../../redux/store/store";
import CommentIcon from "../../../../svg/comment";
import ToolTipUsingPortal from "../../../toolTipUsingPortal/toolTipUsingPortal";

interface RpaStatusCellProps {
  value: {
    status: string;
    filePaths: any;
    shouldPropagate?: boolean;
    id?: string;
    masterAuthStatus?: string;
  };
  propagateEventOnClickInRpaStatusCell?: (id: string) => void;
}

export const RpaStatusCell: React.FC<RpaStatusCellProps> = ({
  value,
  propagateEventOnClickInRpaStatusCell,
}) => {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const commentModalRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const getColorBasedOnStatus = () => {
    switch (value.status) {
      case EVWriteBackStatus.SUCCESS:
        return "#00775E";
      case EVWriteBackStatus.ERROR:
        return "#CC0300";
      case EVWriteBackStatus.IN_PROGRESS:
        return "#0056D6";
      case EVWriteBackStatus.QUEUED:
        return "#4b00cc";
      default:
        return "#999999";
    }
  };

  const shouldPropagateEventOrOpenModal = () => {
    if (value.shouldPropagate === true) {
      propagateEventOnClickInRpaStatusCell?.(value?.id ?? "");
    } else {
      dispatch(
        setOpenedModalId({
          id: ModalId.IMAGE_VIEWER_MODAL,
          metaData: { filePaths: value.filePaths },
        }),
      );
    }
  };

  const shiftMasterQueueStatusForWhichModalShouldOpen = [
    MedicalPaOrdersAuthStatus.Pending,
    MedicalPaOrdersAuthStatus.AuthRequired,
    MedicalPaOrdersAuthStatus.Query,
    MedicalPaOrdersAuthStatus.Hold,
  ] as string[];

  const getStatusText = () => {
    switch (value.status) {
      case EVWriteBackStatus.SUCCESS:
        return "BO notes are added";
      case EVWriteBackStatus.ERROR:
        return "Failed to add BO notes";
      case EVWriteBackStatus.IN_PROGRESS:
        return "BO notes are being added";
      case EVWriteBackStatus.QUEUED:
        return "BO notes are queued";
      default:
        return "BO notes not initiated";
    }
  };

  return (
    <div
      className="table-cell-rpa-status ml-auto h-fit w-fit"
      onMouseEnter={() => setIsCommentModalOpen(true)}
      onMouseLeave={() => setIsCommentModalOpen(false)}
      ref={commentModalRef}
      onClick={() => {
        if (
          shiftMasterQueueStatusForWhichModalShouldOpen.includes(
            value?.masterAuthStatus ?? "",
          ) &&
          value.status === EVWriteBackStatus.NOT_INITIATED
        ) {
          shouldPropagateEventOrOpenModal();
        } else if (value.status === EVWriteBackStatus.SUCCESS) {
          shouldPropagateEventOrOpenModal();
        }
      }}
    >
      <CommentIcon
        color={getColorBasedOnStatus()}
        height={"24px"}
        width={"24px"}
      />
      <ToolTipUsingPortal
        children={getStatusText()}
        placement={"left"}
        showTooltip={isCommentModalOpen}
        parentRef={commentModalRef}
      />
    </div>
  );
};

export default RpaStatusCell;
