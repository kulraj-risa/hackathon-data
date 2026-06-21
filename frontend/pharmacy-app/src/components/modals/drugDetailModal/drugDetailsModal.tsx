import { useSelector } from "react-redux";
import { Modal } from "risa-oasis-ui_v2";
import { RootState } from "../../../redux/store/store";

interface DrugDetailsModalProps {
  onClose: () => void;
}
const DrugDetailsModal = (props: DrugDetailsModalProps) => {
  const { data: singleCmmOrderData } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  return (
    <Modal
      dialogId={"drug-details-modal"}
      title={"Drug Details"}
      saveButtonText={"Close"}
      cancelText={"Cancel"}
      onCancel={props.onClose}
      onClose={props.onClose}
      showSingleButton={true}
      onSave={props.onClose}
    >
      <div className="flex flex-col gap-4 p-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="text-tiny font-regular">Drug Picked From</div>
            <div className="text-sm font-regular">
              {singleCmmOrderData?.drug_fetched_from}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-regular">Drug Confidence Score</div>
            <div className="text-sm font-regular">
              {singleCmmOrderData?.drug_fetched_from === "llm"
                ? "N/A"
                : singleCmmOrderData?.drug_confidence_score}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xs font-regular">Drug Picked Thinking</div>
          <div className="rounded bg-primaryGray-16 p-4 text-sm font-regular">
            {singleCmmOrderData?.drug_fetched_from === "llm"
              ? "N/A"
              : singleCmmOrderData?.drug_picked_thinking}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DrugDetailsModal;
