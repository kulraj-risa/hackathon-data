import React from "react";

import AddKeywordDocumentDialog, {
  AddCategoryDialog,
} from "../../../../../components/modals/AddKeywordDocumentDialog/AddKeywordDocumentDialog";
import AddListItemDialog from "../../../../../components/modals/AddListItemDialog/AddListItemDialog";
import ConfigurationTypeIdDialog from "../../../../../components/modals/ConfigurationTypeIdDialog/ConfigurationTypeIdDialog";
import DeleteConfirmationDialog from "../../../../../components/modals/DeleteConfirmationDialog/DeleteConfirmationDialog";
import DeleteItemConfirmationDialog from "../../../../../components/modals/DeleteItemConfirmationDialog/DeleteItemConfirmationDialog";
import DocumentIdDialog from "../../../../../components/modals/DocumentIdDialog/DocumentIdDialog";
import EditDetailsDialog from "../../../../../components/modals/EditDetailsDialog/EditDetailsDialog";
import EditDocumentIdDialog from "../../../../../components/modals/EditDocumentIdDialog/EditDocumentIdDialog";
import VersionIdDialog from "../../../../../components/modals/VersionIdDialog/VersionIdDialog";
import { useDialogHandlers } from "../handlers/dialogHandlers";

interface ConfigurationBrowserDialogsProps {
  browserState: any;
  isLoading: boolean;
  storeLevel3Documents: any[];
}

export const ConfigurationBrowserDialogs: React.FC<
  ConfigurationBrowserDialogsProps
> = ({ browserState, isLoading, storeLevel3Documents }) => {
  const {
    selectedLevel1Id,
    selectedLevel2Id,
    documentIdDialogState,
    setDocumentIdDialogState,
    configTypeIdDialogState,
    setConfigTypeIdDialogState,
    versionIdDialogState,
    setVersionIdDialogState,
    editDocumentIdDialogState,
    setEditDocumentIdDialogState,
    deleteDialogState,
    setDeleteDialogState,
    deleteItemDialogState,
    setDeleteItemDialogState,
    editDetailsState,
    setEditDetailsState,
    addListItemDialogState,
    setAddListItemDialogState,
    addKeywordDocumentDialogState,
    setAddKeywordDocumentDialogState,
    addCategoryDialogState,
    setAddCategoryDialogState,
  } = browserState;

  const dialogHandlers = useDialogHandlers(browserState);

  return (
    <>
      {/* Document ID Dialog for Level 1 */}
      <DocumentIdDialog
        isOpen={documentIdDialogState.isOpen}
        onClose={() => setDocumentIdDialogState({ isOpen: false })}
        onSubmit={dialogHandlers.handleDocumentIdSubmit}
        parentPath="/configuration/"
        loading={isLoading}
      />

      {/* Configuration Type ID Dialog for Level 2 */}
      <ConfigurationTypeIdDialog
        isOpen={configTypeIdDialogState.isOpen && !!selectedLevel1Id}
        onClose={() => setConfigTypeIdDialogState({ isOpen: false })}
        onSubmit={dialogHandlers.handleConfigTypeIdSubmit}
        parentPath={`/configuration/${selectedLevel1Id}/`}
        loading={isLoading}
      />

      {/* Version ID Dialog for Level 3 */}
      <VersionIdDialog
        isOpen={
          versionIdDialogState.isOpen &&
          !!selectedLevel1Id &&
          !!selectedLevel2Id
        }
        onClose={() => setVersionIdDialogState({ isOpen: false })}
        onSubmit={dialogHandlers.handleVersionIdSubmit}
        parentPath={`/configuration/${selectedLevel1Id}/${selectedLevel2Id}/`}
        loading={isLoading}
        existingVersions={
          Array.isArray(storeLevel3Documents) ? storeLevel3Documents : []
        }
      />

      {/* Edit Document ID Dialog for Level 1 */}
      <EditDocumentIdDialog
        isOpen={editDocumentIdDialogState.isOpen && !!selectedLevel1Id}
        onClose={() => setEditDocumentIdDialogState({ isOpen: false })}
        onSubmit={dialogHandlers.handleEditDocumentIdSubmit}
        documentId={selectedLevel1Id}
        parentPath="/configuration/"
        loading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogState.isOpen}
        onClose={() =>
          setDeleteDialogState({ ...deleteDialogState, isOpen: false })
        }
        onConfirm={dialogHandlers.handleDeleteConfirm}
        title={deleteDialogState.title}
        itemName={deleteDialogState.itemName}
        loading={isLoading}
      />

      {/* Delete Item Confirmation Dialog */}
      <DeleteItemConfirmationDialog
        isOpen={deleteItemDialogState.isOpen}
        onClose={() =>
          setDeleteItemDialogState({ ...deleteItemDialogState, isOpen: false })
        }
        onConfirm={dialogHandlers.handleDeleteItem}
        itemName={deleteItemDialogState.itemName}
        itemType={deleteItemDialogState.itemType}
        fullPath={deleteItemDialogState.fullPath}
        loading={isLoading}
      />

      {/* Edit Details Dialog */}
      <EditDetailsDialog
        isOpen={editDetailsState.isOpen}
        onClose={() =>
          setEditDetailsState({ ...editDetailsState, isOpen: false })
        }
        onSubmit={dialogHandlers.handleEditDetailsSubmit}
        data={editDetailsState.data}
        title={editDetailsState.title}
        loading={isLoading}
      />

      {/* Add List Item Dialog */}
      <AddListItemDialog
        isOpen={addListItemDialogState.isOpen}
        onClose={() =>
          setAddListItemDialogState({
            ...addListItemDialogState,
            isOpen: false,
          })
        }
        onSubmit={dialogHandlers.handleAddListItem}
        title={addListItemDialogState.title}
        placeholder={addListItemDialogState.placeholder}
        fieldName={addListItemDialogState.fieldName}
        loading={isLoading}
      />

      {/* Add Keyword Document Dialog */}
      <AddKeywordDocumentDialog
        isOpen={addKeywordDocumentDialogState.isOpen}
        onClose={() =>
          setAddKeywordDocumentDialogState({
            isOpen: false,
            fieldPath: [],
            currentValue: [],
            title: "",
          })
        }
        onSubmit={dialogHandlers.handleAddKeywordDocument}
        title={addKeywordDocumentDialogState.title}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        isOpen={addCategoryDialogState.isOpen}
        onClose={() => setAddCategoryDialogState({ isOpen: false })}
        onSubmit={dialogHandlers.handleAddCategorySubmit}
        title="Add New Category"
      />
    </>
  );
};
