// Follow-up Type Data Models

export interface FollowUpTypeItem {
  id: string;
  name: string;
}

export interface FollowUpTypeData {
  id: string;
  data: FollowUpTypeItem[];
}

export interface FollowUpTypeResponse {
  id: string;
  data: FollowUpTypeItem[];
}

export interface FollowUpTypeOption {
  label: string;
  value: string;
}

// Helper function to filter follow-up type data from response
export function extractFollowUpTypeData(
  response: FollowUpTypeResponse[],
): FollowUpTypeItem[] {
  const followUpTypeEntry = response.find(
    (item) => item.id === "follow_up_type",
  );
  return followUpTypeEntry?.data || [];
}

// Helper function to convert follow-up type data to dropdown options
export function convertToFollowUpTypeOptions(
  followUpTypeItems: FollowUpTypeItem[],
): FollowUpTypeOption[] {
  return followUpTypeItems.map((item) => ({
    label: item.name,
    value: item.id,
  }));
}
