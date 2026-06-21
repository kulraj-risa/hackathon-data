import { useMemo } from "react";
import { useSelector } from "react-redux";
import { FilterValues } from "../../../data-model/filterValues";
import { TableNames } from "../../../enums/tableNames";
import { RootState } from "../../../redux/store/store";

export const useValidFilters = (): FilterValues[] => {
  const { filters } = useSelector((state: RootState) => state.filterValues);

  const validFilters = useMemo(() => {
    return filters.filter(
      (filter) => filter.name === TableNames.PHARMA_STP_FILE_ORDERS,
    );
  }, [filters]);

  return validFilters;
};
