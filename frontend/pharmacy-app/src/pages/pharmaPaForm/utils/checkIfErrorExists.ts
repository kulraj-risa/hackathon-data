export const checkIfErrorExists = (
  formFieldsData: Record<
    string,
    { isRequired: boolean; filledValue: any; regexMatcher: any }
  > | null,
  key: string,
  readOnly?: boolean,
): boolean => {
  if (readOnly) return false;

  if (formFieldsData && formFieldsData[key]) {
    const { isRequired, filledValue, regexMatcher } = formFieldsData[key];

    // First: Run regex validation only if regexMatcher is a valid non-empty string or RegExp
    if (
      regexMatcher instanceof RegExp ||
      (typeof regexMatcher === "string" && regexMatcher.trim().length > 0)
    ) {
      const regex =
        regexMatcher instanceof RegExp
          ? regexMatcher
          : new RegExp(regexMatcher);
      const testResult = regex.test(filledValue);
      return !testResult;
    }

    // Second: Check if required and empty
    if (
      isRequired &&
      (filledValue === null || filledValue === undefined || filledValue === "")
    ) {
      return true;
    }
  }

  return false;
};
