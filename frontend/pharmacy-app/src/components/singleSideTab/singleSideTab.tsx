import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { ScreenNamesForBigQuery } from "../../enums/eventsData";
import { EventsName } from "../../enums/eventsName";
import { RootState } from "../../redux/store/store";
import { logSideNavClickEvent } from "../../utils/events";
import { getOrgIdForFetchExternalWorklist } from "../../utils/organizationHelper";

interface SingleSideTabProps {
  id: string;
  label: string;
}
const SingleSideTab = (props: SingleSideTabProps) => {
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const handleClick = () => {
    logSideNavClickEvent(props.label);
    logEventToBigQuery({
      patient_id: "",
      order_id: "",
      org_id: getOrgIdForFetchExternalWorklist() || "",
      user_id: user?.id ?? "",
      user_email: user?.email ?? "",
      event_name: EventsName.SIDE_NAV_CLICKED,
      additional_data: {
        screen_name: ScreenNamesForBigQuery.WORKLIST,
        source: props.label,
      },
    });
  };

  return (
    <>
      <NavLink
        to={props.id}
        className={({ isActive }) =>
          isActive
            ? "single-side-tab-content active"
            : "single-side-tab-content"
        }
        onClick={handleClick}
      >
        {props.label}
      </NavLink>
    </>
  );
};

export default SingleSideTab;
