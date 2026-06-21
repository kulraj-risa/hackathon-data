import { useState } from "react";
import { Modal } from "risa-oasis-ui_v2";
import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { ModalId } from "../../../../enums/modalId";
import SideNavElement from "../../../sideNavElement/sideNavElement";
import ModalPatientInfoBar from "../shared/ModalPatientInfoBar";
import ClinicalAttachement from "./components/clinicalAttachement";
import DiagnosisCodes from "./components/diagnosisCodes";

interface ExpandableTableRowDiagnosisProps {
  onClose: () => void;
  rowData?: CmmOrderTableRowData;
}

const tabs = [
  { id: "diagnosis-codes", label: "Diagnosis Codes" },
  { id: "clinical-attachments", label: "Clinical Attachments" },
];

const ExpandableTableRowDiagnosis = ({
  onClose,
  rowData,
}: ExpandableTableRowDiagnosisProps) => {
  const [selectedTab, setSelectedTab] = useState<string>("diagnosis-codes");

  const renderContent = () => {
    switch (selectedTab) {
      case "diagnosis-codes":
        return <DiagnosisCodes rowData={rowData} />;
      case "clinical-attachments":
        return <ClinicalAttachement rowData={rowData} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      dialogId={ModalId.EXPANDABLE_TABLE_ROW_DIAGNOSIS_MODAL}
      onSave={onClose}
      title={"Diagnosis"}
      saveButtonText={"Close"}
      cancelText={"Cancel"}
      onCancel={onClose}
      onClose={onClose}
      heightPercentage={90}
      showSingleButton={true}
      hideFooter={true}
    >
      <div className="flex h-full w-full flex-col">
        <ModalPatientInfoBar rowData={rowData} />

        <div className="flex flex-1 gap-1 overflow-hidden">
          <div className="side-nav--container flex w-[20%] flex-col overflow-y-auto">
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
          <div className="content--container flex h-full w-[80%] flex-1 flex-col bg-primaryGray-16">
            {renderContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExpandableTableRowDiagnosis;
