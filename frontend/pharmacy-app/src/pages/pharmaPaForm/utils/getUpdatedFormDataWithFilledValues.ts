export const getUpdatedFormDataWithFilledValues = (formFieldsData = {}) =>
  Object.keys(formFieldsData).reduce((acc, key) => {
    const field = formFieldsData[key];

    acc[key] =
      typeof field?.filledValue === "string"
        ? field.filledValue.trim()
        : field?.filledValue;

    return acc;
  }, {});

const transformFilledValue = (value: string | number): string | number => {
  if (typeof value === "number") {
    return value % 1 === 0 ? value : value;
  }

  if (typeof value === "string" && !isNaN(Number(value))) {
    const num = parseFloat(value);
    return num % 1 === 0 ? num : value;
  }

  return value;
};
