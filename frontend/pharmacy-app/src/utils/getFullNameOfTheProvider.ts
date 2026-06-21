import { Provider } from "risa-data-model";
import { generateFullName } from "./generateOrderDataForTable";

export const getFullNameOfTheProvider = (
  providerId: string,
  providers: Provider[],
): string => {
  const selectedProvider = providers.find(
    (provider) => provider.DocID === providerId,
  );

  if (selectedProvider) {
    return generateFullName(
      selectedProvider?.FirstName || "",
      "",
      selectedProvider?.LastName || "",
    );
  }

  return "Not Assigned";
};

export function rotateLastSegmentFirst(input: string): string {
  // Split by space or comma, remove empty items, and trim spaces
  const parts = input.split(/[\s,]+/).filter(Boolean);

  if (parts.length <= 1) return input.trim();

  // Move last segment to the front
  const rotated = [parts[parts.length - 1], ...parts.slice(0, -1)];
  return rotated.join(" ");
}
