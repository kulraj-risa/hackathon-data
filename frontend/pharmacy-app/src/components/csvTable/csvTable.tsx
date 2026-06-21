import React, { useMemo, useState } from "react";
import { SpinningLoader } from "risa-oasis-ui_v2";
import CustomTable from "../custom-table/custom-table";
import {
  generateTableData,
  generateTableHeaders,
  sanitizeCsvCell,
} from "./utils/csvTableDataGenerator";

export interface CsvData {
  headers: string[];
  rows: string[][];
}

export interface CsvTableProps {
  csvData: CsvData;
  className?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

const CsvTable: React.FC<CsvTableProps> = ({
  csvData,
  className = "",
  loading = false,
  error = null,
  emptyMessage = "No CSV data available",
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { tableHeaders, tableData, filteredTableData } = useMemo(() => {
    if (!csvData || !csvData.headers.length || !csvData.rows.length) {
      return { tableHeaders: [], tableData: [], filteredTableData: [] };
    }

    const headers = generateTableHeaders(csvData);
    const data = generateTableData(csvData);

    let filteredData = data;
    if (searchTerm.trim()) {
      const jcodeField = csvData.headers.find(
        (header) =>
          header.toLowerCase().includes("j_code") ||
          header.toLowerCase() === "j_code",
      );

      if (jcodeField) {
        const sanitizedJcodeField = sanitizeCsvCell(jcodeField);
        filteredData = data.filter((row) => {
          const jcodeValue = row[sanitizedJcodeField];
          return (
            jcodeValue &&
            jcodeValue
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        });
      }
    }

    return {
      tableHeaders: headers,
      tableData: data,
      filteredTableData: filteredData,
    };
  }, [csvData, searchTerm]);

  const handleJcodeSearch = (searchText: string) => {
    setSearchTerm(searchText);
  };

  const hasJcodeField = csvData?.headers?.some(
    (header) =>
      header.toLowerCase().includes("jcode") ||
      header.toLowerCase().includes("j_code") ||
      header.toLowerCase() === "j_code",
  );

  const searchPlaceholder = hasJcodeField ? "Search by JCode..." : "Search...";

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8">
        <SpinningLoader />
        <div className="text-gray-600">Loading CSV data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!csvData || !csvData.headers.length || !csvData.rows.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <CustomTable
        tableHeaders={tableHeaders}
        tableData={filteredTableData}
        tableName="csv-table"
        hideSearchBar={false}
        hidePagination={false}
        disableHoverAndClick={true}
        isFetching={loading}
        count={filteredTableData.length}
        totalCount={filteredTableData.length}
        itemsPerPage={15}
        pagesPerView={5}
        searchingText={handleJcodeSearch}
        placeholder={searchPlaceholder}
      />
    </div>
  );
};

export default CsvTable;
