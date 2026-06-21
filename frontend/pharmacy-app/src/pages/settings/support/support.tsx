import moment from "moment";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, TextInput } from "risa-oasis-ui_v2";
import DragDropUpload from "../../../components/dragDropUpload/dragDropUpload";
import { RootState } from "../../../redux/store/store";

const Support = () => {
  const [textAreaData, setTextAreaData] = useState("");
  const [checkIfDataExists, setCheckIfDataExists] = useState({
    subject: false,
    concern: false,
    files: false,
  });
  const { data: providerDetails } = useSelector(
    (state: RootState) => state.providerDetails,
  );
  const onInputChange = (data) => {
    if (data.value !== "") {
      setCheckIfDataExists({ ...checkIfDataExists, subject: true });
    } else {
      setCheckIfDataExists({ ...checkIfDataExists, subject: false });
    }
  };

  const checkIfFileIsUploaded = (fileListLength) => {
    if (fileListLength > 0) {
      setCheckIfDataExists({ ...checkIfDataExists, files: true });
    } else {
      setCheckIfDataExists({ ...checkIfDataExists, files: false });
    }
  };

  const handleTextAreaChange = (event) => {
    setTextAreaData(event.target.value);
    if (event.target.value !== "") {
      setCheckIfDataExists({ ...checkIfDataExists, concern: true });
    } else {
      setCheckIfDataExists({ ...checkIfDataExists, concern: false });
    }
  };

  return (
    <div className="support-layout">
      <div className="support">
        <div className="support__header">Support</div>
        <div className="support__details">
          <div className="support__contact">
            <div className="support__contact-header">Contact Info</div>
            <div className="support__contact-details">
              <div className="support__contact-detail">
                <div className="support__contact-detail-header">Email</div>
                <div className="support__contact-detail-value">
                  :&nbsp;mail@risalabs.ai
                </div>
              </div>
              <div className="support__contact-detail">
                <div className="support__contact-detail-header">
                  Phone number
                </div>
                <div className="support__contact-detail-value">
                  :&nbsp;+16502486454
                </div>
              </div>
            </div>
          </div>
          <div className="support__report-issue">
            <div className="support__report-issue-header">Report Issue</div>
            <div className="support__report-subject">
              <TextInput
                label="Subject"
                placeholder="Enter your subject"
                id="report-subject"
                onChange={onInputChange}
              />
            </div>
            <div className="support__report-concern">
              Concern
              <textarea
                id="report-concern"
                name="report-concern"
                rows={4}
                cols={90}
                placeholder="Type your concern"
                value={textAreaData}
                onChange={handleTextAreaChange}
              ></textarea>
            </div>
            <div className="support__report-files">
              <DragDropUpload
                id={"support-attachments"}
                multipleFilesAllowed={true}
                allowedFileTypes={[".jpg", ".png"]}
                maxFileSize={5 * 1024 * 1024}
                fileListLength={checkIfFileIsUploaded}
                filePath={`user/providers/${providerDetails?.DocID}/support_attachments/${moment().toISOString()}`}
              />
            </div>
          </div>
        </div>
        <div className="support__actions">
          <Button
            buttonType="secondary"
            size="medium"
            disabled={false}
            onClick={() => {}}
          >
            Cancel
          </Button>
          <Button
            buttonType="primary"
            size="medium"
            disabled={
              !checkIfDataExists.concern ||
              !checkIfDataExists.files ||
              !checkIfDataExists.subject
            }
            onClick={() => {}}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Support;
