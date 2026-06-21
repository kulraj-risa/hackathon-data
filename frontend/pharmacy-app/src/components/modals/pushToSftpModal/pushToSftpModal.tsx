import { useState } from "react";
import { useDispatch } from "react-redux";
import { Modal, SpinningLoader } from "risa-oasis-ui_v2";
import { ModalId } from "../../../enums/modalId";
import { TableNames } from "../../../enums/tableNames";
import { AppDispatch } from "../../../redux/store/store";
import CustomTable from "../../custom-table/custom-table";
import { onClose } from "./actionHandlers/onClose";
import { onSendToSftp } from "./actionHandlers/onSendToSftp";
import { useTableDataForSftpPush } from "./hooks/useTableDataForSftpPush";
import { generatePushToSftpTableData } from "./utils/pushToSftpTableDataGenerator";
import { toggleCheckboxSelection } from "./utils/toggleCheckBoxSelection";

const PushToSftpModal = () => {
  const {
    tableData,
    setTableData,
    isLoading,
    showInlineLoader,
    totalCount,
    setEndIndex,
  } = useTableDataForSftpPush();
  const dispatch = useDispatch<AppDispatch>();
  const [isPushing, setIsPushing] = useState(false);

  const handleSave = async () => {
    setIsPushing(true);
    try {
      await onSendToSftp(tableData, dispatch, setTableData);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <Modal
      dialogId={ModalId.PUSH_TO_SFTP_MODAL}
      title="Select Batch - Push to SFTP"
      onSave={isPushing ? () => {} : handleSave}
      saveButtonText={isPushing ? "Pushing..." : "Push to SFTP"}
      cancelText="Cancel"
      onClose={() => onClose(dispatch, setTableData)}
      heightPercentage={60}
    >
      <div className="sftp-modal-container--table h-full w-full overflow-y-auto">
        {isLoading && tableData.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2">
            <SpinningLoader />
            <span>Loading...</span>
          </div>
        ) : (
          <CustomTable
            tableHeaders={generatePushToSftpTableData()}
            tableData={tableData}
            tableName={TableNames.PUSH_TO_SFTP_MODAL_TABLE}
            itemsPerPage={10}
            pagesPerView={4}
            hideSearchBar={true}
            count={totalCount}
            totalCount={totalCount}
            toggleCheckboxSelection={(data) =>
              toggleCheckboxSelection(data, setTableData)
            }
            hideSelectAllCheckbox={true}
            endIndexOfTable={setEndIndex}
            showInLineLoader={showInlineLoader}
          />
        )}
      </div>
    </Modal>
  );
};

export default PushToSftpModal;
