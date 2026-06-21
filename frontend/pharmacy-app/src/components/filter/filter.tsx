import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "risa-oasis-ui_v2";
import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { FilterSection, FilterValues } from "../../data-model/filterValues";
import { EventsName } from "../../enums/eventsName";
import { AppDispatch, RootState } from "../../redux/store/store";
import { CrossIcon } from "../../svg/cross-icon";
import { getOrgIdForFetchExternalWorklist } from "../../utils/organizationHelper";
import FilterBody from "./filterBody";

interface FilterProps {
  onClose: () => void;
  name: string;
  onApplyFilter: (data: FilterValues) => void;
  filterSectionsData: FilterSection[];
  screenName?: string;
}

// Add a type for the filter data structure
interface FilterData {
  filters: {
    [key: string]: {
      values: string[];
      valuesLabel?: string[];
      type: "string" | "number" | "date";
      label: string;
    };
  };
  filterCount: number;
}

const Filter = (props: FilterProps) => {
  const filterDataToWrite = useRef<FilterData | null>(null);
  const hasLoggedToBigQuery = useRef<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const [resetCounter, setResetCounter] = useState(0);
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const orgId = getOrgIdForFetchExternalWorklist();

  useEffect(() => {
    if (!hasLoggedToBigQuery.current) {
      logEventToBigQuery({
        event_name: EventsName.OPEN_FILTER,
        patient_id: "",
        user_id: user?.id ?? "",
        user_email: user?.email ?? "",
        order_id: "",
        org_id: orgId ?? "",
        additional_data: {
          screen_name: props?.screenName ?? "",
        },
      });
      hasLoggedToBigQuery.current = true;
    }
  }, [user?.id, user?.email, orgId, props.screenName]);

  const updateFilters = () => {
    // Create a new object that maps each filter value to include all properties
    const processedValues: {
      [key: string]: {
        values: string[];
        valuesLabel?: string[];
        type: "string" | "number" | "date";
        label: string;
      };
    } = {};

    if (filterDataToWrite.current?.filters) {
      // Process the filters and ensure they have valuesLabel
      Object.entries(filterDataToWrite.current.filters).forEach(
        ([key, filterObj]) => {
          // Make sure we preserve the valuesLabel exactly as it is
          // Only fall back to values if valuesLabel is missing
          const valuesLabel =
            filterObj.valuesLabel && filterObj.valuesLabel.length > 0
              ? filterObj.valuesLabel
              : filterObj.values;

          processedValues[key] = {
            ...filterObj,
            valuesLabel: valuesLabel,
          };
        },
      );
    }

    const dataToDispatch: FilterValues = {
      name: props.name ?? "",
      values: processedValues,
      filterCount: filterDataToWrite.current?.filterCount ?? 0,
    };

    props.onClose();
    props.onApplyFilter(dataToDispatch);
  };
  return (
    <div className="filter-container fixed flex h-full w-full flex-col overflow-hidden">
      <div className="filter-header border-primaryGray14 flex items-center justify-between gap-4 border-b px-4 py-3 text-large font-bold text-primaryGray-1">
        <div className="filter-header--text">Filters</div>
        <div
          className="filter-header--icon z-50 hover:cursor-pointer"
          onClick={props.onClose}
        >
          <CrossIcon />
        </div>
      </div>
      <div className="filter-body flex-1 overflow-hidden">
        <FilterBody
          onFilterChanged={(data) => (filterDataToWrite.current = data)}
          name={props.name}
          resetCounter={resetCounter}
          filterSectionsData={props.filterSectionsData}
        />
      </div>
      <div className="filter-footer flex items-center justify-between border-t border-primaryGray-15 px-4 py-3">
        <div
          className="filter-footer--text text-small font-bold text-primaryGray-1 hover:cursor-pointer"
          onClick={() => {
            setResetCounter(resetCounter + 1);
          }}
        >
          Clear All
        </div>
        <div className="filter-footer-actions flex gap-2">
          <Button
            disabled={false}
            children={"Cancel"}
            onClick={props.onClose}
            buttonType={"secondary"}
            size={"medium"}
          />
          <Button
            disabled={false}
            children={"Apply"}
            onClick={updateFilters}
            buttonType={"primary"}
            size={"medium"}
          />
        </div>
      </div>
    </div>
  );
};

export default Filter;
