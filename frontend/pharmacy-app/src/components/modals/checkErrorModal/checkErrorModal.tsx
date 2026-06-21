import { useState } from "react";
import { closeModal, controlToastState, Modal } from "risa-oasis-ui_v2";
import { logError } from "../../../utils/customLogger";

interface CheckErrorModalProps {
  id: string;
  reasons: string;
}
const CheckErrorModal = (props: CheckErrorModalProps) => {
  const [textAreaData, setTextAreaData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textToDisplay = props.reasons.split("\n").map((reason, index) => {
    return reason;
  });

  const handleTextAreaChange = (event) => {
    setTextAreaData(event.target.value);
  };

  const url =
    process.env.REACT_APP_ENV === "development"
      ? "https://priorauth-dev-jj6e7pfhra-uc.a.run.app/api/v1/coligomed/rerun-error-cases"
      : "https://priorauth-jj6e7pfhra-uc.a.run.app/api/v1/coligomed/rerun-error-cases";

  const data = {
    order_id_list: [props.id],
  };

  const postRequest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      controlToastState("rerun-success");
      closeModal(`${props.id}-check_error`);
    } catch (error) {
      logError(error as Error, "Error while re-running the error order");
      controlToastState("rerun-error");
      throw new Error("Error while re-running the error order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      dialogId={`${props.id}-check_error`}
      onSave={() => postRequest()}
      title={"Check Error"}
      saveButtonText={"Re-run"}
      cancelText={"Mark as Closed"}
      onClose={() => setTextAreaData("")}
      disableSave={isLoading}
    >
      <div className="error-check-modal-container">
        <div className="error-check-modal-container__reason">
          {textToDisplay.map((reason, index) => {
            return <div key={index}>{reason.trim()}</div>;
          })}
        </div>
        <div className="error-check-modal-container__comments">
          Comments
          <textarea
            id={`${props.id}-check_error`}
            name={`${props.id}-check_error`}
            rows={4}
            cols={90}
            placeholder="Enter your comments here"
            value={textAreaData}
            onChange={handleTextAreaChange}
          ></textarea>
        </div>
      </div>
    </Modal>
  );
};

export default CheckErrorModal;
