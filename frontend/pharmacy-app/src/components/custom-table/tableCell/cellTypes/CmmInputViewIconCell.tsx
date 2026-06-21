import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { controlToastState } from "risa-oasis-ui_v2";
import { ModalId } from "../../../../enums/modalId";
import {
  createSharedAbortControllerRef,
  useAbortableFetch,
} from "../../../../hooks/useAbortableFetch";
import { useModalOpener } from "../../../../hooks/useModalOpener";
import { fetchLatestCmmScreenshotUrl } from "../../../../pages/cmmOrder/utils/fetchCmmDocument";
import {
  closeModal,
  setOpenedModalId,
} from "../../../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import DocViewerModal from "../../../modals/docViewerModal/docViewerModalNew";

const cmmScreenshotAbortControllerRef = createSharedAbortControllerRef();

interface CmmInputViewIconCellProps {
  value: string;
  [key: string]: any;
}

export const CmmInputViewIconCell: React.FC<CmmInputViewIconCellProps> = ({
  value,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { openedModalId } = useModalOpener();
  const { metaData } = useSelector((state: RootState) => state.modalSliceNew);

  const isFallback = value.startsWith("fallback:");
  const orderId = isFallback ? value.replace("fallback:", "") : value;

  const [cmmScreenshotUrl, setCmmScreenshotUrl] = useState<string | null>(null);
  const [showNoScreenshotMessage, setShowNoScreenshotMessage] = useState(false);

  const fetchScreenshot = useCallback(
    async (signal: AbortSignal, id: string) => {
      return await fetchLatestCmmScreenshotUrl(id, signal);
    },
    [],
  );

  const { runFetch, abort, loading } = useAbortableFetch(fetchScreenshot, {
    sharedAbortControllerRef: cmmScreenshotAbortControllerRef,
  });

  const isModalOpenForThisCell =
    openedModalId === ModalId.DOC_VIEWER_MODAL && metaData?.orderId === orderId;

  const handleViewCmmInput = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (orderId) {
      setCmmScreenshotUrl(null);
      setShowNoScreenshotMessage(false);

      dispatch(
        setOpenedModalId({
          id: ModalId.DOC_VIEWER_MODAL,
          metaData: { orderId },
        }),
      );

      if (isFallback) {
        setCmmScreenshotUrl("/AuthNotFound.pdf");
        return;
      }

      const result = await runFetch(orderId);

      if (result.success && result.data) {
        setCmmScreenshotUrl(result.data);
      } else if (result.success && !result.data) {
        setShowNoScreenshotMessage(true);
      } else if (!result.success && result.error?.name !== "AbortError") {
        console.error("Error fetching CMM screenshot:", result.error);
        controlToastState("cmm-screenshot-load-failed");
        dispatch(closeModal());
      } else if (result.error?.name === "AbortError") {
        dispatch(closeModal());
      }
    }
  };

  const handleModalClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    abort();
    dispatch(closeModal());
    setCmmScreenshotUrl(null);
    setShowNoScreenshotMessage(false);
  };

  if (!value) {
    return (
      <div className="flex items-center justify-center font-semibold text-gray-300">
        View
      </div>
    );
  }

  return (
    <>
      <div
        className="flex cursor-pointer items-center justify-center font-semibold text-tertiaryBlue-5 hover:text-tertiaryBlue-6"
        onClick={handleViewCmmInput}
      >
        View
      </div>
      {isModalOpenForThisCell && (
        <div onClick={(e) => e.stopPropagation()}>
          <DocViewerModal
            fileUrl={cmmScreenshotUrl ?? undefined}
            onClose={handleModalClose}
            type="cmm_screenshot"
            isExternalLoading={loading}
            showNoScreenshotMessage={showNoScreenshotMessage}
          />
        </div>
      )}
    </>
  );
};

export default CmmInputViewIconCell;
