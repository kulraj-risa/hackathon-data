import JsonView from "@uiw/react-json-view";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { useSelector } from "react-redux";
import { Modal } from "risa-oasis-ui_v2";
import { RootState } from "../../../redux/store/store";
interface CmmInputViewerModalProps {
  onClose: () => void;
  id: string;
}

const CmmInputViewerModal = (props: CmmInputViewerModalProps) => {
  const { data } = useSelector((state: RootState) => state.cmmProcessedOrders);
  const cmmInput = data?.find((item) => item.identifier === props.id)?.cmmInput;
  return (
    <Modal
      dialogId="cmm-input-viewer-modal"
      title="CMM Input Viewer"
      saveButtonText="Save"
      cancelText="Cancel"
      onSave={() => {}}
      heightPercentage={70}
      onClose={props.onClose}
      hideFooter={true}
    >
      <div className="cmm-input--viewer rounded-md p-4">
        <JsonView style={githubLightTheme} value={{ cmmInput }} />
      </div>
    </Modal>
  );
};

export default CmmInputViewerModal;
