import { FormOptionsModel } from "../../../data-model/formOptions";

export const replaceOptionsWithRefDocId = (
  obj: any,
  allFormOptions: FormOptionsModel[],
): any => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceOptionsWithRefDocId(item, allFormOptions));
  }

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (key === "refDocId" && obj.refDocId) {
        // If refDocId exists and has a value, get options from reference doc
        result["options"] = getAllRelevantOptions(allFormOptions, obj.refDocId);
        result[key] = value; // Also include the refDocId in the result
      } else if (key === "options" && (!obj.refDocId || obj.refDocId === "")) {
        // If no refDocId or refDocId is empty, preserve existing options
        result[key] = value;
      } else if (key !== "options") {
        // Process other fields recursively, but skip options if refDocId was processed
        result[key] = replaceOptionsWithRefDocId(value, allFormOptions);
      }
    }
  }

  return result;
};

export const getAllRelevantOptions = (
  options: FormOptionsModel[],
  id: string,
) => {
  const requiredOption = options.find((option) => option.id === id);
  if (!requiredOption) {
    return [];
  }
  return requiredOption.data;
};
