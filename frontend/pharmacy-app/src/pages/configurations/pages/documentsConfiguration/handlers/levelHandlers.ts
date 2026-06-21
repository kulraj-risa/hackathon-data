import { controlToastState } from "risa-oasis-ui_v2";

import {
  fetchNestedDocuments,
  updateLevel3Document,
} from "../../../../../redux/slice/nestedDocumentsSlice";
import { AppDispatch } from "../../../../../redux/store/store";
import { SelectOption } from "../ConfigSelect";

export const createLevelHandlers = (
  setSelectedLevel1Id: (id: string) => void,
  setSelectedLevel2Id: (id: string) => void,
  setSelectedLevel3Id: (id: string) => void,
  setSelectedVersionInUse: (id: string) => void,
  setSelectedItemData: (data: any) => void,
  setVersionInUseLoading: (loading: boolean) => void,
  selectedLevel1Id: string,
  selectedLevel2Id: string,
  selectedLevel3Id: string,
  storeLevel3Documents: any[],
  findMatchingVersion: string,
  dispatch: AppDispatch,
) => {
  const handleLevel1Change = (option: SelectOption) => {
    setSelectedLevel1Id(option.value);
  };

  const handleLevel2Change = (option: SelectOption) => {
    setSelectedLevel2Id(option.value);
  };

  const handleLevel3Change = (option: SelectOption) => {
    setSelectedLevel3Id(option.value);
  };

  const handleVersionInUseChange = async (option: SelectOption) => {
    if (!selectedLevel1Id || !selectedLevel2Id || !storeLevel3Documents) return;

    setVersionInUseLoading(true);

    try {
      // Find the source version and the "latest" version
      const sourceVersion = storeLevel3Documents.find(
        (doc) => doc.id === option.value,
      );
      const latestVersion = storeLevel3Documents.find(
        (doc) => doc.id === "latest",
      );

      if (!sourceVersion) {
        console.error("Source version not found");
        setVersionInUseLoading(false);
        controlToastState("version-deploy-error");
        return;
      }

      if (!latestVersion) {
        console.error("Latest version not found");
        setVersionInUseLoading(false);
        controlToastState("version-deploy-error");
        return;
      }

      // Update the selected version in use immediately (before the async operations)
      setSelectedVersionInUse(option.value);

      // Create a copy of the source version's data (excluding the id)
      const { id: sourceId, ...sourceData } = sourceVersion;

      // Update the "latest" version with the source version's data
      await dispatch(
        updateLevel3Document({
          parentId: selectedLevel1Id,
          level2Id: selectedLevel2Id,
          documentId: "latest",
          data: sourceData,
        }),
      ).unwrap();

      // Refresh the data to reflect the changes
      await dispatch(
        fetchNestedDocuments({
          parentId: selectedLevel1Id,
          nestedCollection: selectedLevel2Id,
        }),
      );

      // If "latest" is currently selected, update the displayed data immediately
      if (selectedLevel3Id === "latest") {
        setSelectedItemData({
          id: "latest",
          configuration: sourceData.configuration || {},
        });
      }

      // Show success toast with version name
      controlToastState("version-deploy-success");
    } catch (error) {
      console.error("Error copying version to latest:", error);
      // On error, revert the selectedVersionInUse to the previous matching version
      const matchingVersionId = findMatchingVersion;
      setSelectedVersionInUse(matchingVersionId);
      // Show error toast
      controlToastState("version-deploy-error");
    } finally {
      // Add a small delay to ensure UI updates properly
      setTimeout(() => {
        setVersionInUseLoading(false);
      }, 300);
    }
  };

  return {
    handleLevel1Change,
    handleLevel2Change,
    handleLevel3Change,
    handleVersionInUseChange,
  };
};
