import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getFileDownloadUrl } from "../../../api/firebase/firestoreService";
import { LoaderMessage } from "../../../components/loaderMessage/loaderMessage";
import PdfRender from "../../../components/pdfRender/pdfRender";
import { RootState } from "../../../redux/store/store";

const ScreenshotDiffViewer = () => {
  const { baselineData, currentData, loading, error } = useSelector(
    (state: RootState) => state.cmmDiffData,
  );
  const [initialDocUrl, setInitialDocUrl] = useState<string | null>(null);
  const [finalDocUrl, setFinalDocUrl] = useState<string | null>(null);
  const initialScreenshotDownloadPath = useMemo(async () => {
    const url = await getFileDownloadUrl(baselineData?.screenshot_path ?? "");
    return url;
  }, [baselineData]);

  const finalScreenshotDownloadPath = useMemo(async () => {
    const url = await getFileDownloadUrl(currentData?.screenshot_path ?? "");
    return url;
  }, [currentData]);

  useEffect(() => {
    initialScreenshotDownloadPath.then((url) => {
      setInitialDocUrl(url);
    });
    finalScreenshotDownloadPath.then((url) => {
      setFinalDocUrl(url);
    });
  }, [initialScreenshotDownloadPath, finalScreenshotDownloadPath]);
  return (
    <>
      <div className="pharma-pa-diff-viewer__body-content-left flex h-full flex-1 flex-col overflow-hidden rounded-md border border-primaryGray-15 bg-white">
        <div className="pharma-pa-diff-viewer__body-content-left-title flex flex-row justify-between border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2 text-small font-semibold leading-6 text-primaryGray-1 shadow-md">
          Initial Screenshots
          <div>
            {baselineData?.created_at
              ? moment
                  .utc(baselineData.created_at)
                  .add(5, "hours")
                  .add(30, "minutes")
                  .format("MMM DD, YYYY h:mm A")
              : ""}
            <span className="ml-1">{`(IST)`}</span>
          </div>
        </div>
        <div className="pharma-pa-diff-viewer__body-content-left-content flex flex-1 flex-col gap-2 overflow-auto px-4 py-2">
          {initialDocUrl === null ? (
            <>
              <LoaderMessage message="Fetching initial screenshot..." />
            </>
          ) : (
            <PdfRender file={initialDocUrl} />
          )}
        </div>
      </div>
      <div className="pharma-pa-diff-viewer__body-content-left flex h-full flex-1 flex-col overflow-hidden rounded-md border border-primaryGray-15">
        <div className="pharma-pa-diff-viewer__body-content-left-title flex flex-row justify-between border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2 text-small font-semibold leading-6 text-primaryGray-1 shadow-md">
          Final Screenshots
          <div>
            {currentData?.created_at
              ? moment
                  .utc(currentData.created_at)
                  .add(5, "hours")
                  .add(30, "minutes")
                  .format("MMM DD, YYYY h:mm A")
              : ""}
            <span className="ml-1">{`(IST)`}</span>
          </div>
        </div>
        <div className="pharma-pa-diff-viewer__body-content-left-content flex flex-1 flex-col gap-2 overflow-auto px-4 py-2">
          {finalDocUrl === null ? (
            <>
              <LoaderMessage message="Fetching final screenshot..." />
            </>
          ) : (
            <PdfRender file={finalDocUrl} />
          )}
        </div>
      </div>
    </>
  );
};

export default ScreenshotDiffViewer;
