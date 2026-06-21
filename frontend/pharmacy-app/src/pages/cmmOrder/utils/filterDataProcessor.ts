import { FilterValues } from "../../../data-model/filterValues";

export const processFilterData = (validFilters: FilterValues[]) => {
  if (!validFilters?.[0]?.["filterCount"]) return {};

  const allFilters = validFilters[0];
  const filters = Object.keys(allFilters).filter((key) => key === "values");
  const filterValues = filters.map((filter) => allFilters[filter]);

  return Object.keys(filterValues?.[0] || {})
    .map((key) => ({
      [key]: filterValues?.[0]?.[key]?.values,
    }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});
};
