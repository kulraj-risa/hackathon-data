import { PocAssignee, PocAssigneeLabels } from "../../../../enums/pocAssignee";

const getPoc = (poc: string): string => {
  if (!poc || poc === "--" || poc === "nan" || poc === "NaN") {
    return "";
  }

  // Check if the poc matches any of the PocAssignee enum values
  const matchingAssignee = Object.values(PocAssignee).find(
    (assignee) => assignee === poc,
  );

  if (matchingAssignee) {
    return PocAssigneeLabels[matchingAssignee as PocAssignee];
  }

  // If no match found, return the original value
  return poc;
};

export default getPoc;
