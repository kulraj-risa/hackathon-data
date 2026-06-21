import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchDocuments } from "../../../../../redux/slice/documentsConfiguration";
import { clearNestedDocuments } from "../../../../../redux/slice/nestedDocumentsSlice";
import { AppDispatch, RootState } from "../../../../../redux/store/store";
import {
  AddCategoryDialogState,
  AddKeywordDocumentDialogState,
  AddListItemDialogState,
  ConfigurationTypeIdDialogState,
  DeleteDialogState,
  DeleteItemDialogState,
  DialogState,
  DocumentIdDialogState,
  EditDetailsState,
  EditDocumentIdDialogState,
  VersionIdDialogState,
} from "../types";

export const useConfigurationBrowser = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const {
    loading: documentsLoading,
    error: documentsError,
    data: documents,
  } = useSelector((state: RootState) => state.documentsConfiguration.documents);

  const {
    nestedDocuments: { loading: nestedLoading, error: nestedError },
    currentDocument,
    level2Documents: storeLevel2Documents,
    level3Documents: storeLevel3Documents,
  } = useSelector((state: RootState) => state.nestedDocuments);

  // State for selected items
  const [selectedLevel1Id, setSelectedLevel1Id] = useState<string>("");
  const [selectedLevel2Id, setSelectedLevel2Id] = useState<string>("");
  const [selectedLevel3Id, setSelectedLevel3Id] = useState<string>("");
  const [selectedVersionInUse, setSelectedVersionInUse] = useState<string>("");
  const [selectedItemData, setSelectedItemData] = useState<any>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [versionInUseLoading, setVersionInUseLoading] = useState(false);

  // Dialog states
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: "create",
    level: 1,
    title: "",
  });

  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>(
    {
      isOpen: false,
      level: 1,
      title: "",
      itemName: "",
      itemId: "",
    },
  );

  const [editDetailsState, setEditDetailsState] = useState<EditDetailsState>({
    isOpen: false,
    level: 1,
    title: "",
    data: null,
  });

  const [documentIdDialogState, setDocumentIdDialogState] =
    useState<DocumentIdDialogState>({
      isOpen: false,
    });

  const [editDocumentIdDialogState, setEditDocumentIdDialogState] =
    useState<EditDocumentIdDialogState>({
      isOpen: false,
    });

  const [configTypeIdDialogState, setConfigTypeIdDialogState] =
    useState<ConfigurationTypeIdDialogState>({
      isOpen: false,
    });

  const [versionIdDialogState, setVersionIdDialogState] =
    useState<VersionIdDialogState>({
      isOpen: false,
    });

  const [addListItemDialogState, setAddListItemDialogState] =
    useState<AddListItemDialogState>({
      isOpen: false,
      fieldPath: [],
      currentValue: [],
      title: "",
      placeholder: "",
      fieldName: "",
    });

  const [addKeywordDocumentDialogState, setAddKeywordDocumentDialogState] =
    useState<AddKeywordDocumentDialogState>({
      isOpen: false,
      fieldPath: [],
      currentValue: [],
      title: "",
    });

  const [addCategoryDialogState, setAddCategoryDialogState] =
    useState<AddCategoryDialogState>({
      isOpen: false,
    });

  const [deleteItemDialogState, setDeleteItemDialogState] =
    useState<DeleteItemDialogState>({
      isOpen: false,
      itemPath: [],
      itemName: "",
      itemIndex: undefined,
      itemType: "list-item",
      fullPath: "",
    });

  // Load documents when component mounts
  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  // Clear nested documents when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearNestedDocuments());
    };
  }, [dispatch]);

  // Computed values
  const isLoading = documentsLoading || nestedLoading;
  const error = documentsError || nestedError;

  return {
    // Redux data
    documents,
    currentDocument,
    storeLevel2Documents,
    storeLevel3Documents,
    isLoading,
    error,
    dispatch,

    // Selection state
    selectedLevel1Id,
    setSelectedLevel1Id,
    selectedLevel2Id,
    setSelectedLevel2Id,
    selectedLevel3Id,
    setSelectedLevel3Id,
    selectedVersionInUse,
    setSelectedVersionInUse,
    selectedItemData,
    setSelectedItemData,
    shouldScroll,
    setShouldScroll,
    versionInUseLoading,
    setVersionInUseLoading,

    // Dialog states
    dialogState,
    setDialogState,
    deleteDialogState,
    setDeleteDialogState,
    editDetailsState,
    setEditDetailsState,
    documentIdDialogState,
    setDocumentIdDialogState,
    editDocumentIdDialogState,
    setEditDocumentIdDialogState,
    configTypeIdDialogState,
    setConfigTypeIdDialogState,
    versionIdDialogState,
    setVersionIdDialogState,
    addListItemDialogState,
    setAddListItemDialogState,
    addKeywordDocumentDialogState,
    setAddKeywordDocumentDialogState,
    addCategoryDialogState,
    setAddCategoryDialogState,
    deleteItemDialogState,
    setDeleteItemDialogState,
  };
};
