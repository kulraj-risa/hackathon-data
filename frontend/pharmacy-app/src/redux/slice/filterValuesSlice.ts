import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FilterValues } from "../../data-model/filterValues";

interface FilterState {
  filters: FilterValues[];
}

const initialState: FilterState = {
  filters: [],
};

const filterValuesSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<FilterValues>) {
      const { name, values, filterCount } = action.payload;
      const existingFilter = state.filters.find(
        (filter) => filter.name === name,
      );

      if (existingFilter) {
        existingFilter.values = values;
        existingFilter.filterCount = filterCount;
      } else {
        state.filters.push({ name, values, filterCount });
      }
    },
    resetFilters(state) {
      state.filters = [];
    },
  },
});

export const { setFilter, resetFilters } = filterValuesSlice.actions;

export default filterValuesSlice.reducer;
