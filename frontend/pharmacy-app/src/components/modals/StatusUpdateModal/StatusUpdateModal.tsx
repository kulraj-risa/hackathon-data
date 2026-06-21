import { useState } from "react";
import { useSelector } from "react-redux";
import { Modal, Select } from "risa-oasis-ui_v2";
import { LocalStorageKeys } from "../../../enums/localStorageKeys";
import { getAuthStatusIdFromText } from "../../../enums/medicalPaOrdersAuthStatus";
import { ModalId } from "../../../enums/modalId";
import { RootState } from "../../../redux/store/store";
import {
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "../../../utils/localStorageHelper";

interface StatusUpdateModalProps {
  onClose: () => void;
  rowData?: any;
}

export interface AuthStatusChange {
  identifier: string;
  j_code: string;
  old_value: string;
  new_value: string;
  updated_at: string;
  reason: string;
  comment: string;
  updated_by: string;
}

export const StatusUpdateModal = (props: StatusUpdateModalProps) => {
  const [reason, setReason] = useState<string | null>(null);
  const [textareaContent, setTextareaContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { metaData } = useSelector((state: RootState) => state.modalSliceNew);
  const { data: authStatusOptions } = useSelector(
    (state: RootState) => state.authStatusOptions,
  );
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const handleClose = () => {
    props.onClose();
  };

  const handleSave = () => {
    setIsLoading(true);

    if (props.rowData && reason && props.rowData.newAuthStatus) {
      const authStatusChange: AuthStatusChange = {
        identifier: props.rowData.jCodeId || "",
        j_code: props.rowData.jCodes || "",
        old_value:
          getAuthStatusIdFromText(
            props.rowData.paRequired?.text ?? "",
            authStatusOptions || [],
          ) || "",
        new_value:
          getAuthStatusIdFromText(
            props.rowData.newAuthStatus || "",
            authStatusOptions || [],
          ) || "",
        updated_at: new Date().toISOString(),
        reason: reason,
        comment: textareaContent.trim(),
        updated_by: user?.email || "",
      };
      const itemFromLocalStorage = getItemFromLocalStorage(
        `${LocalStorageKeys.AUTH_STATUS_CHANGES}_${props.rowData?.id}`,
      );
      if (itemFromLocalStorage) {
        setItemInLocalStorage(
          `${LocalStorageKeys.AUTH_STATUS_CHANGES}_${props.rowData?.id}`,
          [...itemFromLocalStorage, authStatusChange],
        );
      } else {
        setItemInLocalStorage(
          `${LocalStorageKeys.AUTH_STATUS_CHANGES}_${props.rowData?.id}`,
          [authStatusChange],
        );
      }
    }
    props.onClose();
  };

  const isFormValid = reason && textareaContent.trim().length > 0;

  return (
    <Modal
      dialogId={ModalId.STATUS_UPDATE_MODAL}
      title="Status Update"
      onClose={handleClose}
      onSave={handleSave}
      saveButtonText={isLoading ? "Saving..." : "Save"}
      cancelText="Cancel"
      disableSave={!isFormValid || isLoading}
      hideFooter={false}
    >
      <div className="flex flex-col gap-3">
        <Select
          id="status-update"
          label={metaData?.label || "Reason for Query"}
          options={metaData?.options || []}
          onOptionChange={(option) => {
            setReason(option.value);
          }}
          placeholder={metaData?.placeholder || "Select the Reason for Query"}
          value={reason ?? undefined}
        />
        <div className="mb-2 flex flex-col gap-2">
          <div className="text-tiny font-normal text-primaryGray-2">
            Comments
          </div>
          <textarea
            placeholder="Enter additional details..."
            value={textareaContent}
            onChange={(e) => setTextareaContent(e.target.value)}
            className="h-20 w-full resize-none rounded-md border border-primaryGray-14 p-3 text-small placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  );
};
