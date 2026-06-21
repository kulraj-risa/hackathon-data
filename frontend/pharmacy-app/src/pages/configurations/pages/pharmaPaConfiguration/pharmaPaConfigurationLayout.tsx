import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import SingleTab from "../../../../components/singleTab/singleTab";

const PharmaPaConfigurationLayout = () => {
  const tabs = useMemo(() => {
    return [
      {
        id: "send-to-plan-config",
        label: "Send To Plan",
      },
      {
        id: "pbm-configurations",
        label: "PBM Configurations",
      },
      {
        id: "drugs-configuration",
        label: "Drugs Configuration",
      },
      {
        id: "clinical-questionaire",
        label: "Clinical Questionaire",
      },
    ];
  }, []);

  return (
    <div className="pharma-pa-configuration-layout flex h-full flex-col overflow-hidden">
      <div className="pharma-pa-configuration-layout__header text-h11 font-semibold">
        Pharma PA Configuration
      </div>
      <div className="pharma-pa-configuration-layout__tabs mb-2 flex flex-row border-b border-primaryGray-16">
        {tabs.map((tab) => (
          <SingleTab key={tab.id} id={tab.id} label={tab.label} />
        ))}
      </div>
      <div className="pharma-pa-configuration-layout__content flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default PharmaPaConfigurationLayout;
