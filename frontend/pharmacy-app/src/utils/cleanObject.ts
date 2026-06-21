export function cleanObject(obj) {
  if (typeof obj !== "object" || obj === null) return obj;

  const result = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const value = obj[key];

    if (value === null || value === undefined || value === "") {
      continue; // skip empty values
    }

    if (Array.isArray(value)) {
      // Clean each element if it's an object
      const cleanedArray = value
        .map((item) => (typeof item === "object" ? cleanObject(item) : item))
        .filter((item) => {
          if (typeof item === "object") return Object.keys(item).length > 0;
          return item !== null && item !== undefined && item !== "";
        });

      if (cleanedArray.length > 0) {
        result[key] = cleanedArray;
      }
    } else if (typeof value === "object") {
      const cleanedValue = cleanObject(value);
      if (Object.keys(cleanedValue).length > 0) {
        result[key] = cleanedValue;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}
