import React, { useRef, useState } from "react";
import { DocWriteBackStatus } from "../../../../enums/evBvWriteBackStatus";
import DocWithUploadIcon from "../../../../svg/doc-with-upload-icon";
import ToolTipUsingPortal from "../../../toolTipUsingPortal/toolTipUsingPortal";

interface DocWithUploadIconCellProps {
  value: { status: string; filePaths?: any; shouldHideUploadIcon: boolean };
  [key: string]: any;
}

export const DocWithUploadIconCell: React.FC<DocWithUploadIconCellProps> = ({
  value,
}) => {
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const commentModalRef = useRef<HTMLDivElement>(null);

  const getColorBasedOnStatusDocWithUploadIcon = () => {
    switch (value.status) {
      case DocWriteBackStatus.SUCCESS:
        return "#00775E";
      case DocWriteBackStatus.ERROR:
        return "#CC0300";
      case DocWriteBackStatus.IN_PROGRESS:
        return "#0056D6";
      case DocWriteBackStatus.QUEUED:
        return "#4b00cc";
      default:
        return "#999999";
    }
  };

  const getStatusTextDocWithUploadIcon = () => {
    switch (value.status) {
      case DocWriteBackStatus.SUCCESS:
        return "Doc(s) is added";
      case DocWriteBackStatus.ERROR:
        return "Failed in uploading doc(s)";
      case DocWriteBackStatus.IN_PROGRESS:
        return "Doc(s) is being added";
      case DocWriteBackStatus.QUEUED:
        return "Doc(s) upload is being queued";
      default:
        return "Doc(s) upload not initiated";
    }
  };

  return value?.shouldHideUploadIcon ? (
    <></>
  ) : (
    <>
      <div
        className="table-cell-rpa-status ml-auto flex h-full items-center justify-center"
        onMouseEnter={() => setIsCommentModalOpen(true)}
        onMouseLeave={() => setIsCommentModalOpen(false)}
        ref={commentModalRef}
      >
        <DocWithUploadIcon
          color={getColorBasedOnStatusDocWithUploadIcon()}
          height={"24px"}
          width={"24px"}
        />

        <ToolTipUsingPortal
          children={getStatusTextDocWithUploadIcon()}
          placement={"left"}
          showTooltip={isCommentModalOpen}
          parentRef={commentModalRef}
        />
      </div>
    </>
  );
};

export default DocWithUploadIconCell;
