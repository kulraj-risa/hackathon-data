import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { closeModal, controlToastState, Modal } from "risa-oasis-ui_v2";
import { BadgeWithIconProps } from "../../../data-model/badgeWithIconProps";
import { RootState } from "../../../redux/store/store";
import ArrowRight from "../../../svg/arrowRight";
import BadgeDropdown from "../../badgeDropdown/badgeDropdown";
import BadgeWithIcon from "../../badgeWithIcon/badgeWithIcon";

interface AuthStatusChangeModalProps {
  id: string;
  currentStatus: BadgeWithIconProps;
  onStatusChange?: (newStatus: string) => void;
  onClose?: () => void;
  title?: string;
  rowIndex?: number;
  fieldKey?: string;
  onTableRowUpdate?: (
    rowIndex: number,
    fieldKey: string,
    newValue: any,
  ) => void;
  onValueChange?: (value: string) => void;
  jCode?: string;
  description?: string;
}

const AuthStatusChangeModal = (props: AuthStatusChangeModalProps) => {
  const [selectedBadge, setSelectedBadge] = useState<string>(
    props.currentStatus?.id ?? "",
  );

  const { data: authStatusOptions } = useSelector(
    (state: RootState) => state.authStatusOptions,
  );

  // Reset selected badge when currentStatus changes (for different rows)
  useEffect(() => {
    setSelectedBadge(props.currentStatus?.id ?? "");
  }, [props.currentStatus?.id]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const selectedBadgeData = authStatusOptions?.find(
        (badge) => badge.id === selectedBadge,
      );

      if (selectedBadgeData) {
        if (props.onStatusChange) {
          await props.onStatusChange(selectedBadge);
        }
        if (props.onValueChange) {
          props.onValueChange(selectedBadgeData.text);
        }

        if (
          props.onTableRowUpdate &&
          props.fieldKey &&
          typeof props.rowIndex === "number"
        ) {
          const updatedBadgeValue = {
            text: selectedBadgeData.text,
            color: selectedBadgeData.textColor,
            bgColor: selectedBadgeData.bgColor,
            currentStatusId: selectedBadgeData.id,
          };
          props.onTableRowUpdate(
            props.rowIndex,
            props.fieldKey,
            updatedBadgeValue,
          );
        }
      }

      closeModal(`auth-status-change-modal-${props.id}-${props.rowIndex}`);
    } catch (error) {
      controlToastState("auth-status-updated-failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    closeModal(`auth-status-change-modal-${props.id}-${props.rowIndex}`);
  };

  return (
    <Modal
      dialogId={`auth-status-change-modal-${props.id}-${props.rowIndex}`}
      onSave={handleSave}
      title={props.title || "Change Auth Status"}
      saveButtonText={isLoading ? "Saving..." : "Update Status"}
      cancelText={"Cancel"}
      onClose={handleCancel}
      onCancel={handleCancel}
      disableSave={isLoading}
    >
      <div className="flex flex-col gap-4">
        <div className="status-section">
          <div className="mb-2 text-sm font-semibold text-gray-600">
            Change status from :
          </div>
          <div className="flex items-center gap-2">
            <div className="current-status">
              <BadgeWithIcon
                text={props.currentStatus?.text ?? ""}
                id={props.currentStatus?.id ?? ""}
                bgColor={props.currentStatus?.bgColor ?? ""}
                textColor={props.currentStatus?.textColor ?? ""}
              />
            </div>
            <div className="status-change-icon">
              <ArrowRight width={16} height={16} />
            </div>
            <div className="status-to">
              <BadgeDropdown
                badgeList={authStatusOptions ?? []}
                selectedBadge={
                  authStatusOptions?.find(
                    (badge) => badge.id === selectedBadge,
                  ) || props.currentStatus
                }
                onClick={(badgeId) => {
                  setSelectedBadge(badgeId);
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-4 border-b border-gray-200 pb-4">
          <div className="j-code-section mb-3">
            <div className="mb-1 text-base font-bold text-gray-800">J Code</div>
            <div className="inline-block rounded bg-gray-100 px-2 py-1 text-sm font-normal text-gray-600">
              {props.jCode && props.jCode !== "N/A" ? props.jCode : "N/A"}
            </div>
          </div>
          {props.description && props.description !== "N/A" && (
            <div className="description-section mb-3">
              <div className="mb-1 text-sm font-semibold text-gray-600">
                Description
              </div>
              <div className="border-l-3 rounded border-blue-600 bg-gray-50 px-2 py-1 text-sm font-normal text-gray-600">
                {props.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuthStatusChangeModal;
