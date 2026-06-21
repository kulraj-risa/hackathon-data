import moment from "moment";
import { FilterValues } from "../data-model/filterValues";

function parseDateMMDDYYYY(dateStr: string): Date {
  return moment(dateStr, "MM/DD/YYYY").toDate();
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export function filterData<T extends Record<string, any>>(
  data: T[],
  filters: FilterValues,
): T[] {
  if (!filters || !filters.values || Object.keys(filters.values).length === 0) {
    return data;
  }

  return data.filter((item) => {
    return Object.entries(filters.values).every(([field, filterData]) => {
      // If no filter values are specified for this field, include the item
      if (!filterData?.values || filterData.values.length === 0) {
        return true;
      }

      const itemValue = getNestedValue(item, field);

      // If the item doesn't have the field, exclude it
      if (itemValue === undefined || itemValue === null) {
        return false;
      }

      // Handle date type filters
      if (filterData.type === "date") {
        if (filterData.values.length !== 2) {
          return false; // We expect exactly two date values for range
        }

        const [startDate, endDate] = filterData.values;
        const filteredByDate = filterByDateRange([item], startDate, endDate);
        return filteredByDate.length > 0;
      }

      // For non-date filters, use the original string comparison
      return filterData.values.includes(String(itemValue));
    });
  });
}

const filterByDateRange = (data: any[], startDate: string, endDate: string) => {
  const start = parseDateMMDDYYYY(startDate);
  const end = parseDateMMDDYYYY(endDate);

  // Set time to start of day for proper comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999); // Set to end of day to include the entire end date

  return data.filter((item) => {
    const itemDate = parseDateMMDDYYYY(item.date);
    itemDate.setHours(0, 0, 0, 0);

    return itemDate >= start && itemDate <= end;
  });
};
