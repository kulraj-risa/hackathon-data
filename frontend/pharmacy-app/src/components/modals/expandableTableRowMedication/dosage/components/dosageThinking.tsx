import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";
import { DosageHeader } from "./ui";

interface DosageThinkingProps {
  rowData: CmmOrderTableRowData;
}
const DosageThinking = ({ rowData }: DosageThinkingProps) => {
  const headerData = {
    drugQuantity: rowData?.drugQuantity,
    drugQuantityQualifier: rowData?.drugQuantityQualifier,
    drugDaysSupply: rowData?.drugDaysSupply,
    drugConfidenceScore: rowData?.drugConfidenceScore,
    drugFetchedFrom: rowData?.drugFetchedFrom,
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA]">
      <DosageHeader data={headerData} />
      <div className="flex h-full w-full flex-col items-start gap-4 bg-white px-3 py-2">
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="text-tiny font-regular">Drug Picked From</div>
            <div className="text-sm font-regular">
              {rowData?.drugFetchedFrom ?? "N/A"}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-regular">Drug Confidence Score</div>
            <div className="text-sm font-regular">
              {rowData?.drugFetchedFrom === "llm"
                ? "1"
                : (rowData?.drugConfidenceScore ?? "N/A")}
            </div>
          </div>
        </div>
        <div className="flex w-11/12 flex-col gap-2">
          <div className="text-xs font-regular">Drug Picked Thinking</div>
          <div className="rounded bg-primaryGray-16 p-4 text-sm font-regular">
            {rowData?.drugPickedThinking ?? "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DosageThinking;
