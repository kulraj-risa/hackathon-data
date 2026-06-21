import React from "react";
import { useDispatch } from "react-redux";
import { Item } from "../../../../data-model/documentModalWithSideBav";
import { ModalId } from "../../../../enums/modalId";
import { setOpenedModalId } from "../../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../../redux/store/store";
import EyeIcon from "../../../../svg/eye";
import FileIcon from "../../../../svg/fileIcon";

interface ViewIconCellProps {
  value: {
    shouldHideIcon?: boolean;
    screenshotPath?: string;
    shouldShowPdfIcon?: boolean;
    pdfPath?: string;
    title?: string;
    shouldOpenMultipleDocViewerModal?: boolean;
    multipleDocPaths?: Item[];
  };
  [key: string]: any;
}

export const ViewIconCell: React.FC<ViewIconCellProps> = (
  props: ViewIconCellProps,
) => {
  const dispatch = useDispatch<AppDispatch>();
  const handleViewScreenshot = () => {
    if (props.value.screenshotPath) {
      dispatch(
        setOpenedModalId({
          id: ModalId.IMAGE_VIEWER_MODAL,
          metaData: { filePaths: props.value.screenshotPath },
        }),
      );
    }
  };
  const handleViewPdf = () => {
    if (props.value.pdfPath) {
      dispatch(
        setOpenedModalId({
          id: ModalId.DOC_VIEWER_MODAL,
          metaData: {
            filePath: props.value.pdfPath,
            title: props.value.title,
            hideFooter: true,
          },
        }),
      );
    }
  };
  const handleViewMultipleDocs = () => {
    if (props.value.shouldOpenMultipleDocViewerModal) {
      dispatch(
        setOpenedModalId({
          id: ModalId.DOC_VIEWER_WITH_SIDE_NAVIGATION,
          metaData: {
            items: props.value?.multipleDocPaths ?? [],
            showLoader: false,
          },
        }),
      );
    }
  };
  return (
    <>
      <div className="icons-container flex items-center justify-end gap-3">
        {props.value.shouldHideIcon ? null : (
          <div onClick={handleViewScreenshot}>
            <EyeIcon />
          </div>
        )}
        {(props.value.shouldShowPdfIcon ||
          props.value.shouldOpenMultipleDocViewerModal) && (
          <div
            onClick={
              props?.value?.shouldOpenMultipleDocViewerModal
                ? handleViewMultipleDocs
                : handleViewPdf
            }
          >
            <FileIcon strokeColor="#0056D6" width={16} height={18.5} />
          </div>
        )}
      </div>
    </>
  );
};

export default ViewIconCell;
