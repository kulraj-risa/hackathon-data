import { PushToSftpModalTableColumnKeys } from "../../../../enums/tableColumnKeys";
import { TableCellType, TableHeader } from "../../../custom-table/table";

export const generatePushToSftpTableData = (): TableHeader[] => {
  return [
    {
      label: "",
      key: PushToSftpModalTableColumnKeys.SELECT,
      order: 1,
      width: 5,
      type: TableCellType.CHECKBOX,
    },
    {
      label: "Filename",
      key: PushToSftpModalTableColumnKeys.FILENAME,
      order: 2,
      width: 45,
      type: TableCellType.STRING,
      sortable: true,
    },
    {
      label: "DOW",
      key: PushToSftpModalTableColumnKeys.DUMPED_AT,
      order: 3,
      width: 20,
      type: TableCellType.STRING,
      sortable: true,
    },
    {
      label: "Receive Time",
      key: PushToSftpModalTableColumnKeys.RECEIVE_TIME,
      order: 4,
      width: 20,
      type: TableCellType.STRING,
      sortable: true,
    },
    {
      label: "Input Rec#",
      key: PushToSftpModalTableColumnKeys.ROW_COUNT,
      order: 5,
      width: 10,
      type: TableCellType.STRING,
      sortable: true,
    },
  ];
};
