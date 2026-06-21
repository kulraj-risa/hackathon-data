import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUniqueDrugname } from "../../../redux/slice/cmm/uniqueDrugnameSlice";
import { fetchUniqueFormName } from "../../../redux/slice/cmm/uniqueFormNameSlice";
import { AppDispatch, RootState } from "../../../redux/store/store";
import { generateTableDataForCmmOrdersTable } from "../table/cmmOrderTableData";

export const useCmmOrderData = (
  getDrugColor?: (drugName: string | undefined | null) => string,
) => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    data: ordersData,
    loading,
    pageData,
    error,
    showInLineLoader,
  } = useSelector((state: RootState) => state.nycbsPharmaOrders);

  const { filters } = useSelector((state: RootState) => state.filterValues);

  const { data: uniqueDrugnames } = useSelector(
    (state: RootState) => state.uniqueDrugname,
  );
  const { uniqueFormNames } = useSelector(
    (state: RootState) => state.uniqueFormName,
  );

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const [allCmmOrdersTableData, setAllCmmOrdersTableData] = useState<any[]>([]);
  const [tableDataForTable, setTableDataForTable] = useState<any[]>([]);

  const tableDataRef = useRef<any[]>([]);

  useEffect(() => {
    dispatch(fetchUniqueDrugname());
    dispatch(fetchUniqueFormName());
  }, [dispatch]);

  useEffect(() => {
    tableDataRef.current = tableDataForTable;
  }, [tableDataForTable]);

  useEffect(() => {
    if (ordersData && !loading) {
      const generatedData = generateTableDataForCmmOrdersTable(
        ordersData,
        getDrugColor,
        dispatch,
      );

      if (tableDataRef.current.length > 0) {
        const expansionStateMap = new Map(
          tableDataRef.current.map((row: any) => [
            row.id,
            row.expandableRowIcon?.isExpanded || false,
          ]),
        );

        generatedData.forEach((row: any) => {
          if (expansionStateMap.has(row.id)) {
            row.expandableRowIcon.isExpanded = expansionStateMap.get(row.id);
          }
        });
      }

      setAllCmmOrdersTableData(generatedData);
      setTableDataForTable(generatedData);
    } else {
      setAllCmmOrdersTableData([]);
      setTableDataForTable([]);
    }
  }, [JSON.stringify(ordersData), loading, getDrugColor]);

  return {
    ordersData,
    loading,
    pageData,
    error,
    showInLineLoader,
    filters,
    uniqueDrugnames,
    uniqueFormNames,
    user,
    allCmmOrdersTableData,
    tableDataForTable,
    setTableDataForTable,
  };
};
