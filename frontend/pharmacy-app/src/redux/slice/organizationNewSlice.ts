import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrganizationType } from "../../enums/organizationTypes";
import { DataState } from "../store/store";

interface OrganizationState extends DataState<string> {
  selectedOrganization: string;
}

const initialState: OrganizationState = {
  loading: false,
  error: null,
  data: null,
  selectedOrganization: OrganizationType.NYCBS,
};

const organizationNewSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    setSelectedOrganization: (state, action: PayloadAction<string>) => {
      state.selectedOrganization = action.payload;
    },
  },
});

export const { setSelectedOrganization } = organizationNewSlice.actions;
export default organizationNewSlice.reducer;
