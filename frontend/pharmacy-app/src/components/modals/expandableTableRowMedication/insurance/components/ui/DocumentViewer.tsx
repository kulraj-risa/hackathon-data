import React from "react";
import { Pagination } from "risa-oasis-ui_v2";
import { NycbDocumentModel } from "../../../../../../data-model/nycbsPharmaOrder";
import PdfRender from "../../../../../pdfRender/pdfRender";
import { DocumentInfo } from "./DocumentInfo";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

interface DocumentViewerProps {
  docUrl: string;
  error: string;
  currentDocument?: NycbDocumentModel;
  totalDocuments: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  docUrl,
  error,
  currentDocument,
  totalDocuments,
  currentPage,
  onPageChange,
}) => {
  return (
    <>
      <div className="insurance-card-viewer relative h-full w-full overflow-y-auto border border-primaryGray-15">
        <DocumentInfo document={currentDocument} />
        {docUrl ? (
          <PdfRender file={docUrl} />
        ) : error || !docUrl ? (
          <ErrorState />
        ) : (
          <EmptyState message="No document preview available" />
        )}
      </div>
      {!error && totalDocuments > 1 && (
        <div className="mt-2 flex w-full items-center justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalDocuments}
            onPrevious={() => {
              onPageChange(currentPage - 1);
            }}
            onNext={() => {
              onPageChange(currentPage + 1);
            }}
          />
        </div>
      )}
    </>
  );
};
