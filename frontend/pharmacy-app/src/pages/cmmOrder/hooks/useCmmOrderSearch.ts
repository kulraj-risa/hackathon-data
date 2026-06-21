import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { FilterValues } from "../../../data-model/filterValues";
import { resetSingleOrderData } from "../../../redux/slice/cmm/cmmSingleOrderSlice";
import {
  appendUniqueNycbsOrderesFromApi,
  appendUniqueNycbsSearchedOrderesFromApi,
  fetchUniqueNycbsOrderesFromApi,
  searchNycbsPharmaOrdersFromApi,
} from "../../../redux/slice/nycbsPharmaExternal/nycbsPharmaOrder";
import { AppDispatch } from "../../../redux/store/store";

export const useCmmOrderSearch = (
  finalLimitToUse: number,
  validFilters: FilterValues[],
  processFilterData: (validFilters: FilterValues[]) => any,
) => {
  const dispatch = useDispatch<AppDispatch>();
  const { getTableDataFromContext, setTableDataForContext } =
    useTablesContext();
  const tableAttributes = getTableDataFromContext("allCmmOrders");

  const [initialSearch, setInitialSearch] = useState<boolean>(true);
  const [searchText, setSearchText] = useState("");
  const [batchNumberRetreived, setBatchNumberRetreived] = useState<number[]>(
    [],
  );
  const [filterState, setFilterState] = useState<boolean>(false);
  const unsubscribeRef = useRef<Promise<() => void>[]>([]);

  const search = () => {
    dispatch(searchNycbsPharmaOrdersFromApi(searchText, finalLimitToUse));
  };

  const fetchAllOrders = () => {
    if (validFilters?.[0]?.["filterCount"] > 0) {
      const finalFilterDataToSend = processFilterData(validFilters);
      setFilterState(true);
      dispatch(
        fetchUniqueNycbsOrderesFromApi(finalLimitToUse, finalFilterDataToSend),
      );
    } else {
      setFilterState(false);
      dispatch(fetchUniqueNycbsOrderesFromApi(finalLimitToUse));
    }
  };

  const resetAndFetchOrders = () => {
    dispatch(resetSingleOrderData());
    setTableDataForContext("allCmmOrders", { lastBatchFetched: 0 });
    setBatchNumberRetreived([]);
    const isValidSearch = searchText && searchText.length >= 3;
    isValidSearch ? search() : fetchAllOrders();
  };

  const handleSearch = (searchText: string) => {
    setSearchText(searchText);
    setInitialSearch(false);
  };

  // Handle search text changes
  useEffect(() => {
    if (!initialSearch) {
      setTableDataForContext("allCmmOrders", {
        lastBatchFetched: 0,
        endIndex: 0,
        startIndex: 0,
        currentActiveArrayIndex: 0,
        currentStartPage: 1,
      });
      setBatchNumberRetreived([]);

      const isValidSearch = searchText && searchText.length >= 3;
      if (isValidSearch) {
        search();
      } else {
        fetchAllOrders();
      }
    }
  }, [searchText, initialSearch]);

  // Handle batch fetching
  useEffect(() => {
    if (batchNumberRetreived.length > 0 && filterState == false) {
      if (searchText && searchText.length > 3) {
        dispatch(
          appendUniqueNycbsSearchedOrderesFromApi(searchText, finalLimitToUse),
        );
      } else {
        dispatch(appendUniqueNycbsOrderesFromApi(finalLimitToUse));
      }
    }
  }, [JSON.stringify(batchNumberRetreived)]);

  // Initial search setup
  useEffect(() => {
    if (initialSearch) return;
    unsubscribeRef.current = [];
    const isValidSearch = tableAttributes?.searchedText ?? "";
    isValidSearch ? search() : fetchAllOrders();
  }, [searchText, dispatch, initialSearch]);

  return {
    searchText,
    initialSearch,
    batchNumberRetreived,
    setBatchNumberRetreived,
    filterState,
    setFilterState,
    search,
    fetchAllOrders,
    resetAndFetchOrders,
    handleSearch,
  };
};
