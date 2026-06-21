import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import Zoom from "react-medium-image-zoom";
import { useDispatch } from "react-redux";
import { Modal, SpinningLoader } from "risa-oasis-ui_v2";
import { getFileDownloadUrl } from "../../../api/firebase/firestoreService";
import { ModalId } from "../../../enums/modalId";
import { closeModal } from "../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../redux/store/store";
import ArrowRight from "../../../svg/arrowRight";
import BadgeWithIcon from "../../badgeWithIcon/badgeWithIcon";
import { LoaderMessage } from "../../loaderMessage/loaderMessage";
import NewTabElements from "../../newTabElements/newTabElements";
import NoData from "../../noData/noData";

export interface ImageViewerWithBadgesProps {
  imagePath?: string;
  fromBatchDetails?: {
    batchText: string;
    batchBgColor: string;
    batchTextColor: string;
    batchId: string;
  };
  currentBatchDetails?: {
    batchText: string;
    batchBgColor: string;
    batchTextColor: string;
    batchId: string;
  };
  shouldShowBottomBorder?: boolean;
  status_updated_at?: string;
}

export interface ImageViewerWithBadgesModalProps {
  tabs: {
    id: string;
    label: string;
    imagesWithBadges?: ImageViewerWithBadgesProps[];
  }[];
  showLoading?: boolean;
  title?: string;
}

const ImageViewerWithBadgesModal = (props: ImageViewerWithBadgesModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("");
  const dispatch = useDispatch<AppDispatch>();
  const tabElements = useMemo(
    () =>
      props?.tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
      })),

    [props?.tabs],
  );

  useEffect(() => {
    if (props?.tabs?.length > 0) {
      setActiveTab(props?.tabs[0]?.id);
    }
  }, [props?.tabs]);

  const imagesWithBadges = useMemo(
    () =>
      props?.tabs.find((tab) => tab.id === activeTab)?.imagesWithBadges || [],
    [props?.tabs, activeTab],
  );
  return (
    <Modal
      dialogId={ModalId.IMAGE_VIEWER_WITH_BADGES_MODAL}
      onSave={() => {}}
      title={props?.title ?? "Image Viewer With Badges"}
      saveButtonText={"Save"}
      cancelText={"Cancel"}
      hideFooter={true}
      heightPercentage={80}
      onCancel={() => {
        dispatch(closeModal());
      }}
      onClose={() => {
        dispatch(closeModal());
      }}
    >
      <div className="image-viewer-with-badges-modal--container flex h-full flex-col overflow-hidden">
        {props?.showLoading ? (
          <>
            <div className="loader-container flex h-full w-full items-center justify-center">
              <LoaderMessage message="Loading data..." />
            </div>
          </>
        ) : (
          <>
            <div className="image-viewer-with-badges-modal--container--tabs mb-3 flex gap-2 overflow-hidden shadow-md">
              <NewTabElements
                tabs={tabElements}
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                }}
              />
            </div>
            <div className="image-viewer-with-badges-modal--container--content flex flex-1 flex-col gap-2 overflow-auto">
              {imagesWithBadges && imagesWithBadges?.length > 0 ? (
                <>
                  {imagesWithBadges &&
                    imagesWithBadges?.map((imageWithBadge, index) => (
                      <ImageViewerWithBadges
                        imagePath={imageWithBadge.imagePath}
                        fromBatchDetails={imageWithBadge.fromBatchDetails}
                        currentBatchDetails={imageWithBadge.currentBatchDetails}
                        shouldShowBottomBorder={
                          index !== imagesWithBadges?.length - 1
                        }
                        key={index + "_" + (imageWithBadge.imagePath ?? "")}
                        status_updated_at={imageWithBadge.status_updated_at}
                      />
                    ))}
                </>
              ) : (
                <>
                  <div className="flex h-full w-full items-center justify-center">
                    <NoData text="No trail data found" />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const ImageViewerWithBadges = (props: ImageViewerWithBadgesProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>("");
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    if (props?.imagePath && props?.imagePath?.trim() !== "") {
      getImageUrl();
    } else {
      setIsLoading(false);
    }
  }, [props?.imagePath]);

  const getImageUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = await getFileDownloadUrl(props?.imagePath ?? "");
      setImageUrl(url);
    } catch (error) {
      // Error fetching image URL
    } finally {
      setIsLoading(false);
    }
  }, [props?.imagePath]);

  return (
    <>
      {" "}
      <div className="image-viewer-with-badges-modal--badges mb-1 flex items-center gap-2">
        <BadgeWithIcon
          text={props?.fromBatchDetails?.batchText ?? ""}
          id={props?.fromBatchDetails?.batchId ?? ""}
          textColor={props?.fromBatchDetails?.batchTextColor ?? ""}
          bgColor={props?.fromBatchDetails?.batchBgColor ?? ""}
        />
        <ArrowRight />
        <BadgeWithIcon
          text={props?.currentBatchDetails?.batchText ?? ""}
          id={props?.currentBatchDetails?.batchId ?? ""}
          textColor={props?.currentBatchDetails?.batchTextColor ?? ""}
          bgColor={props?.currentBatchDetails?.batchBgColor ?? ""}
        />
      </div>{" "}
      {props?.status_updated_at && props?.status_updated_at?.trim() !== "" && (
        <div className="image-viewer-with-badges-modal--badges--updated-at mb-2 text-xs font-semibold text-primaryGray-1">
          Updated at:{" "}
          {moment(props?.status_updated_at ?? "").format("MM/DD/YYYY") ?? ""}
        </div>
      )}
      <div className="image-viewer-with-badges-modal--badges--image relative mb-2 border border-primaryGray-15">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <SpinningLoader />
          </div>
        )}
        <Zoom>
          <img
            src={imageUrl}
            alt={`Image`}
            onLoad={handleImageLoad}
            className="block w-full"
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        </Zoom>
      </div>
      {props?.shouldShowBottomBorder && (
        <div className="image-viewer-with-badges-modal--badges--image-border mb-2 border-b-1 border-dashed border-primaryGray-14"></div>
      )}
    </>
  );
};

export default ImageViewerWithBadgesModal;
