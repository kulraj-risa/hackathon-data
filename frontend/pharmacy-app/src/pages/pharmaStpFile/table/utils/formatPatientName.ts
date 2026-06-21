export const formatPatientName = (name: string): string => {
  if (!name || name === "--") {
    return name;
  }

  if (!name.includes(",")) {
    return name;
  }

  const parts = name.split(",").map((part) => part.trim());

  if (parts.length !== 2) {
    return name;
  }

  const [lastName, firstName] = parts;

  if (!lastName || !firstName) {
    return name;
  }

  return `${firstName} ${lastName}`;
};
