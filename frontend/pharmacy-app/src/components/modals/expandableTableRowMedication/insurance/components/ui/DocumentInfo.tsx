import moment from "moment";
import React from "react";
import { NycbDocumentModel } from "../../../../../../data-model/nycbsPharmaOrder";

interface DocumentInfoProps {
  document?: NycbDocumentModel;
}

export const DocumentInfo: React.FC<DocumentInfoProps> = ({ document }) => {
  return (
    <div className="mb-1 flex w-full flex-row items-center justify-between bg-white p-3 text-sm">
      <div className="font-bold">
        {document?.document_name ?? "Insurance Card"}
      </div>
      <div>
        {" "}
        Updated on:{" "}
        {document?.visit_date
          ? moment(document?.visit_date).format("MM/DD/YYYY")
          : "N/A"}
      </div>
    </div>
  );
};
