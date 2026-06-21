import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import Zoom from "react-medium-image-zoom";
import { SpinningLoader } from "risa-oasis-ui_v2";
import { getFileDownloadUrl } from "../../api/firebase/firestoreService";
import BadgeWithIcon from "../badgeWithIcon/badgeWithIcon";
import { LoaderMessage } from "../loaderMessage/loaderMessage";
import NoData from "../noData/noData";

interface GiVersionData {
  last_updated: Date;
  run_id: string;
  screenshot_path: string;
  unique_orders_stored: number;
}

interface GiScreenshotViewerProps {
  versionsData?: Record<string, GiVersionData>;
  totalUniqueOrdersStored?: number;
  showLoading?: boolean;
}

interface ProcessedImageData {
  versionId: string;
  imagePath: string;
  runId: string;
  ordersStored: number;
  lastUpdated: string;
}

const GiScreenshotViewer = (props: GiScreenshotViewerProps) => {
  const { versionsData, totalUniqueOrdersStored, showLoading } = props;

  const processedImages: ProcessedImageData[] = useMemo(() => {
    if (!versionsData) return [];

    return Object.entries(versionsData).map(([versionId, data]) => ({
      versionId,
      imagePath: data.screenshot_path,
      runId: data.run_id,
      ordersStored: data.unique_orders_stored,
      lastUpdated: moment(data.last_updated).format("MM/DD/YYYY HH:mm"),
    }));
  }, [versionsData]);

  return (
    <div className="gi-screenshot-viewer-container flex h-full flex-col overflow-hidden">
      {showLoading ? (
        <div className="loader-container flex h-full w-full items-center justify-center">
          <LoaderMessage message="Loading GI screenshots..." />
        </div>
      ) : (
        <div className="gi-screenshot-viewer-content flex flex-1 flex-col gap-2 overflow-y-auto">
          {totalUniqueOrdersStored !== undefined && (
            <div className="mb-2 border-b border-dashed border-primaryGray-5 pb-2 text-xs font-semibold text-primaryGray-1">
              Total Unique Orders Stored: {totalUniqueOrdersStored}
            </div>
          )}
          {processedImages && processedImages.length > 0 ? (
            <>
              {processedImages.map((imageData, index) => (
                <GiScreenshotItem
                  key={`${imageData.versionId}_${imageData.runId}`}
                  versionId={imageData.versionId}
                  imagePath={imageData.imagePath}
                  runId={imageData.runId}
                  ordersStored={imageData.ordersStored}
                  lastUpdated={imageData.lastUpdated}
                  shouldShowBottomBorder={index !== processedImages.length - 1}
                />
              ))}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <NoData text="No GI screenshot data found" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface GiScreenshotItemProps {
  versionId: string;
  imagePath: string;
  runId: string;
  ordersStored: number;
  lastUpdated: string;
  shouldShowBottomBorder?: boolean;
}

const GiScreenshotItem = (props: GiScreenshotItemProps) => {
  const {
    versionId,
    imagePath,
    runId,
    ordersStored,
    lastUpdated,
    shouldShowBottomBorder,
  } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>("");

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const getImageUrl = useCallback(async () => {
    try {
      const url = await getFileDownloadUrl(imagePath);
      setImageUrl(url);
    } catch (error) {
      console.error("Error fetching GI screenshot URL:", error);
      throw error;
    }
  }, [imagePath]);

  useEffect(() => {
    let cancelled = false;

    if (imagePath && imagePath.trim() !== "") {
      setIsLoading(true);
      getImageUrl()
        .then(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error("Error in image loading:", error);
            setIsLoading(false);
          }
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [imagePath, getImageUrl]);

  return (
    <>
      <div className="gi-screenshot-item-badges mb-1 flex items-center gap-2">
        <BadgeWithIcon
          text={`Version ${versionId}`}
          id={versionId}
          textColor="#005D49"
          bgColor="#E6F3F0"
        />
      </div>

      <div className="gi-screenshot-item-info mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-primaryGray-1">
          Orders Stored: {ordersStored}
        </div>
        <div className="mr-4 text-xs font-semibold text-primaryGray-1">
          Updated: {lastUpdated}
        </div>
      </div>

      <div className="gi-screenshot-item-image relative mb-2 border border-primaryGray-15">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <SpinningLoader />
          </div>
        )}
        <Zoom>
          <img
            src={imageUrl}
            alt={`GI Screenshot Version ${versionId}`}
            onLoad={handleImageLoad}
            className="block w-full"
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        </Zoom>
      </div>

      {shouldShowBottomBorder && (
        <div className="gi-screenshot-item-border mb-2 border-b-1 border-dashed border-primaryGray-14"></div>
      )}
    </>
  );
};

export default GiScreenshotViewer;
