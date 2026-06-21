import { useState } from "react";
import { useSelector } from "react-redux";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { FilterSection, FilterValues } from "../../data-model/filterValues";
import { EventsName } from "../../enums/eventsName";
import { RootState } from "../../redux/store/store";
import FilterLines from "../../svg/filter-lines";
import { getOrgIdForFetchExternalWorklist } from "../../utils/organizationHelper";
import Filter from "../filter/filter";
import SideModal from "../modals/filterModal/filterModal";

interface FilterButtonProps {
  name: string;
  filterSectionsData: FilterSection[];
  onFilterApply: (data: FilterValues) => void;
  screenName?: string;
}

const FilterButton = (props: FilterButtonProps) => {
  const [openModal, setOpenModal] = useState(false);
  const { filters } = useSelector((state: RootState) => state.filterValues);
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const orgId = getOrgIdForFetchExternalWorklist();
  const getFilterCount = () => {
    const filter = filters.find((filter) => filter.name === props.name);
    if (filter) {
      return filter.filterCount;
    }
    return 0;
  };
  return (
    <div
      className="filter-button-container flex h-10 w-fit items-center justify-center gap-1 rounded border border-primaryGray-14 px-3 py-2 hover:cursor-pointer hover:shadow-sm"
      onClick={() => {
        setOpenModal(true);
        logEventToBigQuery({
          event_name: EventsName.CLICKED_ON_FILTER,
          patient_id: "",
          user_id: user?.id ?? "",
          user_email: user?.email ?? "",
          order_id: "",
          org_id: orgId ?? "",
          additional_data: {
            screen_name: props?.screenName ?? "",
            table_name: props?.name ?? "",
          },
        });
      }}
    >
      <div className="filter-button--text text-small font-semibold text-primaryGray-3">
        Filters
      </div>
      <div className="filter-button--number flex h-5 w-5 items-center justify-center rounded-[50%] bg-grayscaleBlack-2 p-1 text-center text-tiny font-semibold text-white">
        {getFilterCount()}
      </div>
      <div className="filter-button--icon">
        <FilterLines />
      </div>
      {openModal && (
        <SideModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          children={
            <Filter
              onClose={() => setOpenModal(false)}
              name={props.name}
              onApplyFilter={(data) => props.onFilterApply(data)}
              filterSectionsData={props.filterSectionsData}
              screenName={props.screenName}
            />
          }
        />
      )}
    </div>
  );
};

export default FilterButton;
