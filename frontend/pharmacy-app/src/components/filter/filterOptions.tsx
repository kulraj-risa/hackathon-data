//TODO: make the file smaller by breaking into smaller ones
import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { logDataToConsole } from "../../utils/customLogger";
import CustomCheckBox from "../customCheckBox/customCheckBox";
import SearchBar from "../searchBar/searchBar";

interface FilterOptionsProps {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  onCheckBoxValueChange: (data: {
    id: string;
    values: string[];
    valuesLabel: string[];
    type: "string" | "number" | "date";
  }) => void;
  defaultValues?: string[];
  type?: "string" | "number" | "date";
}

const fuzzySearchOptions = {
  includeScore: true,
  threshold: 0.3,
  distance: 200,
  useExtendedSearch: true,
  keys: ["label"],
};

const FilterOptions = (props: FilterOptionsProps) => {
  const [searchedText, setSearchedText] = useState("");
  const [visibleData, setVisibleData] = useState<
    { label: string; value: string }[]
  >([]);
  const [checkedValues, setCheckedValues] = useState<{
    [key: string]: boolean;
  }>({});
  const [resetSearchBar, setResetSearchBar] = useState(false);

  // Initialize checked values when props.id changes (filter changes) or when options/defaultValues change
  useEffect(() => {
    // Initialize checked values based on defaultValues and available options
    const initialCheckedValues = Object.fromEntries(
      props.options.map((item) => [
        item.value,
        props.defaultValues?.includes(item.value) ?? false,
      ]),
    );

    const valueesWithOnlyTrue = Object.keys(initialCheckedValues).filter(
      (key) => initialCheckedValues[key] === true,
    );

    setCheckedValues(
      Object.fromEntries(valueesWithOnlyTrue.map((key) => [key, true])),
    );
  }, [props.id, props.options, props.defaultValues]);

  useEffect(() => {
    if (props.options && props.options.length > 0) {
      setVisibleData(props.options);
    }
  }, [props.options]);

  const handleCheckBoxValueChange = (checkboxData: {
    name: string;
    value: boolean;
  }) => {
    const updatedCheckedValues = {
      ...checkedValues,
      [checkboxData.name]: checkboxData.value,
    };

    const checkedKeys = Object.keys(updatedCheckedValues).filter(
      (key) => updatedCheckedValues[key],
    );

    // Find the corresponding labels for each value
    const selectedLabels = checkedKeys.map(
      (value) => optionMap[value] || value,
    );

    const dataToEmit = {
      id: props.id,
      values: checkedKeys,
      valuesLabel: selectedLabels, // Use the display labels for valuesLabel
      type: props.type ?? "string",
    };

    props.onCheckBoxValueChange(dataToEmit);
    logDataToConsole("Checked Values", dataToEmit);

    logDataToConsole("CheckBox State", {
      ...checkedValues,
      [checkboxData.name]: checkboxData.value,
    });
  };

  const handleSelectAllClicked = () => {
    const updatedCheckedValues = Object.fromEntries(
      visibleData.map((item) => [item.value, true]),
    );
    const newCheckedValues = { ...checkedValues, ...updatedCheckedValues };

    const dataToEmit = {
      id: props.id,
      values: Object.keys(newCheckedValues),
      valuesLabel: Object.keys(newCheckedValues).map(
        (key) => optionMap[key] || key,
      ),
      type: props.type ?? "string",
    };
    props.onCheckBoxValueChange(dataToEmit);
  };

  const handleClearAllClicked = () => {
    const dataToEmit = {
      id: props.id,
      values: [],
      valuesLabel: [], // Add empty valuesLabel array
      type: props.type ?? "string",
    };
    props.onCheckBoxValueChange(dataToEmit);
  };

  const optionMap = useMemo(
    () =>
      Object.fromEntries(props.options.map((opt) => [opt.value, opt.label])),
    [props.options],
  );

  useEffect(() => {
    if (searchedText.trim().length >= 3) {
      const fuse = new Fuse(props.options, fuzzySearchOptions);
      const result = fuse.search(searchedText);
      setVisibleData(result.map((data) => data.item));
    } else {
      setVisibleData(props.options);
    }
  }, [searchedText, props.options]);

  return (
    <div className="filter-options-container flex h-full flex-col gap-2 overflow-hidden px-5">
      <div className="filter-options--header mt-4 text-body font-semibold text-primaryGray-2">
        {props.label}
      </div>
      <div className="filter-options--actions flex justify-end gap-3">
        <div
          className="filter-options--actions__select-all text-small font-semibold text-tertiaryBlue-4 hover:cursor-pointer hover:shadow-sm"
          onClick={handleSelectAllClicked}
        >
          Select All
        </div>
        <div
          className="filter-options--actions__clear-all text-small font-semibold text-tertiaryRed-4 hover:cursor-pointer hover:shadow-sm"
          onClick={handleClearAllClicked}
        >
          Clear Selection
        </div>
      </div>
      <div className="filter-options--body flex flex-1 flex-col overflow-hidden">
        <div className="filter-options--body__search mb-2">
          <SearchBar
            placeHolder={"Search"}
            onSearchClick={(searchedString: string) =>
              setSearchedText(searchedString)
            }
            id={`filter-search-${props.id}`}
            enableSearchOnChange={true}
            onReset={resetSearchBar}
          />
        </div>
        <div className="filter-options--body__options flex-1 overflow-auto">
          {visibleData.map((data, index) => (
            <div
              key={index}
              className="filter-options--body__options-option px-2 py-3"
            >
              <CustomCheckBox
                label={data.label}
                id={data.value}
                isChecked={checkedValues[data.value] === true ? true : false}
                onCheckBoxValueChange={handleCheckBoxValueChange}
                className="mt-[2px] text-sm"
                height="0.875rem"
                width="0.875rem"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterOptions;
