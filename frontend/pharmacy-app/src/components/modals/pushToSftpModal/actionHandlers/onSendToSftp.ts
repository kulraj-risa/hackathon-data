import { controlToastState } from "risa-oasis-ui_v2";
import {
  pushFilesToSftp,
  PushToSftpResponse,
} from "../../../../api/postCall/pushToSftp";
import { PushToSftpTableDataModel } from "../../../../data-model/pushToSftpDataModel";
import { ModalId } from "../../../../enums/modalId";
import { PushToSftpModalTableColumnKeys } from "../../../../enums/tableColumnKeys";
import { setOpenedModalId } from "../../../../redux/slice/modalSliceNew";
import { AppDispatch } from "../../../../redux/store/store";

export const onSendToSftp = async (
  tableData: PushToSftpTableDataModel[],
  dispatch: AppDispatch,
  setTableData: (data: PushToSftpTableDataModel[]) => void,
): Promise<PushToSftpResponse | null> => {
  const selectedData = tableData.filter(
    (item) => item[PushToSftpModalTableColumnKeys.SELECT]?.isChecked,
  );

  if (selectedData.length === 0) {
    controlToastState("push-to-sftp-no-selection");
    return null;
  }

  const selectedFilenames = selectedData
    .map((item) => item[PushToSftpModalTableColumnKeys.FILENAME])
    .filter((filename): filename is string => filename !== undefined);

  if (selectedFilenames.length === 0) {
    controlToastState("push-to-sftp-no-selection");
    return null;
  }

  try {
    const response = await pushFilesToSftp(selectedFilenames);

    // Close the push to SFTP modal and reset table data
    setTableData([]);

    dispatch(
      setOpenedModalId({
        id: ModalId.SFTP_STATUS_MODAL,
        metaData: {
          sftpResponse: response,
        },
      }),
    );

    return response;
  } catch (error) {
    console.error("Error pushing files to SFTP:", error);
    controlToastState("push-to-sftp-failure");
    return null;
  }
};
