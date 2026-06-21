import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { FilterSection, FilterValues } from "../../../data-model/filterValues";
import { CmmFilterKeys } from "../../../enums/cmmFilterKeys";
import {
  appendUniqueNycbsOrderesFromApi,
  fetchUniqueNycbsOrderesFromApi,
} from "../../../redux/slice/nycbsPharmaExternal/nycbsPharmaOrder";
import { AppDispatch } from "../../../redux/store/store";
import {
  createFilterForFormPickedVia,
  createFilterForInsuranceCardDate,
  createFilterForStatus,
} from "../utils/createFilterDataForForm";

export const useCmmOrderFilter = (
  filters: FilterValues[],
  uniqueDrugnames: any,
  uniqueFormNames: any,
  finalLimitToUse: number,
  processFilterData: (validFilters: FilterValues[]) => any,
  initialSearch: boolean,
  fetchAllOrders: () => void,
  filterState: boolean,
  setFilterState: (state: boolean) => void,
  endIndex: number,
  allCmmOrdersTableData: any[],
) => {
  const dispatch = useDispatch<AppDispatch>();
  const { getTableDataFromContext, setTableDataForContext } =
    useTablesContext();

  const [filterData, setFilterData] = useState<FilterSection[]>([]);
  const [filterForTable, setFilterForTable] = useState<FilterValues | null>(
    null,
  );

  const validFilters = useMemo(() => {
    return filters.filter((filter) => filter.name === "allCmmOrders");
  }, [filters]);

  const createFilterForCmmDrugName = (
    uniqueDrugnames: string[] | null | undefined,
  ) => {
    return {
      id: CmmFilterKeys.DrugName,
      label: "Drug Name",
      options: Array.isArray(uniqueDrugnames)
        ? uniqueDrugnames.map((drugname) => ({
            label: drugname,
            value: drugname,
          }))
        : [],
      type: "string" as const,
    };
  };

  const createFilterForCmmFormName = (
    uniqueFormNames: string[] | null | undefined,
  ) => {
    return {
      id: CmmFilterKeys.FormName,
      label: "Form Name",
      options: Array.isArray(uniqueFormNames)
        ? uniqueFormNames.map((formname) => ({
            label: formname,
            value: formname,
          }))
        : [],
      type: "string" as const,
    };
  };

  // Build filter data
  useEffect(() => {
    setFilterData([
      createFilterForInsuranceCardDate(),
      createFilterForStatus(),
      createFilterForFormPickedVia(),
      createFilterForCmmDrugName(uniqueDrugnames?.data),
      createFilterForCmmFormName(uniqueFormNames?.data),
    ]);
  }, [uniqueDrugnames, uniqueFormNames]);

  // Handle filter changes
  useEffect(() => {
    if (
      validFilters?.[0]?.["filterCount"] > 0 &&
      filterForTable?.filterCount &&
      filterForTable?.filterCount > 0
    ) {
      setFilterState(true);
      const finalFilterDataToSend = processFilterData(validFilters);
      setTableDataForContext("allCmmOrders", {
        endIndex: 0,
        startIndex: 0,
        currentActiveArrayIndex: 0,
        currentStartPage: 1,
        lastBatchFetched: 0,
      });
      dispatch(
        fetchUniqueNycbsOrderesFromApi(finalLimitToUse, finalFilterDataToSend),
      );
    } else {
      !initialSearch && fetchAllOrders();
      setFilterState(false);
    }
  }, [JSON.stringify(filterForTable)]);

  // Handle filtered pagination
  useEffect(() => {
    if (filterState) {
      if (endIndex === allCmmOrdersTableData.length - 1) {
        const tableAttributes = getTableDataFromContext("allCmmOrders");
        const lastBatchFetched = tableAttributes.lastBatchFetched;
        const latestBatchToFetch = (lastBatchFetched ?? 0) + 1;
        setTableDataForContext("allCmmOrders", {
          lastBatchFetched: latestBatchToFetch,
        });
        const finalFilterDataToSend = processFilterData(validFilters);
        dispatch(
          appendUniqueNycbsOrderesFromApi(
            finalLimitToUse,
            finalFilterDataToSend,
          ),
        );
      }
    }
  }, [filterState, endIndex]);

  return {
    filterData,
    filterForTable,
    setFilterForTable,
  };
};
