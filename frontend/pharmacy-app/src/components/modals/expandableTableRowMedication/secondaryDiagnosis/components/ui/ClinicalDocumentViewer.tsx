import React from "react";
import PdfRender from "../../../../../pdfRender/pdfRender";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

interface ClinicalDocumentViewerProps {
  docUrl: string;
  error: string;
}

export const ClinicalDocumentViewer: React.FC<ClinicalDocumentViewerProps> = ({
  docUrl,
  error,
}) => {
  if (error || !docUrl) {
    return (
      <div className="clinical-document-viewer flex h-full w-full items-center justify-center overflow-y-auto border border-primaryGray-15 px-2 pb-2">
        <ErrorState message="Failed to load clinical document" />
      </div>
    );
  }

  return (
    <div className="clinical-document-viewer h-full w-full overflow-y-auto border border-primaryGray-15 px-2 pb-2">
      {docUrl ? <PdfRender file={docUrl} /> : <EmptyState />}
    </div>
  );
};
