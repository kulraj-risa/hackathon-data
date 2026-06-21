import { Item } from "firebase/analytics";
import { useDispatch } from "react-redux";
import { ModalId } from "../../../../enums/modalId";
import { setOpenedModalId } from "../../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../../redux/store/store";
import EyeIcon from "../../../../svg/eye";
import FileIcon from "../../../../svg/fileIcon";
import { ApiReponseViewerProps } from "../../../apiResponseViewer/apiReponseViewer";

interface ViewIconForScreenshotOrApiResponseProps {
  value: {
    shouldHideIcon?: boolean;
    shouldShowApiResponseModal?: boolean;
    shouldShowScreenshotModal?: boolean;
    apiResponseData?: ApiReponseViewerProps;
    screenshotData?: {
      filePath?: string;
    };
    shouldShowPdfIcon?: boolean;
    pdfData?: {
      filePath?: string;
      title?: string;
    };
    shouldOpenMultipleDocViewerModal?: boolean;
    multipleDocPaths?: Item[];
  };
}

const ViewIconForScreenshotOrApiResponse = (
  props: ViewIconForScreenshotOrApiResponseProps,
) => {
  const dispatch = useDispatch<AppDispatch>();
  const handleViewScreenshot = () => {
    if (props.value?.screenshotData?.filePath) {
      dispatch(
        setOpenedModalId({
          id: ModalId.IMAGE_VIEWER_MODAL,
          metaData: { filePaths: [props.value?.screenshotData?.filePath] },
        }),
      );
    }
  };
  const handleViewApiResponse = () => {
    if (props.value?.apiResponseData) {
      dispatch(
        setOpenedModalId({
          id: ModalId.API_RESPONSE_VIEWER_MODAL,
          metaData: props.value?.apiResponseData,
        }),
      );
    }
  };
  const handleViewPdf = () => {
    if (props.value?.shouldShowPdfIcon) {
      dispatch(
        setOpenedModalId({
          id: ModalId.DOC_VIEWER_MODAL,
          metaData: {
            filePath: props.value?.pdfData?.filePath ?? "",
            title: props.value?.pdfData?.title ?? "",
            hideFooter: true,
          },
        }),
      );
    }
  };
  const handleViewMultipleDocs = () => {
    if (props.value?.shouldOpenMultipleDocViewerModal) {
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
  const determineWhichModalShouldOpen = () => {
    if (props.value?.shouldShowScreenshotModal) {
      handleViewScreenshot();
    } else if (props.value?.shouldShowApiResponseModal) {
      handleViewApiResponse();
    }
  };
  return (
    <div className="flex items-center justify-end gap-3">
      {!props.value?.shouldHideIcon && (
        <div
          onClick={() => {
            determineWhichModalShouldOpen();
          }}
        >
          <EyeIcon />
        </div>
      )}
      {(props.value?.pdfData?.filePath ||
        props.value?.shouldOpenMultipleDocViewerModal) && (
        <div>
          <FileIcon
            strokeColor="#0056D6"
            width={16}
            height={18.5}
            onClick={() => {
              props.value?.shouldOpenMultipleDocViewerModal
                ? handleViewMultipleDocs()
                : handleViewPdf();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ViewIconForScreenshotOrApiResponse;
