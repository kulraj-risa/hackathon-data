import { useEffect } from "react";
import {
  fetchDocumentDetails,
  fetchNestedDocuments,
} from "../../../../../redux/slice/nestedDocumentsSlice";
import { AppDispatch } from "../../../../../redux/store/store";

interface UseConfigurationEffectsProps {
  selectedLevel1Id: string;
  selectedLevel2Id: string;
  selectedLevel3Id: string;
  selectedItemData: any;
  shouldScroll: boolean;
  currentDocument: any;
  storeLevel2Documents: any[];
  storeLevel3Documents: any[];
  dispatch: AppDispatch;
  setSelectedLevel2Id: (id: string) => void;
  setSelectedLevel3Id: (id: string) => void;
  setSelectedVersionInUse: (id: string) => void;
  setSelectedItemData: (data: any) => void;
  setShouldScroll: (scroll: boolean) => void;
}

export const useConfigurationEffects = ({
  selectedLevel1Id,
  selectedLevel2Id,
  selectedLevel3Id,
  selectedItemData,
  shouldScroll,
  currentDocument,
  storeLevel2Documents,
  storeLevel3Documents,
  dispatch,
  setSelectedLevel2Id,
  setSelectedLevel3Id,
  setSelectedVersionInUse,
  setSelectedItemData,
  setShouldScroll,
}: UseConfigurationEffectsProps) => {
  // When level 1 document is selected
  useEffect(() => {
    if (selectedLevel1Id) {
      // Reset lower level selections
      setSelectedLevel2Id("");
      setSelectedLevel3Id("");
      setSelectedItemData(null);

      // Fetch document details
      dispatch(fetchDocumentDetails(selectedLevel1Id));

      // Fetch level 2 documents
      dispatch(fetchNestedDocuments({ parentId: selectedLevel1Id }));
    }
  }, [
    selectedLevel1Id,
    dispatch,
    setSelectedLevel2Id,
    setSelectedLevel3Id,
    setSelectedItemData,
  ]);

  // When level 2 document is selected
  useEffect(() => {
    if (selectedLevel1Id && selectedLevel2Id) {
      // Reset level 3 selection
      setSelectedLevel3Id("");
      setSelectedVersionInUse("");

      // Fetch level 3 documents
      dispatch(
        fetchNestedDocuments({
          parentId: selectedLevel1Id,
          nestedCollection: selectedLevel2Id,
        }),
      );

      // Find the selected level 2 document
      const level2Doc = storeLevel2Documents.find(
        (doc) => doc.id === selectedLevel2Id,
      );
      if (level2Doc) {
        setSelectedItemData(level2Doc);
      } else if (currentDocument && currentDocument[selectedLevel2Id]) {
        // Handle case for document fields structure
        setSelectedItemData({
          id: selectedLevel2Id,
          ...currentDocument[selectedLevel2Id],
        });
      } else {
        setSelectedItemData(null);
      }
    }
  }, [
    selectedLevel1Id,
    selectedLevel2Id,
    currentDocument,
    storeLevel2Documents,
    dispatch,
    setSelectedLevel3Id,
    setSelectedVersionInUse,
    setSelectedItemData,
  ]);

  // When level 3 document is selected
  useEffect(() => {
    if (selectedLevel1Id && selectedLevel2Id && selectedLevel3Id) {
      // Find the selected level 3 document in the store
      const level3DocArray = Array.isArray(storeLevel3Documents)
        ? storeLevel3Documents
        : [];
      const level3Doc = level3DocArray.find(
        (doc) => doc.id === selectedLevel3Id,
      );

      if (level3Doc) {
        // Filter to only show configuration field
        const { id, configuration } = level3Doc;
        setSelectedItemData({
          id,
          configuration: configuration || {},
        });
        // Set shouldScroll to true when a version is selected
        setShouldScroll(true);
      } else if (
        currentDocument &&
        currentDocument[selectedLevel2Id] &&
        currentDocument[selectedLevel2Id][selectedLevel3Id]
      ) {
        // Handle case for nested document fields structure
        // Filter to only show configuration field
        const { configuration } =
          currentDocument[selectedLevel2Id][selectedLevel3Id];
        setSelectedItemData({
          id: selectedLevel3Id,
          configuration: configuration || {},
        });
        // Set shouldScroll to true when a version is selected
        setShouldScroll(true);
      } else {
        setSelectedItemData(null);
        setShouldScroll(false);
      }
    }
  }, [
    selectedLevel1Id,
    selectedLevel2Id,
    selectedLevel3Id,
    storeLevel3Documents,
    currentDocument,
    setSelectedItemData,
    setShouldScroll,
  ]);

  // Reset shouldScroll after scrolling is done
  useEffect(() => {
    if (shouldScroll) {
      const timer = setTimeout(() => {
        setShouldScroll(false);
      }, 1000); // Reset after 1 second
      return () => clearTimeout(timer);
    }
  }, [shouldScroll, setShouldScroll]);

  // Sync selectedLevel3Id with selectedItemData updates
  useEffect(() => {
    if (
      selectedItemData &&
      selectedItemData.id &&
      selectedLevel1Id &&
      selectedLevel2Id
    ) {
      // Only update if the current selectedLevel3Id doesn't match the data id
      if (selectedLevel3Id !== selectedItemData.id) {
        setSelectedLevel3Id(selectedItemData.id);
      }
    }
  }, [selectedItemData]);
};
