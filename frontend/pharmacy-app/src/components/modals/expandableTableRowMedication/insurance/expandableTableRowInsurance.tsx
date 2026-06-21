import { useState } from "react";
import { Modal } from "risa-oasis-ui_v2";
import { CmmOrderTableRowData } from "../../../../data-model/cmmOrderTableRowData";
import { ModalId } from "../../../../enums/modalId";
import SideNavElement from "../../../sideNavElement/sideNavElement";
import ModalPatientInfoBar from "../shared/ModalPatientInfoBar";
import InsuranceRxCards from "./components/insuranceRxCards";
import Insurers from "./components/insurers";

interface ExpandableTableRowInsuranceProps {
  onClose: () => void;
  rowData?: CmmOrderTableRowData;
}

const tabs = [
  { id: "insurance-rxcards", label: "Insurance/Rx Cards" },
  { id: "insurers", label: "Insurers" },
];

const ExpandableTableRowInsurance = ({
  onClose,
  rowData,
}: ExpandableTableRowInsuranceProps) => {
  const [selectedTab, setSelectedTab] = useState<string>("insurance-rxcards");

  const renderContent = () => {
    switch (selectedTab) {
      case "insurance-rxcards":
        return <InsuranceRxCards rowData={rowData} />;
      case "insurers":
        return <Insurers rowData={rowData} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      dialogId={ModalId.EXPANDABLE_TABLE_ROW_INSURANCE_MODAL}
      onSave={onClose}
      title={"Insurance"}
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
          <div className="content--container flex h-full w-[75%] flex-1 flex-col">
            {renderContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExpandableTableRowInsurance;
