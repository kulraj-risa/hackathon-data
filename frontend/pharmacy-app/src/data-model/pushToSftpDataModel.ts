import { PushToSftpModalTableColumnKeys } from "../enums/tableColumnKeys";

export interface PushToSftpTableDataModel {
  [PushToSftpModalTableColumnKeys.SELECT]: {
    id?: string;
    label?: string;
    isChecked?: boolean;
  };
  [PushToSftpModalTableColumnKeys.FILENAME]?: string;
  [PushToSftpModalTableColumnKeys.ROW_COUNT]?: number;
  [PushToSftpModalTableColumnKeys.DUMPED_AT]?: string;
}
