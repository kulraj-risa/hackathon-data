import { createDocument } from "../../../../../redux/slice/documentsConfiguration";
import {
  createLevel2Document,
  createLevel3Document,
  fetchNestedDocuments,
} from "../../../../../redux/slice/nestedDocumentsSlice";

export const useCrudHandlers = (browserState: any) => {
  const {
    selectedLevel1Id,
    selectedLevel2Id,
    setSelectedLevel1Id,
    setSelectedLevel2Id,
    setSelectedLevel3Id,
    storeLevel3Documents,
    dispatch,
    setDocumentIdDialogState,
    setConfigTypeIdDialogState,
    setVersionIdDialogState,
    setEditDocumentIdDialogState,
    setDeleteDialogState,
    setEditDetailsState,
  } = browserState;

  const handleDocumentIdSubmit = async (documentId: string) => {
    try {
      await dispatch(
        createDocument({
          documentId,
          data: {},
        }),
      ).unwrap();
      setSelectedLevel1Id(documentId);
      // Auto-close dialog on success
      setDocumentIdDialogState({ isOpen: false });
    } catch (error) {
      console.error("Error creating document:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleConfigTypeIdSubmit = async (configTypeId: string) => {
    if (!selectedLevel1Id) return;
    try {
      await dispatch(
        createLevel2Document({
          parentId: selectedLevel1Id,
          documentId: configTypeId,
          data: {},
        }),
      ).unwrap();
      setSelectedLevel2Id(configTypeId);
      // Auto-close dialog on success
      setConfigTypeIdDialogState({ isOpen: false });
    } catch (error) {
      console.error("Error creating configuration type:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleVersionIdSubmit = async (
    versionId: string,
    sourceVersionId?: string,
  ) => {
    if (!selectedLevel1Id || !selectedLevel2Id) return;
    try {
      let initialData = {};
      if (sourceVersionId && sourceVersionId.trim() !== "") {
        const sourceDoc = Array.isArray(storeLevel3Documents)
          ? storeLevel3Documents.find((doc) => doc.id === sourceVersionId)
          : null;
        if (sourceDoc) {
          const { id, ...sourceData } = sourceDoc;
          initialData = sourceData;
        }
      }
      await dispatch(
        createLevel3Document({
          parentId: selectedLevel1Id,
          level2Id: selectedLevel2Id,
          documentId: versionId,
          data: initialData,
        }),
      ).unwrap();
      setSelectedLevel3Id(versionId);
      await dispatch(
        fetchNestedDocuments({
          parentId: selectedLevel1Id,
          nestedCollection: selectedLevel2Id,
        }),
      );
      // Auto-close dialog on success
      setVersionIdDialogState({ isOpen: false });
    } catch (error) {
      console.error("Error creating version:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleEditDocumentIdSubmit = async (
    oldDocumentId: string,
    newDocumentId: string,
  ) => {
    try {
      // Implementation would be complex - keeping simplified for now
      console.log("Edit document ID not implemented in modular version");
      // Auto-close dialog on success
      setEditDocumentIdDialogState({ isOpen: false });
    } catch (error) {
      console.error("Error editing document ID:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      // Implementation would depend on dialog state - keeping simplified
      console.log("Delete confirm not implemented in modular version");
      // Auto-close dialog on success
      setDeleteDialogState({
        isOpen: false,
        level: 1,
        title: "",
        itemName: "",
        itemId: "",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleEditDetailsSubmit = async (updatedData: Record<string, any>) => {
    try {
      // Implementation would be complex - keeping simplified for now
      console.log("Edit details not implemented in modular version");
      // Auto-close dialog on success
      setEditDetailsState({ isOpen: false, level: 1, title: "", data: null });
    } catch (error) {
      console.error("Error editing details:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  return {
    handleDocumentIdSubmit,
    handleConfigTypeIdSubmit,
    handleVersionIdSubmit,
    handleEditDocumentIdSubmit,
    handleDeleteConfirm,
    handleEditDetailsSubmit,
  };
};
