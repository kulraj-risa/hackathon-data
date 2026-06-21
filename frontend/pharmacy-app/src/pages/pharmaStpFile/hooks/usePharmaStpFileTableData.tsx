import { useState } from "react";
import { PharmaStpFileApiResponse } from "../../../api/bigQuery/pharmaStpFileOrders";
import { PharmaStpFileModel } from "../../../data-model/nycbsPharmaOrder";

export interface PharmaStpFileTableState {
  data: PharmaStpFileApiResponse | undefined;
  loading: boolean;
  error: string | null;
  showInlineLoader: boolean;
}

export interface UsePharmaStpFileTableDataReturn {
  pharmaStpFileState: PharmaStpFileTableState;
  setPharmaStpFileState: React.Dispatch<
    React.SetStateAction<PharmaStpFileTableState>
  >;
  tableData: PharmaStpFileModel[];
  setTableData: React.Dispatch<React.SetStateAction<PharmaStpFileModel[]>>;
}

export const usePharmaStpFileTableData =
  (): UsePharmaStpFileTableDataReturn => {
    const [tableData, setTableData] = useState<PharmaStpFileModel[]>([]);
    const [pharmaStpFileState, setPharmaStpFileState] =
      useState<PharmaStpFileTableState>({
        data: undefined,
        loading: false,
        error: null,
        showInlineLoader: false,
      });

    return {
      pharmaStpFileState,
      setPharmaStpFileState,
      tableData,
      setTableData,
    };
  };
