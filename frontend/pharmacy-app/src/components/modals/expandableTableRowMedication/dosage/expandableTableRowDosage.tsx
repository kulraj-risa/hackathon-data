import { useState } from "react";
import { Modal } from "risa-oasis-ui_v2";
import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { ModalId } from "../../../../enums/modalId";
import SideNavElement from "../../../sideNavElement/sideNavElement";
import ModalPatientInfoBar from "../shared/ModalPatientInfoBar";
import Dosage from "./components/dosage";
import DosageThinking from "./components/dosageThinking";

interface ExpandableTableRowDosageProps {
  onClose: () => void;
  rowData?: CmmOrderTableRowData;
}

const tabs = [
  { id: "prescription", label: "Prescription" },
  { id: "dosage-thinking", label: "Dosage Thinking" },
];

const ExpandableTableRowDosage = ({
  onClose,
  rowData,
}: ExpandableTableRowDosageProps) => {
  const [selectedTab, setSelectedTab] = useState<string>("prescription");

  const renderContent = () => {
    switch (selectedTab) {
      case "prescription":
        return <Dosage rowData={rowData ?? ({} as CmmOrderTableRowData)} />;
      case "dosage-thinking":
        return (
          <DosageThinking rowData={rowData ?? ({} as CmmOrderTableRowData)} />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      dialogId={ModalId.EXPANDABLE_TABLE_ROW_DOSAGE_MODAL}
      onSave={onClose}
      title={"Dosage"}
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
          <div className="content--container flex h-full w-[75%] flex-1 flex-col bg-primaryGray-16 pb-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExpandableTableRowDosage;
