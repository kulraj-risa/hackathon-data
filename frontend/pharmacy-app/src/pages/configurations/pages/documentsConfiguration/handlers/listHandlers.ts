import {
  fetchNestedDocuments,
  updateLevel3Document,
} from "../../../../../redux/slice/nestedDocumentsSlice";
import { KeywordDocument } from "../types";

export const useListHandlers = (browserState: any) => {
  const {
    selectedLevel1Id,
    selectedLevel2Id,
    selectedLevel3Id,
    selectedItemData,
    setSelectedItemData,
    addListItemDialogState,
    addKeywordDocumentDialogState,
    deleteItemDialogState,
    dispatch,
    setAddListItemDialogState,
    setAddKeywordDocumentDialogState,
    setAddCategoryDialogState,
    setDeleteItemDialogState,
  } = browserState;

  const handleAddListItem = async (itemValue: string) => {
    const { fieldPath } = addListItemDialogState;
    if (
      !selectedLevel1Id ||
      !selectedLevel2Id ||
      !selectedLevel3Id ||
      fieldPath.length === 0
    )
      return;

    try {
      if (!selectedItemData) return;
      const updatedItemData = JSON.parse(JSON.stringify(selectedItemData));
      let currentObj = updatedItemData.configuration || {};

      for (let i = 0; i < fieldPath.length - 1; i++) {
        const pathSegment = fieldPath[i];
        if (Array.isArray(currentObj) && /^\d+$/.test(pathSegment)) {
          const arrayIndex = parseInt(pathSegment, 10);
          if (arrayIndex >= 0 && arrayIndex < currentObj.length) {
            currentObj = currentObj[arrayIndex];
          } else {
            return;
          }
        } else {
          if (!currentObj[pathSegment]) {
            currentObj[pathSegment] = {};
          }
          currentObj = currentObj[pathSegment];
        }
      }

      const arrayFieldName = fieldPath[fieldPath.length - 1];
      if (!Array.isArray(currentObj[arrayFieldName])) {
        currentObj[arrayFieldName] = [];
      }
      currentObj[arrayFieldName].push(itemValue);

      if (!updatedItemData.configuration) {
        updatedItemData.configuration = {};
      }

      await dispatch(
        updateLevel3Document({
          parentId: selectedLevel1Id,
          level2Id: selectedLevel2Id,
          documentId: selectedLevel3Id,
          data: updatedItemData,
        }),
      ).unwrap();

      setSelectedItemData(updatedItemData);
      dispatch(
        fetchNestedDocuments({
          parentId: selectedLevel1Id,
          nestedCollection: selectedLevel2Id,
        }),
      );

      // Auto-close dialog on success
      setAddListItemDialogState({
        isOpen: false,
        fieldPath: [],
        currentValue: [],
        title: "",
        placeholder: "",
        fieldName: "",
      });
    } catch (error) {
      console.error("Error adding item to list:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleAddKeywordDocument = async (keywordDocument: KeywordDocument) => {
    const { fieldPath } = addKeywordDocumentDialogState;
    if (
      !selectedLevel1Id ||
      !selectedLevel2Id ||
      !selectedLevel3Id ||
      fieldPath.length === 0
    )
      return;

    try {
      if (!selectedItemData) return;
      const updatedItemData = JSON.parse(JSON.stringify(selectedItemData));
      let currentObj = updatedItemData.configuration || {};

      for (let i = 0; i < fieldPath.length - 1; i++) {
        const pathSegment = fieldPath[i];
        if (Array.isArray(currentObj) && /^\d+$/.test(pathSegment)) {
          const arrayIndex = parseInt(pathSegment, 10);
          if (arrayIndex >= 0 && arrayIndex < currentObj.length) {
            currentObj = currentObj[arrayIndex];
          } else {
            return;
          }
        } else {
          if (!currentObj[pathSegment]) {
            currentObj[pathSegment] = {};
          }
          currentObj = currentObj[pathSegment];
        }
      }

      const arrayFieldName = fieldPath[fieldPath.length - 1];
      if (!Array.isArray(currentObj[arrayFieldName])) {
        currentObj[arrayFieldName] = [];
      }
      currentObj[arrayFieldName].push(keywordDocument);

      if (!updatedItemData.configuration) {
        updatedItemData.configuration = {};
      }

      await dispatch(
        updateLevel3Document({
          parentId: selectedLevel1Id,
          level2Id: selectedLevel2Id,
          documentId: selectedLevel3Id,
          data: updatedItemData,
        }),
      ).unwrap();

      setSelectedItemData(updatedItemData);
      dispatch(
        fetchNestedDocuments({
          parentId: selectedLevel1Id,
          nestedCollection: selectedLevel2Id,
        }),
      );

      // Auto-close dialog on success
      setAddKeywordDocumentDialogState({
        isOpen: false,
        fieldPath: [],
        currentValue: [],
        title: "",
      });
    } catch (error) {
      console.error("Error adding keyword document:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleAddCategorySubmit = async (categoryName: string) => {
    if (!selectedLevel1Id || !selectedLevel2Id || !selectedLevel3Id) return;

    try {
      if (!selectedItemData) return;
      const updatedItemData = JSON.parse(JSON.stringify(selectedItemData));

      if (!updatedItemData.configuration) {
        updatedItemData.configuration = {};
      }

      const newCategory = {
        category_documents: [],
        drugs: [],
        keyword_documents: [],
      };

      updatedItemData.configuration[categoryName] = newCategory;

      await dispatch(
        updateLevel3Document({
          parentId: selectedLevel1Id,
          level2Id: selectedLevel2Id,
          documentId: selectedLevel3Id,
          data: updatedItemData,
        }),
      ).unwrap();

      setSelectedItemData(updatedItemData);
      dispatch(
        fetchNestedDocuments({
          parentId: selectedLevel1Id,
          nestedCollection: selectedLevel2Id,
        }),
      );

      // Auto-close dialog on success
      setAddCategoryDialogState({ isOpen: false });
    } catch (error) {
      console.error("Error adding new category:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  const handleDeleteItem = async () => {
    const { itemPath, itemIndex, itemType } = deleteItemDialogState;
    if (
      !selectedLevel1Id ||
      !selectedLevel2Id ||
      !selectedLevel3Id ||
      itemPath.length === 0
    )
      return;

    try {
      if (!selectedItemData) return;
      const updatedItemData = JSON.parse(JSON.stringify(selectedItemData));
      let currentObj = updatedItemData.configuration || {};

      if (itemType === "category") {
        // Delete entire category
        const categoryName = itemPath[0];
        delete currentObj[categoryName];
      } else {
        // Navigate to the parent object containing the array
        for (let i = 0; i < itemPath.length - 1; i++) {
          const pathSegment = itemPath[i];
          if (Array.isArray(currentObj) && /^\d+$/.test(pathSegment)) {
            const arrayIndex = parseInt(pathSegment, 10);
            if (arrayIndex >= 0 && arrayIndex < currentObj.length) {
              currentObj = currentObj[arrayIndex];
            } else {
              return;
            }
          } else {
            if (!currentObj[pathSegment]) {
              return; // Path doesn't exist
            }
            currentObj = currentObj[pathSegment];
          }
        }

        // Delete the item from the array
        const arrayFieldName = itemPath[itemPath.length - 1];
        if (
          Array.isArray(currentObj[arrayFieldName]) &&
          typeof itemIndex === "number"
        ) {
          currentObj[arrayFieldName].splice(itemIndex, 1);
        }
      }

      if (!updatedItemData.configuration) {
        updatedItemData.configuration = {};
      }

      await dispatch(
        updateLevel3Document({
          parentId: selectedLevel1Id,
          level2Id: selectedLevel2Id,
          documentId: selectedLevel3Id,
          data: updatedItemData,
        }),
      ).unwrap();

      setSelectedItemData(updatedItemData);
      dispatch(
        fetchNestedDocuments({
          parentId: selectedLevel1Id,
          nestedCollection: selectedLevel2Id,
        }),
      );

      // Auto-close dialog on success
      setDeleteItemDialogState({
        isOpen: false,
        itemPath: [],
        itemName: "",
        itemIndex: undefined,
        itemType: "list-item",
        fullPath: "",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error; // Re-throw to let dialog handle error state
    }
  };

  return {
    handleAddListItem,
    handleAddKeywordDocument,
    handleAddCategorySubmit,
    handleDeleteItem,
  };
};
