import React from "react";
import CustomTable from "../../../../../custom-table/custom-table";
import { DiagnosisCodesTableHeader } from "../../../../diagnosisCodeModal/table/diagnosisTableData";

interface DiagnosisTableProps {
  tableData: any[];
}

export const DiagnosisTable: React.FC<DiagnosisTableProps> = ({
  tableData,
}) => {
  return (
    <CustomTable
      tableHeaders={DiagnosisCodesTableHeader}
      tableData={tableData}
      tableName={"Diagnosis Codes"}
      hideSearchBar={true}
      totalCount={tableData.length}
      itemsPerPage={10}
      pagesPerView={10}
      count={tableData.length}
    />
  );
};
