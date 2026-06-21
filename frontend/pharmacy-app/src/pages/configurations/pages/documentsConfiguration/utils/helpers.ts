// Helper function to get a display-friendly field name from a path
export const getFieldNameFromPath = (path: string[]): string => {
  if (path.length === 0) return "";

  const lastField = path[path.length - 1];
  return lastField
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
};

// Helper function to get appropriate placeholder based on the field name
export const getPlaceholderForField = (path: string[]): string => {
  const fieldName = path[path.length - 1].toLowerCase();

  if (fieldName.includes("id") || fieldName.includes("code")) {
    return "Enter a unique identifier";
  } else if (fieldName.includes("name")) {
    return "Enter a name";
  } else if (fieldName.includes("url")) {
    return "Enter a URL";
  } else if (fieldName.includes("email")) {
    return "Enter an email address";
  } else if (fieldName.includes("date")) {
    return "YYYY-MM-DD";
  } else {
    return "Enter a value";
  }
};
