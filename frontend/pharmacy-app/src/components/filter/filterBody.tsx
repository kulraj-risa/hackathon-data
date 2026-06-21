import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FilterSection } from "../../data-model/filterValues";
import { RootState } from "../../redux/store/store";
import { NextArrow } from "../../svg/next-arrow";
import FilterDateRangePicker from "./filterDateRangePicker";
import FilterOptions from "./filterOptions";

function updateOrAddToObject(
  targetObject: {
    [key: string]: {
      values: string[];
      valuesLabel?: string[];
      type: "string" | "number" | "date";
      label: string;
    };
  },
  source: {
    id: string;
    values: string[];
    valuesLabel?: string[];
    type: "string" | "number" | "date";
    label: string;
  },
): {
  [key: string]: {
    values: string[];
    valuesLabel?: string[];
    type: "string" | "number" | "date";
    label: string;
  };
} {
  const { id, values, valuesLabel, type, label } = source;
  return {
    ...targetObject,
    [id]: {
      values: values,
      valuesLabel: valuesLabel,
      type: type,
      label: label,
    },
  };
}

interface FilterBodyProps {
  onFilterChanged: (data: {
    filters: {
      [key: string]: {
        values: string[];
        valuesLabel?: string[];
        type: "string" | "number" | "date";
        label: string;
      };
    };
    filterCount: number;
  }) => void;
  name: string;
  resetCounter: number;
  filterSectionsData: FilterSection[];
}

const FilterBody = (props: FilterBodyProps) => {
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<{
    [key: string]: {
      values: string[];
      valuesLabel?: string[];
      type: "string" | "number" | "date";
      label: string;
    };
  }>({});
  const { filters } = useSelector((state: RootState) => state.filterValues);

  const filterCount = Object.keys(selectedFilters).reduce((count, key) => {
    if (selectedFilters[key].values.length > 0) {
      return count + 1;
    }
    return count;
  }, 0);

  useEffect(() => {
    const filter = filters.find((filter) => filter.name === props.name);
    if (filter) {
      const filtersWithLabels = Object.entries(filter.values).reduce(
        (acc, [key, value]) => {
          const section = props.filterSectionsData.find(
            (section) => section.id === key,
          );
          return {
            ...acc,
            [key]: {
              ...value,
              label: section?.label || "",
            },
          };
        },
        {},
      );
      setSelectedFilters(filtersWithLabels);
    }
  }, [filters, props.name, props.filterSectionsData]);

  useEffect(() => {
    if (Object.keys(selectedFilters).length > 0) {
      const eligibleFilters = Object.keys(selectedFilters).reduce(
        (acc, key) => {
          if (selectedFilters[key].values.length > 0) {
            return {
              ...acc,
              [key]: selectedFilters[key],
            };
          }
          return acc;
        },
        {},
      );

      props.onFilterChanged({
        filters: eligibleFilters,
        filterCount: filterCount,
      });
    }
  }, [selectedFilters]);

  useEffect(() => {
    if (props.resetCounter > 0) {
      setSelectedFilters({});

      props.onFilterChanged({
        filters: {},
        filterCount: 0,
      });
    }
  }, [props.resetCounter]);

  return (
    <div className="filter-body-container flex h-full overflow-hidden">
      <div className="filter-body-left flex-[40%] overflow-auto border-r border-primaryGray-15 bg-[#F7F9FA]">
        <div className="filter-body-left-header border-l-4 border-l-transparent px-4 py-3 text-small font-normal text-primaryGray-5">
          Filter By :
        </div>
        {props.filterSectionsData.map((section, index) => (
          <>
            {index === selectedSectionIndex ? (
              <>
                <div
                  className="filter-body--single-section flex items-center justify-between border-b border-l-4 border-primaryGray-15 border-l-black bg-white px-4 py-3 text-body font-normal text-primaryGray-5 hover:cursor-pointer hover:bg-primaryGray-16"
                  key={`filter_${section.id}_${index}`}
                >
                  <div className="filter-body--single-section-text font-semibold text-primaryGray-2">
                    {section.label}
                  </div>
                  <div className="filter-body--single-section-icon">
                    <NextArrow />
                  </div>
                </div>
              </>
            ) : (
              <>
                {" "}
                <div
                  className="filter-body--single-section flex items-center justify-between border-b border-l-4 border-primaryGray-15 border-l-transparent px-4 py-3 text-body font-normal text-primaryGray-5 hover:cursor-pointer hover:bg-primaryGray-16"
                  key={`filter_${section.id}_${index}`}
                  onClick={() => setSelectedSectionIndex(index)}
                >
                  <div className="filter-body--single-section-text">
                    {section.label}
                  </div>
                </div>
              </>
            )}
          </>
        ))}
      </div>
      <div className="filter-body-right flex-[60%]">
        {props.filterSectionsData[selectedSectionIndex]?.type === "date" && (
          <FilterDateRangePicker
            id={props.filterSectionsData[selectedSectionIndex]?.id}
            label={props.filterSectionsData[selectedSectionIndex]?.label}
            defaultValues={
              selectedFilters[props.filterSectionsData[selectedSectionIndex].id]
                ?.values || []
            }
            onDateRangeChange={(data) =>
              setSelectedFilters(
                updateOrAddToObject(selectedFilters, {
                  ...data,
                  label:
                    props.filterSectionsData[selectedSectionIndex]?.label || "",
                }),
              )
            }
          />
        )}
        {props.filterSectionsData[selectedSectionIndex].type === "string" && (
          <>
            <FilterOptions
              id={props.filterSectionsData[selectedSectionIndex]?.id}
              label={props.filterSectionsData[selectedSectionIndex]?.label}
              options={props.filterSectionsData[selectedSectionIndex]?.options}
              onCheckBoxValueChange={(data) =>
                setSelectedFilters(
                  updateOrAddToObject(selectedFilters, {
                    ...data,
                    label:
                      props.filterSectionsData[selectedSectionIndex]?.label ||
                      "",
                  }),
                )
              }
              defaultValues={
                selectedFilters[
                  props.filterSectionsData[selectedSectionIndex]?.id
                ]?.values || []
              }
              type={props.filterSectionsData[selectedSectionIndex]?.type}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FilterBody;
