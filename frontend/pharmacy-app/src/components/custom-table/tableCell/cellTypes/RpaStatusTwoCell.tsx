import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FirestoreService } from "../../../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../../../api/firebase/references";
import { MedicalPaOrder } from "../../../../data-model/medicalPaOrdersModel";
import {
  DocWriteBackStatus,
  EVWriteBackStatus,
} from "../../../../enums/evBvWriteBackStatus";
import { MedicalPaOrdersAuthStatus } from "../../../../enums/medicalPaOrdersAuthStatus";
import { ModalId } from "../../../../enums/modalId";
import { useDeepCompareEffect } from "../../../../hooks/useDeepCompareEffect";
import {
  setMetaData,
  setOpenedModalId,
} from "../../../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../../../redux/store/store";
import CommentIcon from "../../../../svg/comment";
import FileIcon from "../../../../svg/fileIcon";
import { generateDataForDocWithSideNavModalFromSingleMedicalPaOrder } from "../../../../utils/createDataForDocWithSideNavModal";
import { createDataForWriteBackTrail } from "../../../modals/imageViewerWithBadgesModal/utils/createDataForWriteBackTrail";

interface RpaStatusTwoCellProps {
  value: {
    evWriteBackStatus: string;
    documentUploadStatus: string;
    id: string;
    masterAuthStatus: string;
  };
  [key: string]: any;
}

export const RpaStatusForExternalCell: React.FC<RpaStatusTwoCellProps> = ({
  value,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [orderData, setOrderData] = useState<MedicalPaOrder | null>(null);
  const [modalType, setModalType] = useState<"image" | "doc">("image");

  const { data: authStatusOptions } = useSelector(
    (state: RootState) => state.authStatusOptions,
  );
  const fetchOrderDataForGivenOrderId = async (id: string) => {
    try {
      const response = (await FirestoreService.getDocument(
        FirestoreDocumentReference.medicalPaOrders(id),
      )) as MedicalPaOrder;
      setOrderData(response);
    } catch (error) {
      setOrderData(null);
    }
  };

  const getTabDataWithImagesForEvWriteBack = async () => {
    if (
      !orderData?.id ||
      !authStatusOptions ||
      authStatusOptions.length === 0
    ) {
      return;
    }
    try {
      const response = await createDataForWriteBackTrail(
        orderData?.id ?? "",
        authStatusOptions ?? [],
      );
      dispatch(
        setMetaData({
          tabs: response.tabs,
          showLoading: false,
        }),
      );
    } catch (error) {
      dispatch(
        setMetaData({
          tabs: [],
          showLoading: false,
        }),
      );
    }
  };

  useDeepCompareEffect(() => {
    if (modalType === "image") {
      getTabDataWithImagesForEvWriteBack();
    }
    if (modalType === "doc") {
      dispatch(
        setMetaData({
          items: generateDataForDocWithSideNavModalFromSingleMedicalPaOrder(
            orderData ?? {},
          ),
          showLoader: false,
        }),
      );
    }
  }, [orderData, modalType]);

  const shiftMasterQueueStatusForWhichModalShouldOpen = useMemo(
    () => [
      MedicalPaOrdersAuthStatus.Pending,
      MedicalPaOrdersAuthStatus.AuthRequired,
      MedicalPaOrdersAuthStatus.Query,
      MedicalPaOrdersAuthStatus.Hold,
    ],
    [],
  );

  return (
    <div className="table-cell-rpa-status ml-auto flex h-fit w-fit items-center justify-center gap-2">
      {(value.evWriteBackStatus === EVWriteBackStatus.SUCCESS ||
        shiftMasterQueueStatusForWhichModalShouldOpen.includes(
          value?.masterAuthStatus as MedicalPaOrdersAuthStatus,
        )) && (
        <div
          onClick={() => {
            setOrderData((prev) => null);
            fetchOrderDataForGivenOrderId(value.id);
            setModalType("image");
            dispatch(
              setOpenedModalId({
                id: ModalId.IMAGE_VIEWER_WITH_BADGES_MODAL,
                metaData: {
                  showLoading: true,
                },
              }),
            );
          }}
        >
          <CommentIcon color={"#0056D6"} height={"24px"} width={"24px"} />
        </div>
      )}
      {(value.documentUploadStatus === DocWriteBackStatus.SUCCESS ||
        shiftMasterQueueStatusForWhichModalShouldOpen.includes(
          value?.masterAuthStatus as MedicalPaOrdersAuthStatus,
        )) && (
        <div
          onClick={() => {
            setOrderData((prev) => null);
            fetchOrderDataForGivenOrderId(value.id);
            setModalType("doc");
            dispatch(
              setOpenedModalId({
                id: ModalId.DOC_VIEWER_WITH_SIDE_NAVIGATION,
                metaData: {
                  items: [],
                  showLoader: true,
                },
              }),
            );
          }}
        >
          <FileIcon strokeColor={"#0056D6"} height={18} width={16} />
        </div>
      )}
    </div>
  );
};

export default RpaStatusForExternalCell;
