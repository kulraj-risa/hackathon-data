import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Document,
  DocumentsService,
} from "../../api/services/documentsService";
import { DataState } from "../store/store";

interface NestedDocumentsState {
  nestedDocuments: DataState<Document[]>;
  currentDocument: Document | null;
  level2Documents: Document[];
  level3Documents: Document[];
}

const initialState: NestedDocumentsState = {
  nestedDocuments: {
    loading: false,
    error: null,
    data: null,
  },
  currentDocument: null,
  level2Documents: [],
  level3Documents: [],
};

// Fetch nested documents (level 2 or 3)
export const fetchNestedDocuments = createAsyncThunk(
  "nestedDocuments/fetchNestedDocuments",
  async (
    {
      parentId,
      nestedCollection,
    }: { parentId: string; nestedCollection?: string },
    { rejectWithValue },
  ) => {
    try {
      // If we have both parentId and nestedCollection, we're fetching level 3 documents
      if (parentId && nestedCollection) {
        const documents = await DocumentsService.getConfigLevel3Documents(
          parentId,
          nestedCollection,
        );
        return {
          documents,
          level: 3,
        };
      }

      // If we only have parentId, we're fetching level 2 documents
      if (parentId) {
        const documents =
          await DocumentsService.getConfigLevel2Documents(parentId);
        return {
          documents,
          level: 2,
        };
      }

      throw new Error("Missing required parameters");
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch nested documents",
      );
    }
  },
);

// Fetch document details
export const fetchDocumentDetails = createAsyncThunk(
  "nestedDocuments/fetchDocumentDetails",
  async (documentId: string, { rejectWithValue }) => {
    try {
      return await DocumentsService.getDocument(documentId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch document details",
      );
    }
  },
);

// Create a level 2 document
export const createLevel2Document = createAsyncThunk(
  "nestedDocuments/createLevel2Document",
  async (
    {
      parentId,
      documentId,
      data,
    }: {
      parentId: string;
      documentId: string;
      data: Omit<Document, "id">;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const newDocument = await DocumentsService.createLevel2Document(
        parentId,
        documentId,
        data,
      );

      // Refresh document details and level 2 documents
      dispatch(fetchDocumentDetails(parentId));
      dispatch(fetchNestedDocuments({ parentId }));

      return newDocument;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to create level 2 document",
      );
    }
  },
);

// Update a level 2 document
export const updateLevel2Document = createAsyncThunk(
  "nestedDocuments/updateLevel2Document",
  async (
    {
      parentId,
      documentId,
      data,
    }: {
      parentId: string;
      documentId: string;
      data: Partial<Document>;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const updatedDocument = await DocumentsService.updateLevel2Document(
        parentId,
        documentId,
        data,
      );

      // Refresh document details and level 2 documents
      dispatch(fetchDocumentDetails(parentId));
      dispatch(fetchNestedDocuments({ parentId }));

      return updatedDocument;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update level 2 document",
      );
    }
  },
);

// Delete a level 2 document
export const deleteLevel2Document = createAsyncThunk(
  "nestedDocuments/deleteLevel2Document",
  async (
    {
      parentId,
      documentId,
    }: {
      parentId: string;
      documentId: string;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await DocumentsService.deleteLevel2Document(parentId, documentId);

      // Refresh document details and level 2 documents
      dispatch(fetchDocumentDetails(parentId));
      dispatch(fetchNestedDocuments({ parentId }));

      return documentId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to delete level 2 document",
      );
    }
  },
);

// Create a level 3 document
export const createLevel3Document = createAsyncThunk(
  "nestedDocuments/createLevel3Document",
  async (
    {
      parentId,
      level2Id,
      documentId,
      data,
    }: {
      parentId: string;
      level2Id: string;
      documentId: string;
      data: Omit<Document, "id">;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const newDocument = await DocumentsService.createLevel3Document(
        parentId,
        level2Id,
        documentId,
        data,
      );

      // Refresh document details and level 3 documents
      dispatch(fetchDocumentDetails(parentId));
      dispatch(fetchNestedDocuments({ parentId, nestedCollection: level2Id }));

      return newDocument;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to create level 3 document",
      );
    }
  },
);

// Update a level 3 document
export const updateLevel3Document = createAsyncThunk(
  "nestedDocuments/updateLevel3Document",
  async (
    {
      parentId,
      level2Id,
      documentId,
      data,
    }: {
      parentId: string;
      level2Id: string;
      documentId: string;
      data: Partial<Document>;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const updatedDocument = await DocumentsService.updateLevel3Document(
        parentId,
        level2Id,
        documentId,
        data,
      );

      // Refresh document details and level 3 documents
      dispatch(fetchDocumentDetails(parentId));
      dispatch(fetchNestedDocuments({ parentId, nestedCollection: level2Id }));

      return updatedDocument;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update level 3 document",
      );
    }
  },
);

