import { NycbsPharmaOrderModel } from "../../../data-model/nycbsPharmaOrder";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";

// Map real MRNs to dummy MRNs for display
const MRN_TO_DUMMY_MAP: Record<string, string> = {
  "4001761": "MRN26415",
};

export const getCorrectTextForHover = (data: NycbsPharmaOrderModel): string => {
  const comment = data?.[NycbsPharmaOrderKeys.Comment];
  const errorText = data?.[NycbsPharmaOrderKeys.ErrorText];

  let textToDisplay = "";

  if (comment && comment.trim() !== "" && comment.trim() !== null) {
    textToDisplay = comment;
  } else if (
    errorText &&
    errorText.trim() !== "" &&
    errorText.trim() !== null
  ) {
    textToDisplay = errorText;
  }

  // Replace real MRNs with dummy MRNs in the text
  if (textToDisplay) {
    Object.entries(MRN_TO_DUMMY_MAP).forEach(([realMrn, dummyMrn]) => {
      const regex = new RegExp(realMrn, "g");
      textToDisplay = textToDisplay.replace(regex, dummyMrn);
    });
  }

  return textToDisplay;
};
