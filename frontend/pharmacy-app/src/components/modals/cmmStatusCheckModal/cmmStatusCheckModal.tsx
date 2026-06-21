import moment from "moment";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "risa-oasis-ui_v2";
import { ModalId } from "../../../enums/modalId";
import { closeModal } from "../../../redux/slice/modalSliceNew";
import { AppDispatch, RootState } from "../../../redux/store/store";
import NewTabElements from "../../newTabElements/newTabElements";
import NoData from "../../noData/noData";

interface CmmStatusCheckModalProps {
  patientName?: string;
  cmmKey?: string;
  patientMrn?: string;
  identifier?: string;
  timestamp: string;
}

const CmmStatusCheckModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { metaData } = useSelector((state: RootState) => state.modalSliceNew);
  const props = metaData as CmmStatusCheckModalProps;

  const [activeTab, setActiveTab] = useState("cmm-screenshot");
  const [zoomLevel, setZoomLevel] = useState(100);

  const tabs = [
    { id: "cmm-screenshot", label: "CMM Screenshot" },
    { id: "status-letter", label: "Status Letter" },
  ];

  const handleRefresh = () => {
    // Refresh action - for demo, just a placeholder
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  };

  const handleClose = () => {
    dispatch(closeModal());
  };

  const currentTimestamp = moment().format("MMM DD, YYYY hh:mm A [(IST)]");

  return (
    <Modal
      dialogId={ModalId.CMM_STATUS_CHECK_MODAL}
      onSave={() => {}}
      title="Status Check"
      saveButtonText="Save"
      cancelText="Cancel"
      hideFooter={true}
      heightPercentage={85}
      onCancel={handleClose}
      onClose={handleClose}
    >
      <div className="cmm-status-check-modal flex h-full flex-col overflow-hidden">
        {/* Tabs */}
        <div className="cmm-status-check-modal__tabs mb-4 border-b border-primaryGray-14">
          <NewTabElements
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        </div>

        {/* Content */}
        <div className="cmm-status-check-modal__content flex-1 overflow-hidden">
          {activeTab === "cmm-screenshot" && (
            <div className="flex h-full flex-col">
              {/* Header with timestamp and controls */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primaryGray-1">
                    Final Screenshots
                  </span>
                  <span className="text-xs text-primaryGray-9">
                    {currentTimestamp}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 rounded border border-primaryGray-14 px-2 py-1">
                    <button
                      onClick={handleZoomOut}
                      className="flex h-5 w-5 items-center justify-center text-primaryGray-5 hover:text-primaryGray-1"
                    >
                      -
                    </button>
                    <span className="min-w-[40px] text-center text-xs text-primaryGray-3">
                      {zoomLevel}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="flex h-5 w-5 items-center justify-center text-primaryGray-5 hover:text-primaryGray-1"
                    >
                      +
                    </button>
                  </div>
                  {/* Refresh buttons */}
                  <button
                    onClick={handleRefresh}
                    className="flex h-7 w-7 items-center justify-center rounded border border-primaryGray-14 text-primaryGray-5 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                    title="Refresh"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 4V10H7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.51 15C4.15839 16.8404 5.38734 18.4202 7.01166 19.5014C8.63598 20.5826 10.5677 21.1066 12.5157 20.9945C14.4637 20.8824 16.3226 20.1401 17.8121 18.8798C19.3017 17.6195 20.3413 15.9093 20.7742 14.0064C21.2072 12.1035 21.0101 10.1145 20.2126 8.33111C19.4152 6.54773 18.0605 5.06428 16.3528 4.10039C14.6451 3.1365 12.6769 2.74294 10.7335 2.97985C8.79004 3.21677 6.97691 4.07146 5.56 5.42L1 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="flex h-7 w-7 items-center justify-center rounded border border-primaryGray-14 text-primaryGray-5 hover:bg-primaryGray-16 hover:text-primaryGray-1"
                    title="Sync"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M23 4V10H17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M1 20V14H7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3.51 9.00001C4.01717 7.56679 4.87913 6.28542 6.01547 5.27543C7.1518 4.26544 8.52547 3.55978 10.0083 3.22427C11.4911 2.88876 13.0348 2.93436 14.4952 3.35679C15.9556 3.77922 17.2853 4.56473 18.36 5.64001L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0656 12.5089 21.1112 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Screenshots container */}
              <div className="flex-1 overflow-auto rounded border border-primaryGray-14 bg-primaryGray-17 p-4">
                <div
                  className="flex flex-col gap-4"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: "top left",
                  }}
                >
                  {/* Demo CMM Screenshots */}
                  <div className="w-full rounded border border-primaryGray-14 bg-white shadow-sm">
                    <DemoCmmScreenshot
                      patientName={props?.patientName}
                      cmmKey={props?.cmmKey}
                    />
                  </div>
                  <div className="w-full rounded border border-primaryGray-14 bg-white shadow-sm">
                    <DemoCmmScreenshot
                      patientName={props?.patientName}
                      cmmKey={props?.cmmKey}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "status-letter" && (
            <div className="flex h-full items-center justify-center">
              <NoData text="No status letter available" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Demo CMM Screenshot component for display
interface DemoCmmScreenshotProps {
  patientName?: string;
  cmmKey?: string;
}

const DemoCmmScreenshot = ({ patientName, cmmKey }: DemoCmmScreenshotProps) => {
  return (
    <div className="demo-cmm-screenshot">
      {/* CoverMyMeds Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#00A79D]">cover</span>
          <span className="text-lg font-bold text-[#E91E63]">my</span>
          <span className="text-lg font-bold text-[#00A79D]">meds</span>
          <span className="text-xs text-gray-400">®</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Your Preferences</span>
          <span>Verify Prescribers</span>
          <span>Help</span>
          <span>Privacy & Terms</span>
          <span>Logs</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-24 border-r border-gray-200 bg-gray-50 p-2">
          <div className="mb-4 flex flex-col items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1976D2] text-white">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
              </svg>
            </div>
            <span className="text-[10px] text-gray-500">REQUESTS</span>
          </div>
          <div className="space-y-2">
            <button className="w-full rounded bg-[#4CAF50] px-2 py-1 text-[10px] text-white">
              Send To Plan
            </button>
            <button className="w-full rounded bg-[#E91E63] px-2 py-1 text-[10px] text-white">
              Send To Prescriber
            </button>
            <button className="w-full rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600">
              Save
            </button>
            <button className="w-full rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600">
              Archive
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 p-4">
          {/* Patient Info Header */}
          <div className="mb-4 rounded bg-[#00838F] p-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">
                  {patientName?.toUpperCase() || "ROBERT RIZZI"} (Key:{" "}
                  {cmmKey || "BMWKTPDT"})
                </div>
                <div className="text-xs opacity-90">
                  PA Case ID #: 149679221
                </div>
              </div>
              <div className="text-right text-xs">
                <div>Need Help? Call us at (866)452-5017</div>
              </div>
            </div>
          </div>

          {/* Status and Drug Info */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-600">☐</span>
                <span>Sent to Plan today</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Drug</div>
              <div className="text-sm">fentaNYL 12MCG/HR 72 hr patches</div>
              <div className="text-xs text-gray-500">Form</div>
              <div className="text-sm">Humana Electronic PA Form</div>
            </div>
            <div className="col-span-2 flex justify-end">
              <span className="rounded bg-[#E91E63] px-3 py-1 text-sm font-bold text-white">
                ePA
              </span>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-2">
            {[
              "Prescriber Instructions",
              "Pharmacy Instructions",
              "Patient",
              "Drug",
              "Provider",
              "Type of Review",
              "Prescriber Next Steps",
              "Pharmacy Next Step",
              "ePA Universal",
            ].map((section) => (
              <div
                key={section}
                className="flex items-center justify-between border-b border-gray-200 py-2 text-sm"
              >
                <span>{section}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Notes */}
        <div className="w-32 border-l border-gray-200 bg-gray-50 p-2">
          <div className="mb-2 flex gap-2 text-[10px]">
            <span className="border-b-2 border-[#00A79D] pb-1 font-semibold">
              NOTES
            </span>
            <span className="text-gray-400">REMINDERS</span>
          </div>
          <div className="space-y-2 text-[10px]">
            <div className="rounded bg-white p-2 shadow-sm">
              <div className="font-semibold text-[#1976D2]">VIEW BY YOU</div>
              <div className="text-gray-400">2 minutes ago</div>
            </div>
            <div className="rounded bg-white p-2 shadow-sm">
              <div className="font-semibold text-[#1976D2]">
                VIEW BY ABHIJEET JAIN
              </div>
              <div className="text-gray-400">24 minutes ago</div>
            </div>
            <div className="rounded bg-white p-2 shadow-sm">
              <div className="font-semibold text-gray-600">REQUEST SENT</div>
              <div className="text-gray-400">24 minutes ago</div>
            </div>
            <div className="rounded bg-white p-2 shadow-sm">
              <div className="font-semibold text-gray-600">
                SAVE - EPA SEND TO PLAN
              </div>
              <div className="text-[10px] text-gray-500">BY ABHIJEET JAIN</div>
              <div className="text-gray-400">24 minutes ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CmmStatusCheckModal;
