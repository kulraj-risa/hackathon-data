import { PushToSftpTableDataModel } from "../../../../data-model/pushToSftpDataModel";
import { closeModal } from "../../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../../redux/store/store";

export const onClose = (
  dispatch: AppDispatch,
  setTableData: (data: PushToSftpTableDataModel[]) => void,
) => {
  dispatch(closeModal());
  setTableData([]);
};
