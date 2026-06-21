/** Known credential / suffix abbreviations that should stay UPPERCASE */
const CREDENTIAL_ABBREVS = new Set([
  "MD",
  "DO",
  "PA",
  "NP",
  "NP-C",
  "NP-BC",
  "RN",
  "RN-BC",
  "LPN",
  "DPM",
  "DDS",
  "DMD",
  "OD",
  "DC",
  "DPT",
  "PharmD",
  "PHARMD",
  "APRN",
  "CRNA",
  "CNS",
  "CNM",
  "DNP",
  "FNP",
  "FNP-C",
  "FNP-BC",
  "PA-C",
  "MPAS",
  "MMS",
  "PhD",
  "PHD",
  "MS",
  "MA",
  "MBA",
  "MPH",
  "MSN",
  "BSN",
  "FACP",
  "FACS",
  "FACOG",
  "FAAN",
  "FAAP",
  "II",
  "III",
  "IV",
  "JR",
  "SR",
]);

export function capitalizeString(inputString?: string) {
  if (!inputString) return "";
  return inputString
    .split(/(\s+|,\s*)/)
    .map((token) => {
      const stripped = token.replace(/[.,]/g, "").toUpperCase();
      if (CREDENTIAL_ABBREVS.has(stripped)) return token.toUpperCase();
      if (/^\s+$/.test(token) || /^,\s*$/.test(token)) return token;
      return token.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    })
    .join("");
}

export function capitalizeWordsSeperatedByUnderScore(input: string): string {
  const words = input.split("_");
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );
  const result = capitalizedWords.join(" ");
  return result;
}

/**
 * Capitalizes the first letter of each word in a string separated by spaces.
 *
 * @param {string} input - The input string to be capitalized.
 * @returns {string} - The capitalized string.
 */
export function capitalizeWordsSeparatedBySpace(input: string): string {
  return input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function replaceSemicolonWithBr(text) {
  return text.replace(/;/g, "<br />");
}

export function replaceBrWithSemicolon(text) {
  return text.replace(/<br\s*\/?>/gi, ";");
}

export const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const unformatPhoneNumber = (formattedValue: string) => {
  return formattedValue.replace(/\D/g, ""); // Remove all non-digit characters
};

export const formatPhoneNumberWithCountryCode = (value: string) => {
  const digits = value.replace(/\D/g, "");
  // Handle different country codes
  if (digits.startsWith("1") && digits.length > 10) {
    // USA/Canada (Country Code +1)
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  } else if (digits.startsWith("44") && digits.length > 10) {
    // UK (Country Code +44)
    return `+44 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
  } else if (digits.startsWith("91") && digits.length >= 10) {
    // India (Country Code +91) - Corrected format
    return `+91 ${digits.slice(2, 6)}-${digits.slice(6, 12)}`;
  } else if (digits.length > 10) {
    // Generic International Format
    return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }

  // Default formatting for 10-digit numbers (assumed US format)
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/**
 * Helper function to get the appropriate display text for audit trail actions.
 * If the name is "All", it returns an empty string to avoid displaying "All".
 *
 * @param {string} name - The name field from the event
 * @returns {string} - The appropriate text to display
 */
export const getAuditTrailDisplayText = (name?: string): string => {
  if (name === "All") {
    return "";
  }
  return name || "";
};

export const formatCommaSeparatedName = (
  commaSeparatedName: string,
): string => {
  if (!commaSeparatedName) {
    return "";
  }

  const parts = commaSeparatedName.split(",").map((part) => part.trim());

  const reversedParts = [...parts].reverse();

  return reversedParts.join(" ");
};

export const formatProviderName = (name: string): string => {
  if (!name) return "";

  const hasSuffix = name.includes(",");

  if (hasSuffix) {
    const [fullName, suffix] = name.split(",").map((part) => part.trim());
    const nameParts = fullName.split(" ");

    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      return `${firstName} ${lastName}, ${suffix}`;
    }
    return name;
  } else {
    const nameParts = name.split(" ");

    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      return `${firstName} ${lastName}`;
    }

    return name;
  }
};
