import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SingleSideTab from "../../components/singleSideTab/singleSideTab";

const PharmaPaWorklistLayout = () => {
  const location = useLocation();
  const [showSideNav, setShowSideNav] = useState(false);

  const sideNavElements = [{ id: "all-orders", label: "All Orders" }];

  useEffect(() => {
    const shouldShowSideNav = sideNavElements.some((element) =>
      location.pathname.startsWith(`/pharma-pa-worklists/${element.id}`),
    );
    setShowSideNav(shouldShowSideNav);
  }, [location]);
  return (
    <div className="pharma-pa-worklist__container flex h-full w-full overflow-hidden">
      {showSideNav && (
        <div className="pharma-pa-worklist__navigation flex-[0.2]">
          {sideNavElements.map((sideNavElement) => (
            <SingleSideTab
              key={sideNavElement.id}
              id={sideNavElement.id}
              label={sideNavElement.label}
            />
          ))}
        </div>
      )}
      <div
        className={`pharma-pa-worklists__outlet w-full ${showSideNav ? `flex-[0.8]` : `flex-1`}`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default PharmaPaWorklistLayout;
