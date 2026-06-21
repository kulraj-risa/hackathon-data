import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Modal, openModal } from "risa-oasis-ui_v2";
import { usePharmaFormFields } from "../../../context/pharmaFormFieldsContext";
import CustomRadioButton from "../../customRadioButton/customRadioButton";

interface InsuranceDetailsErrorModalProps {
  onCloseModal: () => void;
  onSuccessfullSave: () => void;
}

const InsuranceDetailsErrorModal = (props: InsuranceDetailsErrorModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const { formFieldsData, setFormFieldsData } = usePharmaFormFields();

  useEffect(() => {
    openModal("insurance-details-error-modal");
  }, []);

  const handleModalClose = () => {
    props.onCloseModal();
  };

  const handleModalSave = () => {
    props.onSuccessfullSave();
  };

  const reasons = useMemo(() => {
    return ["Wrong form is picked", "Error in insurance information used"];
  }, []);

  return (
    <Modal
      dialogId={"insurance-details-error-modal"}
      onSave={handleModalSave}
      title={"Report Inaccuracy"}
      saveButtonText={"Save"}
      cancelText={"Cancel"}
      onClose={handleModalClose}
      disableSave={!selectedReason || !comments}
    >
      <div className="insurance-error-modal--container" data-oid="4r3vyu4">
        <fieldset className="flex w-full flex-col" data-oid="2mk73lf">
          <legend
            className="text-h12 font-semibold leading-none text-primaryGray-1"
            data-oid="hs0pd8i"
          >
            Select the Reason
          </legend>
          <div className="mt-3 flex w-full flex-col leading-loose text-stone-900 max-md:max-w-full">
            <div className="flex w-full flex-col gap-1 rounded-md max-md:max-w-full">
              {reasons.map((reason, index) => (
                <CustomRadioButton
                  key={index}
                  name={"insurance-error-reason"}
                  value={reason}
                  checked={selectedReason === reason}
                  label={reason}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSelectedReason(e.target.value)
                  }
                />
              ))}
            </div>
          </div>
        </fieldset>
        <div className="insurance-error-modal--comments mt-5 flex flex-col gap-2">
          <div className="insurance-error-modal--comments-header text-tiny font-normal text-primaryGray-2">
            Comments
          </div>
          <div className="insurance-error-modal--comments-textbox">
            <textarea
              className="h-20 w-full resize-none rounded-md border border-primaryGray-14 p-3 text-small placeholder-gray-400 focus:outline-none"
              placeholder="Enter your comments here"
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InsuranceDetailsErrorModal;
