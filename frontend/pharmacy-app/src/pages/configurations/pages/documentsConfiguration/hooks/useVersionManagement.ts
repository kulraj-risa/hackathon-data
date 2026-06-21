import React, { useEffect } from "react";

interface UseVersionManagementProps {
  storeLevel2Documents: any[];
  storeLevel3Documents: any[];
  selectedVersionInUse: string;
  selectedLevel2Id: string;
  versionInUseLoading: boolean;
  setSelectedVersionInUse: (id: string) => void;
}

export const useVersionManagement = ({
  storeLevel2Documents,
  storeLevel3Documents,
  selectedVersionInUse,
  selectedLevel2Id,
  versionInUseLoading,
  setSelectedVersionInUse,
}: UseVersionManagementProps) => {
  // Create document options for each level
  const level2Options = React.useMemo(() => {
    if (!storeLevel2Documents) return [];
    if (!Array.isArray(storeLevel2Documents)) return [];

    return storeLevel2Documents.map((doc) => ({
      value: doc.id,
      label: doc.name || doc.id,
    }));
  }, [storeLevel2Documents]);

  const level3Options = React.useMemo(() => {
    if (!storeLevel3Documents) return [];
    if (!Array.isArray(storeLevel3Documents)) return [];

    return storeLevel3Documents.map((doc) => ({
      value: doc.id,
      label: doc.name || doc.id,
    }));
  }, [storeLevel3Documents]);

  // Create options for "Version in Use" dropdown (excluding "latest")
  const versionInUseOptions = React.useMemo(() => {
    if (!storeLevel3Documents) return [];
    if (!Array.isArray(storeLevel3Documents)) return [];

    return storeLevel3Documents
      .filter((doc) => doc.id !== "latest")
      .map((doc) => ({
        value: doc.id,
        label: doc.name || doc.id,
      }));
  }, [storeLevel3Documents]);

  // Function to find which version matches the "latest" version content
  const findMatchingVersion = React.useMemo(() => {
    if (!storeLevel3Documents || !Array.isArray(storeLevel3Documents))
      return "";

    const latestVersion = storeLevel3Documents.find(
      (doc) => doc.id === "latest",
    );
    if (!latestVersion) return "";

    // Find a version whose configuration matches the latest version's configuration
    const matchingVersion = storeLevel3Documents.find((doc) => {
      if (doc.id === "latest") return false;

      // Deep compare configurations
      return (
        JSON.stringify(doc.configuration || {}) ===
        JSON.stringify(latestVersion.configuration || {})
      );
    });

    return matchingVersion ? matchingVersion.id : "";
  }, [storeLevel3Documents]);

  // Update selectedVersionInUse when the matching version changes
  useEffect(() => {
    const matchingVersionId = findMatchingVersion;

    // Only auto-update if:
    // 1. We found a matching version
    // 2. We don't currently have a selection OR the current selection doesn't match any version
    // 3. We're not currently loading (to avoid conflicts with user actions)
    if (matchingVersionId && !versionInUseLoading) {
      if (
        !selectedVersionInUse ||
        !versionInUseOptions.find(
          (option) => option.value === selectedVersionInUse,
        )
      ) {
        setSelectedVersionInUse(matchingVersionId);
      }
    } else if (
      !matchingVersionId &&
      selectedVersionInUse &&
      !versionInUseLoading
    ) {
      // Clear selection if no matching version found and we're not loading
      setSelectedVersionInUse("");
    }
  }, [
    findMatchingVersion,
    selectedVersionInUse,
    selectedLevel2Id,
    storeLevel3Documents,
    versionInUseLoading,
    versionInUseOptions,
    setSelectedVersionInUse,
  ]);

  return {
    level2Options,
    level3Options,
    versionInUseOptions,
    findMatchingVersion,
  };
};
