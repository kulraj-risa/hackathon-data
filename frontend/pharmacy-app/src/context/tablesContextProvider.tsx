import React, { createContext, ReactNode, useContext, useState } from "react";

export type TableData = {
  [tableName: string]: {
    searchedText?: string;
    currentStartPage?: number;
    currentSortableColumn?: string;
    startIndex?: number;
    endIndex?: number;
    sortAscending?: boolean;
    currentActiveArrayIndex?: number;
    lastBatchFetched?: number;
    sortByKey?: string;
    sortBySubKey?: string;
    shouldRefetch?: boolean;
  };
};

export type TablesContextType = {
  tablesData: TableData;
  getTableDataFromContext: (tableName: string) => TableData[string];
  setTableDataForContext: (
    tableName: string,
    newData: Partial<TableData[string]>,
  ) => void;
  resetTableDataForContext: () => void;
};

const TablesContext = createContext<TablesContextType>({
  tablesData: {},
  getTableDataFromContext: () => ({}),
  setTableDataForContext: () => {},
  resetTableDataForContext: () => {},
});

type TablesContextProviderProps = {
  children: ReactNode;
};

export const TablesContextProvider: React.FC<TablesContextProviderProps> = ({
  children,
}) => {
  const [tablesData, setTablesData] = useState<TableData>({});

  const getTableData = (tableName: string) => {
    return tablesData[tableName] || {};
  };

  const setTableData = (
    tableName: string,
    newData: Partial<TableData[string]>,
  ) => {
    setTablesData((prevTablesData) => {
      const updatedTablesData = {
        ...prevTablesData,
        [tableName]: {
          ...prevTablesData[tableName],
          ...newData,
        },
      };

      return updatedTablesData;
    });
  };

  const resetTableData = () => {
    setTablesData({});
  };

  return (
    <TablesContext.Provider
      value={{
        tablesData,
        getTableDataFromContext: getTableData,
        setTableDataForContext: setTableData,
        resetTableDataForContext: resetTableData,
      }}
    >
      {children}
    </TablesContext.Provider>
  );
};

export const useTablesContext = () => useContext(TablesContext);
