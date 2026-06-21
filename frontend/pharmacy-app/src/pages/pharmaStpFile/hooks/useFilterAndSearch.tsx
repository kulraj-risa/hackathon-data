import { FilterValues } from "../../../data-model/filterValues";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";
import { useFilterAndSearchEffect } from "./useFilterAndSearchEffect";
import {
  PharmaStpFileFilterPayload,
  useFilterPayload,
} from "./useFilterPayload";
import { usePaginationReset } from "./usePaginationReset";
import { PharmaStpFileTableState } from "./usePharmaStpFileTableData";
import { useSearchTerm } from "./useSearchTerm";
import { useValidFilters } from "./useValidFilters";

export interface UseFilterAndSearchReturn {
  filterPayload: PharmaStpFileFilterPayload | null;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  paginationResetCount: number;
  validFilters: FilterValues[];
}

export const useFilterAndSearch = (
  initialDataFetchingExecuted: boolean,
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>,
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >,
  dateFromStart: string,
  dateFromEnd: string,
  pageSize: number = 120,
): UseFilterAndSearchReturn => {
  const { searchTerm, setSearchTerm } = useSearchTerm();

  const { paginationResetCount, setPaginationResetCount } =
    usePaginationReset();

  const validFilters = useValidFilters();

  const { filterPayload } = useFilterPayload(
    validFilters,
    searchTerm,
    initialDataFetchingExecuted,
    dateFromStart,
    dateFromEnd,
    pageSize,
  );

  useFilterAndSearchEffect(
    filterPayload,
    initialDataFetchingExecuted,
    setTableData,
    setPharmaStpFileState,
    setPaginationResetCount,
  );

  return {
    filterPayload,
    searchTerm,
    setSearchTerm,
    paginationResetCount,
    validFilters,
  };
};