// Delete a level 3 document
export const deleteLevel3Document = createAsyncThunk(
  "nestedDocuments/deleteLevel3Document",
  async (
    {
      parentId,
      level2Id,
      documentId,
    }: {
      parentId: string;
      level2Id: string;
      documentId: string;
    },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await DocumentsService.deleteLevel3Document(
        parentId,
        level2Id,
        documentId,
      );

      // Refresh document details and level 3 documents
      dispatch(fetchDocumentDetails(parentId));
      dispatch(fetchNestedDocuments({ parentId, nestedCollection: level2Id }));

      return documentId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to delete level 3 document",
      );
    }
  },
);

const nestedDocumentsSlice = createSlice({
  name: "nestedDocuments",
  initialState,
  reducers: {
    clearNestedDocuments: (state) => {
      state.nestedDocuments.data = null;
      state.nestedDocuments.error = null;
      state.currentDocument = null;
      state.level2Documents = [];
      state.level3Documents = [];
    },
    setCurrentDocument: (state, action: PayloadAction<Document | null>) => {
      state.currentDocument = action.payload;
    },
    setLevel2Documents: (state, action: PayloadAction<Document[]>) => {
      state.level2Documents = action.payload;
    },
    setLevel3Documents: (state, action: PayloadAction<Document[]>) => {
      state.level3Documents = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch nested documents
      .addCase(fetchNestedDocuments.pending, (state) => {
        state.nestedDocuments.loading = true;
        state.nestedDocuments.error = null;
      })
      .addCase(
        fetchNestedDocuments.fulfilled,
        (
          state,
          action: PayloadAction<{ documents: Document[]; level: number }>,
        ) => {
          state.nestedDocuments.loading = false;

          // Store documents based on level
          if (action.payload.level === 2) {
            state.level2Documents = action.payload.documents;
            state.level3Documents = []; // Clear level 3 when level 2 changes
          } else if (action.payload.level === 3) {
            state.level3Documents = action.payload.documents;
          }

          state.nestedDocuments.data = action.payload.documents;
        },
      )
      .addCase(fetchNestedDocuments.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      })

      // Fetch document details
      .addCase(fetchDocumentDetails.pending, (state) => {
        state.nestedDocuments.loading = true;
      })
      .addCase(
        fetchDocumentDetails.fulfilled,
        (state, action: PayloadAction<Document>) => {
          state.nestedDocuments.loading = false;
          state.currentDocument = action.payload;
        },
      )
      .addCase(fetchDocumentDetails.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      })

      // Create level 2 document
      .addCase(createLevel2Document.pending, (state) => {
        state.nestedDocuments.loading = true;
        state.nestedDocuments.error = null;
      })
      .addCase(createLevel2Document.fulfilled, (state) => {
        state.nestedDocuments.loading = false;
        // We refresh the documents in the thunk via side effects
      })
      .addCase(createLevel2Document.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      })

      // Update level 2 document
      .addCase(updateLevel2Document.pending, (state) => {
        state.nestedDocuments.loading = true;
        state.nestedDocuments.error = null;
      })
      .addCase(updateLevel2Document.fulfilled, (state) => {
        state.nestedDocuments.loading = false;
        // We refresh the documents in the thunk via side effects
      })
      .addCase(updateLevel2Document.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      })

      // Delete level 2 document
      .addCase(deleteLevel2Document.pending, (state) => {
        state.nestedDocuments.loading = true;
        state.nestedDocuments.error = null;
      })
      .addCase(deleteLevel2Document.fulfilled, (state) => {
        state.nestedDocuments.loading = false;
        // We refresh the documents in the thunk via side effects
      })
      .addCase(deleteLevel2Document.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      })

      // Create level 3 document
      .addCase(createLevel3Document.pending, (state) => {
        state.nestedDocuments.loading = true;
        state.nestedDocuments.error = null;
      })
      .addCase(createLevel3Document.fulfilled, (state) => {
        state.nestedDocuments.loading = false;
        // We refresh the documents in the thunk via side effects
      })
      .addCase(createLevel3Document.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      })

      // Update level 3 document
      .addCase(updateLevel3Document.pending, (state) => {
        state.nestedDocuments.loading = true;
        state.nestedDocuments.error = null;
      })
      .addCase(updateLevel3Document.fulfilled, (state) => {
        state.nestedDocuments.loading = false;
        // We refresh the documents in the thunk via side effects
      })
      .addCase(updateLevel3Document.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      })

      // Delete level 3 document
      .addCase(deleteLevel3Document.pending, (state) => {
        state.nestedDocuments.loading = true;
        state.nestedDocuments.error = null;
      })
      .addCase(deleteLevel3Document.fulfilled, (state) => {
        state.nestedDocuments.loading = false;
        // We refresh the documents in the thunk via side effects
      })
      .addCase(deleteLevel3Document.rejected, (state, action) => {
        state.nestedDocuments.loading = false;
        state.nestedDocuments.error = action.payload as string;
      });
  },
});

export const {
  clearNestedDocuments,
  setCurrentDocument,
  setLevel2Documents,
  setLevel3Documents,
} = nestedDocumentsSlice.actions;
export default nestedDocumentsSlice.reducer;
