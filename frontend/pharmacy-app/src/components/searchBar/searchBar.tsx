import React, { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import { logEventToBigQuery } from "../../api/postCall/logEventToBigQueryNew";
import { EventsName } from "../../enums/eventsName";
import { RootState } from "../../redux/store/store";
import { CrossIcon } from "../../svg/cross-icon";
import SearchIcon from "../../svg/search-icon";
import { getOrgIdForFetchExternalWorklist } from "../../utils/organizationHelper";

interface SearchBarProps {
  placeHolder: string;
  onSearchClick: (searchText: string) => void;
  enableSearchOnChange?: boolean;
  defaultValue?: string;
  id: string;
  onReset?: boolean;
  isDisabled?: boolean;
  shouldLogEvent?: boolean;
  screenName?: string;
}

const SearchBar = (props: SearchBarProps) => {
  const [value, setValue] = React.useState("");

  // Ref to store the timeout ID for debouncing
  const logEventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const orgId = getOrgIdForFetchExternalWorklist();

  const debouncedLogEvent = useCallback(
    (searchText: string) => {
      if (logEventTimeoutRef.current) {
        clearTimeout(logEventTimeoutRef.current);
      }
      logEventTimeoutRef.current = setTimeout(() => {
        logEventToBigQuery({
          event_name: EventsName.SEARCH_BAR_CLICKED,
          patient_id: "",
          order_id: "",
          user_id: user?.id ?? "",
          user_email: user?.email ?? "",
          org_id: orgId ?? "",
          additional_data: {
            screen_name: props?.screenName ?? "",
            table_name: props?.id ?? "",
            search_words: searchText.trim(),
          },
        });

        logEventTimeoutRef.current = null;
      }, 500);
    },
    [user?.id, user?.email, orgId, props.id, props.screenName],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (props.shouldLogEvent) {
      debouncedLogEvent(newValue);
    }

    props.enableSearchOnChange && props.onSearchClick(newValue.trim());
  };

  const handleSearchQuery = () => {
    if (props?.isDisabled) return;
    props.onSearchClick(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchQuery();
    }
  };

  useEffect(() => {
    if (props.defaultValue) {
      setValue(props.defaultValue);
    }
  }, [props.defaultValue, props.id]);

  useEffect(() => {
    setValue("");
  }, [props.onReset]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (logEventTimeoutRef.current) {
        clearTimeout(logEventTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="search-bar__container">
      <input
        type="text"
        placeholder={props.placeHolder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        value={value}
        id={props.id}
        name={props.id}
        disabled={props?.isDisabled}
      />
      {value.trim().length > 0 ? (
        <CrossIcon
          onClick={() => {
            if (props.isDisabled) return;
            setValue("");
            if (props.shouldLogEvent) {
              debouncedLogEvent("");
            }
            props.onSearchClick("");
          }}
        />
      ) : (
        <SearchIcon onClick={handleSearchQuery} />
      )}
    </div>
  );
};

export default SearchBar;
