import { useState } from "react";
import { Modal } from "risa-oasis-ui_v2";
import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { ModalId } from "../../../../enums/modalId";
import SideNavElement from "../../../sideNavElement/sideNavElement";
import ModalPatientInfoBar from "../shared/ModalPatientInfoBar";
import PrescriptionImage from "./components/presciptionImage";
import Prescription from "./components/prescription";

interface ExpandableTableRowMedicationProps {
  onClose: () => void;
  rowData?: CmmOrderTableRowData;
}

const tabs = [
  { id: "prescription-image", label: "Prescription Image" },
  { id: "prescription", label: "Prescription" },
];

const ExpandableTableRowMedication = ({
  onClose,
  rowData,
}: ExpandableTableRowMedicationProps) => {
  const [selectedTab, setSelectedTab] = useState<string>("prescription-image");

  const renderContent = () => {
    switch (selectedTab) {
      case "prescription-image":
        return <PrescriptionImage rowData={rowData} />;
      case "prescription":
        return <Prescription rowData={rowData} />;
      default:
        return null;
    }
  };
  return (
    <Modal
      dialogId={ModalId.EXPANDABLE_TABLE_ROW_MEDICATION_MODAL}
      onSave={onClose}
      title={"Medication"}
      saveButtonText={"Close"}
      cancelText={"Cancel"}
      onCancel={onClose}
      onClose={onClose}
      heightPercentage={90}
      showSingleButton={true}
      hideFooter={true}
    >
      <div className="flex h-full flex-col">
        <ModalPatientInfoBar rowData={rowData} />

        <div className="flex flex-1 gap-1 overflow-hidden">
          <div className="side-nav--container flex w-[25%] flex-col overflow-y-auto">
            {tabs.map((tab) => (
              <SideNavElement
                key={tab.id}
                id={tab.id}
                label={tab.label}
                active={tab.id === selectedTab}
                onSelect={(id) => setSelectedTab(id)}
              />
            ))}
          </div>
          <div className="content--container flex h-full w-[75%] flex-1 flex-col pb-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExpandableTableRowMedication;
