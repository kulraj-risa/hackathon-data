import { useEffect, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { Modal, SpinningLoader } from "risa-oasis-ui_v2";
import { getFileDownloadUrl } from "../../../api/firebase/firestoreService";

interface ImageViewerModalProps {
  fileUrls: string[];
  onClose: () => void;
  filePaths?: string[];
  shouldHideZoom?: boolean;
  showLoader?: boolean;
}

const ImageviewerModal = (props: ImageViewerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [fileUrls, setFileUrls] = useState<string[]>(props?.fileUrls || []);

  useEffect(() => {
    const totalCount = Math.max(
      props?.fileUrls?.length || 0,
      props?.filePaths?.length || 0,
    );
    setTotalImages(totalCount);
    setLoadedImagesCount(0);
    setIsLoading(totalCount > 0);

    if (props?.filePaths && props?.filePaths?.length > 0) {
      getFileUrls();
    }
  }, [props?.filePaths, props?.fileUrls]);

  const getFileUrls = async () => {
    if (!props?.filePaths || props?.filePaths?.length === 0) return;

    try {
      const urls = await Promise.all(
        props.filePaths.map((filePath) => getFileDownloadUrl(filePath)),
      );
      setFileUrls(urls);
    } catch (error) {
      console.error("Error fetching file URLs:", error);
    }
  };

  const handleDownload = async () => {
    try {
      // Download the first image if available
      const firstImageUrl = fileUrls[0];
      if (!firstImageUrl) return;

      const response = await fetch(firstImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "image.jpg";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      props?.onClose();
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleImageLoad = () => {
    setLoadedImagesCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= totalImages) {
        setIsLoading(false);
      }
      return newCount;
    });
  };

  return (
    <Modal
      dialogId={"image-viewer-modal"}
      onSave={handleDownload}
      title={"Image Viewer"}
      saveButtonText={"Download"}
      cancelText={"Cancel"}
      heightPercentage={90}
      onCancel={props?.onClose}
      onClose={props?.onClose}
      hideFooter={true}
    >
      <div className="image-viewer-modal--container relative h-full w-full overflow-scroll">
        {props?.showLoader ? (
          <>
            <div className="loader-container flex h-full items-center justify-center gap-4">
              <SpinningLoader />
              <span>Loading images...</span>
            </div>
          </>
        ) : (
          <>
            {(fileUrls && fileUrls.length > 0) ||
            (props?.filePaths && props?.filePaths.length > 0) ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
                      <div className="text-sm text-gray-500">
                        {loadedImagesCount}/{totalImages} images loaded
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col space-y-4 p-4">
                  {fileUrls.map((url, index) => (
                    <div key={index} className="relative w-full">
                      {!props?.shouldHideZoom ? (
                        <Zoom>
                          <img
                            src={url}
                            alt={`Image ${index + 1}`}
                            onLoad={handleImageLoad}
                            className="block w-full"
                          />
                        </Zoom>
                      ) : (
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          onLoad={handleImageLoad}
                          className="block w-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-sm text-gray-500">
                  No images available
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ImageviewerModal;
