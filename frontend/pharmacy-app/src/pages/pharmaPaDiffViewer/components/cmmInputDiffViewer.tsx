import JsonView from "@uiw/react-json-view";
import { useEffect, useState } from "react";
import ReactJsonViewCompare from "react-json-view-compare";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";

const CmmInputDiffViewer = () => {
  const { baselineData, currentData, loading, error } = useSelector(
    (state: RootState) => state.cmmDiffData,
  );

  const [baselineDataFromStore, setBaselineDataFromStore] = useState<
    Record<string, any> | undefined
  >(undefined);
  const [currentDataFromStore, setCurrentDataFromStore] = useState<
    Record<string, any> | undefined
  >(undefined);

  const [currentMismatchIndex, setCurrentMismatchIndex] = useState<number>(-1);
  const [cmmFormMismatchElementsLength, setCmmFormMismatchElementsLength] =
    useState<number>(0);

  const scrollToMismatch = (type: "next" | "prev") => {
    const mismatchElement = document.querySelectorAll(
      ".form-data-diff .c-line-del",
    );
    const container = document.querySelector(
      ".pharma-pa-diff-viewer__body-content-middle-content.form-data-diff",
    );
    const index =
      type === "next"
        ? Math.min(currentMismatchIndex + 1, cmmFormMismatchElementsLength - 1)
        : Math.max(currentMismatchIndex - 1, 0);

    if (mismatchElement[index] && container) {
      const elementTop = mismatchElement[index].getBoundingClientRect().top;
      const containerTop = container.getBoundingClientRect().top;
      const scrollTop = elementTop - containerTop;
      container.scrollBy({ top: scrollTop, behavior: "smooth" });
    }
    setCurrentMismatchIndex(index);
  };

  useEffect(() => {
    if (!loading && !error) {
      if (baselineData) {
        const baselineFormData = baselineData?.data?.cmm_input;

        const baselineDataWithoutCreatedAt = Object.fromEntries(
          Object.entries(baselineFormData ?? {}).filter(
            ([key]) =>
              key !== "created_at" && key !== "comment" && key !== "status",
          ),
        );

        const keys = Object.keys(baselineDataWithoutCreatedAt ?? {}).sort();

        const sortedBaselineFormData = keys.reduce(
          (acc, key) => {
            acc[key] = baselineDataWithoutCreatedAt?.[key];
            return acc;
          },
          {} as Record<string, any>,
        );
        setBaselineDataFromStore(sortedBaselineFormData);
      }
      if (currentData) {
        const currentFormData = currentData?.data?.cmm_input;
        const currentDataWithoutCreatedAt = Object.fromEntries(
          Object.entries(currentFormData ?? {}).filter(
            ([key]) =>
              key !== "created_at" && key !== "comment" && key !== "status",
          ),
        );
        const keys = Object.keys(currentDataWithoutCreatedAt ?? {}).sort();
        const sortedCurrentFormData = keys.reduce(
          (acc, key) => {
            acc[key] = currentDataWithoutCreatedAt?.[key];
            return acc;
          },
          {} as Record<string, any>,
        );
        setCurrentDataFromStore(sortedCurrentFormData);
        const objectKeys = Object.keys(
          currentData?.differences_from_baseline?.cmm_input ?? {},
        );
        setCmmFormMismatchElementsLength(objectKeys.length);
        setCmmFormMismatchElementsLength(
          objectKeys.filter((key) => key !== "comment" && key !== "status")
            .length,
        );
      }
    }
  }, [baselineData, currentData, loading, error]);
  return (
    <>
      <div className="pharma-pa-diff-viewer__body-content-left flex h-full flex-1 flex-col overflow-hidden rounded-md border border-primaryGray-15 bg-white">
        <div className="pharma-pa-diff-viewer__body-content-left-title border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2 text-small font-semibold leading-6 text-primaryGray-1 shadow-md">
          Baseline Data
        </div>
        <div className="pharma-pa-diff-viewer__body-content-left-content flex-1 overflow-auto px-4 py-2">
          <JsonView
            value={baselineDataFromStore ?? {}}
            displayDataTypes={false}
          />
        </div>
      </div>
      <div className="pharma-pa-diff-viewer__body-content-middle flex h-full flex-1 flex-col overflow-hidden rounded-md border border-primaryGray-15 bg-white">
        <div className="pharma-pa-diff-viewer__body-content-middle-title flex justify-between border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2 text-small font-semibold leading-6 text-primaryGray-1 shadow-md">
          Compared Data
          <div className="text-small text-tertiaryRed-4">
            {cmmFormMismatchElementsLength} mismatch(es)
          </div>
          <div className="mismatch_navigate cursor-pointer text-tertiaryBlue-4">
            {currentMismatchIndex + 1} / {cmmFormMismatchElementsLength}
            <span
              className="ml-2 cursor-pointer text-xs text-tertiaryBlue-4"
              onClick={() => scrollToMismatch("next")}
            >
              Next
            </span>
            <span
              className="ml-2 cursor-pointer text-xs text-tertiaryBlue-4"
              onClick={() => scrollToMismatch("prev")}
            >
              Prev
            </span>
          </div>
        </div>
        <div className="pharma-pa-diff-viewer__body-content-middle-content form-data-diff flex-1 overflow-auto px-4 py-2">
          <ReactJsonViewCompare
            oldData={baselineDataFromStore ?? {}}
            newData={currentDataFromStore ?? {}}
          />
        </div>
      </div>
      <div className="pharma-pa-diff-viewer__body-content-right flex h-full flex-1 flex-col overflow-hidden rounded-md border border-primaryGray-15 bg-white">
        <div className="pharma-pa-diff-viewer__body-content-right-title border-b border-primaryGray-15 bg-primaryGray-16 px-4 py-2 text-small font-semibold leading-6 text-primaryGray-1 shadow-md">
          Final Data
        </div>
        <div className="pharma-pa-diff-viewer__body-content-right-content flex-1 overflow-auto px-4 py-2">
          <JsonView
            value={currentDataFromStore ?? {}}
            displayDataTypes={false}
          />
        </div>
      </div>
    </>
  );
};

export default CmmInputDiffViewer;
