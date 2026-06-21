import { useState } from "react";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { TableNames } from "../../../enums/tableNames";

export interface UseSearchTermReturn {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

export const useSearchTerm = (): UseSearchTermReturn => {
  const { getTableDataFromContext } = useTablesContext();

  const tableAttributes = getTableDataFromContext(
    TableNames.PHARMA_STP_FILE_ORDERS,
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    tableAttributes?.searchedText ?? "",
  );

  return {
    searchTerm,
    setSearchTerm,
  };
};
