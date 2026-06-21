import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import DynamicSingleSideTab from "../../components/dynamicSingleSideTab/dynamicSingleSideTab";

const Configurations = () => {
  const [activeTab, setActiveTab] = useState("pa-cases-schema");
  const navigate = useNavigate();
  const sideNavElements = [
    { id: "pa-cases-schema", label: "PA Cases Schema" },
    { id: "worklist-config", label: "Worklist Columns" },
    { id: "pa-cases-data", label: "PA Cases Data (BQ)" },
    { id: "field-mapping", label: "Field Mapping (BQ)" },
    { id: "credentials-configuration", label: "Credentials Configuration" },
  ];

  return (
    <>
      <div className="home-container">
        <div className="home-container__content">
          <div className="home-container__content-left">
            {sideNavElements.map((sideNavElement) => (
              <DynamicSingleSideTab
                key={sideNavElement.id}
                id={sideNavElement.id}
                label={sideNavElement.label}
                isActive={activeTab === sideNavElement.id}
                onTabClick={(id: string) => {
                  setActiveTab(id);
                  navigate(id);
                }}
              />
            ))}
          </div>
          <div className="home-container__content-right">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default Configurations;
