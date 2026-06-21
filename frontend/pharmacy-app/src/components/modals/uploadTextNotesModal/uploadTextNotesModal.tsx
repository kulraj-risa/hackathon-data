import { useEffect, useState } from "react";
import { Modal, openModal } from "risa-oasis-ui_v2";

interface UploadTextNotesModalProps {
  onClose: () => void;
  modalType?: "text-note" | "track-status" | "send-sftp";
}

interface BatchItem {
  filename: string;
  dow: string;
  receiveTime: string;
  input: number;
}

const UploadTextNotesModal = ({
  onClose,
  modalType = "text-note",
}: UploadTextNotesModalProps) => {
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  useEffect(() => {
    openModal("upload-text-notes-modal");
  }, []);

  // Dummy data for demonstration - this should come from your actual data source
  const batchData: BatchItem[] = [
    {
      filename: "NYCBS_RXSM_RisaHealth_20260108Batch1.csv",
      dow: "01/08/2026",
      receiveTime: "18:05",
      input: 10,
    },
  ];

  const handleCheckboxChange = (filename: string) => {
    setSelectedBatches((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename],
    );
  };

  const handleSave = () => {
    console.log("Selected batches:", selectedBatches);
    console.log("Modal type:", modalType);
    // Add your API call here based on modalType
    onClose();
  };

  const getTitle = () => {
    switch (modalType) {
      case "track-status":
        return "Select Batch - Track Status";
      case "send-sftp":
        return "Select Batch - Submit file";
      default:
        return "Select Batch - Upload Outcome to EMR";
    }
  };

  const getSaveButtonText = () => {
    switch (modalType) {
      case "track-status":
        return "Track Status";
      case "send-sftp":
        return "Submit file";
      default:
        return "Upload Outcome to EMR";
    }
  };

  return (
    <Modal
      dialogId="upload-text-notes-modal"
      title={getTitle()}
      onClose={onClose}
      onSave={handleSave}
      saveButtonText={getSaveButtonText()}
      cancelText="Cancel"
      heightPercentage={70}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full table-fixed border-collapse">
            <thead className="sticky top-0 bg-gray-100">
              <tr className="border-b border-gray-300">
                <th className="w-12 p-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBatches(batchData.map((b) => b.filename));
                      } else {
                        setSelectedBatches([]);
                      }
                    }}
                    checked={
                      selectedBatches.length === batchData.length &&
                      batchData.length > 0
                    }
                  />
                </th>
                <th className="w-2/5 p-3 text-left font-semibold">Filename</th>
                <th className="w-1/5 p-3 text-left font-semibold">DOW</th>
                <th className="w-1/5 p-3 text-left font-semibold">
                  Receive Time
                </th>
                <th className="w-1/5 p-3 text-left font-semibold">Input</th>
              </tr>
            </thead>
            <tbody>
              {batchData.map((batch, index) => (
                <tr
                  key={batch.filename}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="w-12 p-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer"
                      checked={selectedBatches.includes(batch.filename)}
                      onChange={() => handleCheckboxChange(batch.filename)}
                    />
                  </td>
                  <td className="w-2/5 overflow-hidden text-ellipsis whitespace-nowrap p-3 text-sm">
                    {batch.filename}
                  </td>
                  <td className="w-1/5 p-3 text-sm">{batch.dow}</td>
                  <td className="w-1/5 p-3 text-sm">{batch.receiveTime}</td>
                  <td className="w-1/5 p-3 text-sm">{batch.input}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default UploadTextNotesModal;
