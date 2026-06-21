import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "risa-oasis-ui_v2";
import { downloadFilesFromSftp } from "../../../api/postCall/downloadFilesFromSftp";
import { PushToSftpResponse } from "../../../api/postCall/pushToSftp";
import { useTablesContext } from "../../../context/tablesContextProvider";
import { ModalId } from "../../../enums/modalId";
import { TableNames } from "../../../enums/tableNames";
import { closeModal } from "../../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../../redux/store/store";
import ErrorContent from "./component/errorContent";
import SuccessContent from "./component/successContent";

const SftpStatus = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { setTableDataForContext } = useTablesContext();
  const [isLoading, setIsLoading] = useState(false);
  const metaData = useSelector(
    (state: RootState) => state.modalSliceNew.metaData,
  );
  const sftpResponse = metaData?.sftpResponse as PushToSftpResponse | undefined;

  const handleClose = () => {
    dispatch(closeModal());
  };

  const isValidationError = useMemo(() => {
    if (
      sftpResponse?.files_with_missing_cmm_id?.length == 0 &&
      sftpResponse?.success === false
    ) {
      return true;
    }
    return false;
  }, [sftpResponse]);
  const isSuccess = sftpResponse?.success ?? false;

  const handleSave = async () => {
    if (isSuccess && sftpResponse?.sftp_push_result) {
      setIsLoading(true);
      try {
        // Extract the response filenames from sftp_push_result
        const responseFilenames = Object.values(sftpResponse.sftp_push_result)
          .map((result) => result.filename)
          .filter((filename): filename is string => Boolean(filename));

        // Download files from SFTP
        await downloadFilesFromSftp(responseFilenames);

        setTableDataForContext(TableNames.PHARMA_STP_FILE_ORDERS, {
          shouldRefetch: true,
        });
      } catch (error) {
        console.error("Error downloading files from SFTP:", error);
      } finally {
        setIsLoading(false);
      }
    }
    dispatch(closeModal());
  };

  const message = sftpResponse?.message ?? "No response received";
  const filesWithMissingCmmId = sftpResponse?.files_with_missing_cmm_id ?? [];

  // Extract files pushed from the new response structure
  const filesPushed = useMemo(() => {
    if (!sftpResponse?.sftp_push_result) return "";
    return Object.keys(sftpResponse.sftp_push_result).join(", ");
  }, [sftpResponse]);

  const totalFilesPushed = useMemo(() => {
    if (!sftpResponse?.sftp_push_result) return undefined;
    return Object.keys(sftpResponse.sftp_push_result).length;
  }, [sftpResponse]);

  return (
    <Modal
      dialogId={ModalId.SFTP_STATUS_MODAL}
      title="SFTP Status"
      onClose={handleClose}
      onSave={handleSave}
      saveButtonText={
        isSuccess ? (isLoading ? "Downloading..." : "Download") : "Close"
      }
      cancelText="Close"
      showSingleButton={true}
      disableSave={isLoading}
    >
      {isValidationError ? (
        <div>
          <div className="sftp-status__error-container flex w-full flex-col gap-2 rounded-lg bg-tertiaryRed-11 p-5">
            Selected batch have 2 empty keys and can't be pushed to SFTP.
            <br />
            Please fill the keys and push again.
          </div>
        </div>
      ) : (
        <>
          {isSuccess ? (
            <SuccessContent
              message={message}
              filename={filesPushed}
              totalFilesPushed={totalFilesPushed}
            />
          ) : (
            <ErrorContent
              message={message}
              filesWithMissingCmmId={filesWithMissingCmmId}
              filesValidated={sftpResponse?.files_validated}
              totalRowsChecked={sftpResponse?.total_rows_checked}
              rowsMissingCmmId={sftpResponse?.rows_missing_cmm_id}
            />
          )}
        </>
      )}
    </Modal>
  );
};

export default SftpStatus;
