import { Modal } from "risa-oasis-ui_v2";
import { FormDataModel } from "../../../data-model/pharmaPaFormModel";
import ConfigFormViewer from "../../formFieldsConfigViewer/configFormViewer";

interface FormConfigViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: FormDataModel;
}

const FormConfigViewerModal = (props: FormConfigViewerModalProps) => {
  return (
    <Modal
      dialogId={"form-config-viewer-modal"}
      onSave={() => {
        props.onClose();
      }}
      hideFooter
      title={"Form Configuration Viewer"}
      saveButtonText={""}
      cancelText={""}
      onCancel={() => {
        props.onClose();
      }}
      onClose={() => {
        props.onClose();
      }}
      heightPercentage={80}
    >
      <div className="flex h-full flex-col gap-3 overflow-auto">
        <ConfigFormViewer formConfig={props.formData} />
      </div>
    </Modal>
  );
};

export default FormConfigViewerModal;
