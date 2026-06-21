import Fuse from "fuse.js";
import { useEffect, useRef, useState } from "react";
import SearchIcon from "../../svg/search-icon";
import "./autoSelectDropdown.scss";

interface EmittedDataModel {
  name: string;
  value: string;
  required: boolean;
  isDirty?: boolean;
}
interface AutoSelectDropdownProps {
  onOptionSelect?: (data: EmittedDataModel) => void;
  id: string;
  required?: boolean;
  defaultValue?: string;
  errorMessage?: string;
  label?: string;
  options?: { value: string; label: string }[];
  minCharLengthForSearch?: number;
  shouldEmitLogEvent?: (boolean) => void;
}

const fuzzySearchOptions = {
  includeScore: true,
  threshold: 0.3,
  distance: 200,
  useExtendedSearch: true,
  keys: ["label"],
};

const AutoSelectDropdown = (props: AutoSelectDropdownProps) => {
  const [searchResult, setSearchResult] = useState<
    { value: string; label: string }[]
  >([]);
  const [inputText, setInputText] = useState("");
  const [isSearching, setisSearching] = useState(false);
  const [error, setError] = useState<string>("");
  const [active, setActive] = useState<boolean>(false);
  const [shouldOpenAtTop, setShouldOpenAtTop] = useState(false);
  const [dropdownOptions, setDropDownOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [minCharLength, setMinCharLength] = useState<number>(3);
  const [actualValue, setActualValue] = useState<string>("");
  const [shouldEmitLogEvent, setShouldEmitLogEvent] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleFuzzySearch = (value: string) => {
    setInputText(value);
    setActualValue(value);

    // Emit the value change
    props?.onOptionSelect?.({
      name: props?.id ?? "",
      value: value,
      required: props?.required ?? false,
      isDirty: true,
    });

    if (value.trim().length < minCharLength) {
      setSearchResult([]);
      setisSearching(false);
      return;
    } else {
      setisSearching(true);
      const options = fuzzySearchOptions;

      const fuse = new Fuse(dropdownOptions, options);

      const result = fuse.search(value);
      setSearchResult(result.map((item) => item.item));
    }
  };

  useEffect(() => {
    if (props.minCharLengthForSearch) {
      setMinCharLength(props.minCharLengthForSearch);
    }
  }, [props.minCharLengthForSearch]);

  useEffect(() => {
    const handlePositionCheck = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        const topPercentage = (containerRect.top / viewportHeight) * 100;

        setShouldOpenAtTop(topPercentage > 50);
      }
    };

    const handleClick = () => {
      window.addEventListener("resize", handlePositionCheck);
      window.addEventListener("scroll", handlePositionCheck);

      // Trigger initial position check on click
      handlePositionCheck();
    };

    const handleMouseLeave = () => {
      window.removeEventListener("resize", handlePositionCheck);
      window.removeEventListener("scroll", handlePositionCheck);
    };

    // Add click event listener to the container
    if (containerRef.current) {
      containerRef.current.addEventListener("click", handleClick);
      containerRef.current.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("click", handleClick);
        containerRef.current.removeEventListener(
          "mouseleave",
          handleMouseLeave,
        );
      }
      window.removeEventListener("resize", handlePositionCheck);
      window.removeEventListener("scroll", handlePositionCheck);
    };
  }, []);

  useEffect(() => {
    if (props.defaultValue) {
      setInputText(props.defaultValue);
      setActualValue(props.defaultValue);
      props?.onOptionSelect?.({
        name: props?.id ?? "",
        value: props.defaultValue,
        required: props?.required ?? false,
      });
    }
    setShouldEmitLogEvent(true);
  }, [props.defaultValue, dropdownOptions]);

  useEffect(() => {
    props?.shouldEmitLogEvent?.(shouldEmitLogEvent);
  }, [shouldEmitLogEvent]);

  useEffect(() => {
    if (props?.options && props.options?.length > 0) {
      setDropDownOptions(props?.options);
    }
  }, [props.options]);

  useEffect(() => {
    if (props?.required) {
      if (inputText.trim().length === 0 || actualValue.trim().length === 0) {
        setError(props?.errorMessage ?? "This field is required");
      } else {
        setError("");
      }
    }
  }, [props?.required, inputText, actualValue]);

  const handleClickOutside = () => {
    if (dropdownRef.current) {
      const isValidInput = dropdownOptions.some(
        (data) => data.value === inputText,
      );

      if (!isValidInput) {
        setInputText(inputText);
        setActualValue(inputText);
        props?.onOptionSelect?.({
          name: props?.id ?? "",
          value: inputText,
          required: props?.required ?? false,
          isDirty: true,
        });
      }
      setisSearching(false);
    }
  };

  useEffect(() => {
    dropdownRef?.current?.addEventListener("mouseleave", handleClickOutside);

    return () => {
      dropdownRef?.current?.removeEventListener(
        "mouseleave",
        handleClickOutside,
      );
    };
  }, [inputText]);

  return (
    <div className="auto-select-dropdown__container" ref={containerRef}>
      <div className="auto-select-dropdown__label">
        <div className="auto-select-dropdown__label-text">
          {props?.label ?? ""}
        </div>
        {props?.required && (
          <div className="auto-select-dropdown__label-required">*</div>
        )}
      </div>
      <div
        className={
          error.trim().length > 0
            ? "auto-select-dropdown__input-holder error"
            : active
              ? "auto-select-dropdown__input-holder active"
              : "auto-select-dropdown__input-holder"
        }
      >
        <input
          type="text"
          className="auto-select-dropdown__input"
          placeholder="Enter text to search..."
          onChange={(e) => handleFuzzySearch(e.target.value)}
          value={inputText}
          id={props.id}
          name={props.id}
          onFocus={() => setActive(true)}
          onBlur={() => {
            setActive(false);
          }}
        />
        <div className="auto-select-dropdown__input-search">
          <SearchIcon />
        </div>
      </div>
      {error.trim().length > 0 && (
        <div className="auto-select-dropdown__error">{error}</div>
      )}
      {isSearching && (
        <>
          {" "}
          <div
            className={
              shouldOpenAtTop
                ? "auto-select-dropdown__dropdown bottom"
                : error.trim().length > 0
                  ? "auto-select-dropdown__dropdown top_error"
                  : "auto-select-dropdown__dropdown top"
            }
            ref={dropdownRef}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              const target = e.target as HTMLElement;
              const selectedOption = searchResult.find(
                (item) => item.value === target.id,
              );
              if (selectedOption) {
                setInputText(selectedOption.label);
                setActualValue(selectedOption.value);
                setisSearching(false);
                setSearchResult([]);
                props?.onOptionSelect?.({
                  name: props.id,
                  value: selectedOption.value,
                  required: props?.required ?? false,
                  isDirty: true,
                });
              }
            }}
          >
            {searchResult.length === 0 && inputText.length >= minCharLength ? (
              <>
                <div className="auto-select-dropdown__dropdown-item">
                  No results found
                </div>
              </>
            ) : (
              <>
                {searchResult.map((item) => (
                  <div
                    key={item.value}
                    className="auto-select-dropdown__dropdown-item"
                    id={item.value}
                  >
                    {item.label}
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AutoSelectDropdown;
