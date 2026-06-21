import React from "react";
import { useSelector } from "react-redux";
import { FilterValues } from "../../data-model/filterValues";
import { RootState } from "../../redux/store/store";

interface FilterTagProps {
  name: string;
  onFilterApply: (data: FilterValues) => void;
}

const FilterTag: React.FC<FilterTagProps> = (props) => {
  const { filters } = useSelector((state: RootState) => state.filterValues);

  const getFilterValues = () => {
    const filter = filters.find((filter) => filter.name === props.name);
    if (filter) {
      return filter.values;
    }
    return {};
  };

  const handleRemoveFilter = (key: string) => {
    const filter = filters.find((filter) => filter.name === props.name);

    if (filter) {
      const updatedValues = { ...filter.values };
      delete updatedValues[key];

      props.onFilterApply({
        ...filter,
        values: updatedValues,
        filterCount: Object.keys(updatedValues).length,
      });
    }
  };

  const renderFilterTags = () => {
    const values = getFilterValues();
    const filterTags: JSX.Element[] = [];

    for (const [key, value] of Object.entries(values)) {
      if (value && value?.values && value?.values.length > 0) {
        const hasValueLabels =
          value?.valuesLabel && value.valuesLabel.length > 0;

        const labelsToUse =
          hasValueLabels && value.valuesLabel
            ? value.valuesLabel
            : value.values;

        let displayText = "";
        let fullText = labelsToUse.join(", ");
        let needsTooltip = false;

        if (value?.type === "date" && labelsToUse.length === 2) {
          displayText = `${labelsToUse[0]} - ${labelsToUse[1]}`;
          fullText = displayText;
        } else {
          fullText = labelsToUse.join(", ");

          let visibleLabels: string[] = [];
          let charCount = 0;
          let i = 0;
          let isTruncated = false;

          while (i < labelsToUse.length && i < 3) {
            if (charCount + labelsToUse[i].length > 100) {
              visibleLabels.push(labelsToUse[i].substring(0, 100) + "...");
              isTruncated = true;
              needsTooltip = true;

              break;
            }
            visibleLabels.push(labelsToUse[i]);
            charCount += labelsToUse[i].length;

            if (i > 0) charCount += 2;
            i++;
          }

          const remainingCount = labelsToUse.length - visibleLabels.length;

          if (remainingCount > 0 || isTruncated) {
            needsTooltip = true;
          }

          displayText =
            remainingCount > 0
              ? `${visibleLabels.join(", ")}  +${remainingCount}`
              : visibleLabels.join(", ");
        }

        filterTags.push(
          <div
            key={key}
            className="mr-1 mt-1 inline-flex items-center rounded-2xl bg-[#F5F5F5] py-2 pl-4 pr-3"
            title={
              needsTooltip ? `${value?.label || key}: ${fullText}` : undefined
            }
          >
            <span className="mr-2 text-[0.75rem] font-normal">
              <span className="font-semibold">{value?.label || key}: </span>
              {displayText}
            </span>
            <button
              className="bg-[ ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D6D6D6]"
              onClick={() => handleRemoveFilter(key)}
              aria-label="Remove filter"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18"></path>
                <path d="M6 6L18 18"></path>
              </svg>
            </button>
          </div>,
        );
      }
    }

    return filterTags.length > 0 ? (
      <div className="mb-2 mt-2 flex flex-wrap">{filterTags}</div>
    ) : null;
  };

  return <>{renderFilterTags()}</>;
};

export default FilterTag;
