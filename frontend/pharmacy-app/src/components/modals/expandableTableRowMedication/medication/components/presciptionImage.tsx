import React from "react";
import { CmmOrderTableRowData } from "../../../../../data-model/cmmOrderTableRowData";
import { usePrescriptionImageData } from "../hooks/usePrescriptionImageData";
import { MedicationProps } from "../types";
import {
  ErrorState,
  LoadingState,
  MedicationHeader,
  PrescriptionImagesViewer,
} from "./ui";

const PrescriptionImage: React.FC<MedicationProps> = ({ rowData }) => {
  const { prescriptionImageUrls, loading, error, handleImageLoad } =
    usePrescriptionImageData({
      rowId: rowData?.id,
    });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-1 border-primaryGray-15 bg-[#F7F9FA]">
      <MedicationHeader data={rowData as CmmOrderTableRowData} />
      {loading ? (
        <div className="flex h-full w-full flex-row items-center justify-center gap-2 p-8">
          <LoadingState message="Loading prescription images..." />
        </div>
      ) : error ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
          <ErrorState
            message="Failed to load prescription images"
            error={error}
          />
        </div>
      ) : (
        <PrescriptionImagesViewer
          imageUrls={prescriptionImageUrls}
          onImageLoad={handleImageLoad}
        />
      )}
    </div>
  );
};

export default PrescriptionImage;
