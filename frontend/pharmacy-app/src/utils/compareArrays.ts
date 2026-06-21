export function compareArrays(
  original: any[],
  updated: any[],
): "added" | "updated" | "deleted" | "unchanged" {
  const originalSet = new Set(original);
  const updatedSet = new Set(updated);

  const allOriginalInUpdated = original.every((item) => updatedSet.has(item));
  const allUpdatedInOriginal = updated.every((item) => originalSet.has(item));

  if (allOriginalInUpdated && updated.length > original.length) {
    return "added";
  }

  const anyMissingFromUpdated = original.some((item) => !updatedSet.has(item));
  const anyExtraInUpdated = updated.some((item) => !originalSet.has(item));

  if (anyMissingFromUpdated && anyExtraInUpdated) {
    return "updated";
  }

  if (anyMissingFromUpdated && !anyExtraInUpdated) {
    return "deleted";
  }

  return "unchanged";
}
