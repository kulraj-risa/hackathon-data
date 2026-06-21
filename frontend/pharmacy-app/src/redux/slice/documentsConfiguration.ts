import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Document,
  DocumentsService,
} from "../../api/services/documentsService";
import { DataState } from "../store/store";

interface DocumentsState {
  documents: DataState<Document[]>;
}

const initialState: DocumentsState = {
  documents: {
    loading: false,
    error: null,
    data: null,
  },
};

// Fetch all documents (Level 1)
export const fetchDocuments = createAsyncThunk(
  "documentsConfiguration/fetchDocuments",
  async (_, { rejectWithValue }) => {
    try {
      const documents = await DocumentsService.getAllDocuments();
      return documents;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch documents",
      );
    }
  },
);

// Fetch Level 2 documents
export const fetchDocumentsToAttach = createAsyncThunk(
  "documentsConfiguration/fetchDocumentsToAttach",
  async ({ parentId }: { parentId: string }, { rejectWithValue }) => {
    try {
      return await DocumentsService.getConfigLevel2Documents(parentId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch documents to attach",
      );
    }
  },
);

// Create a new Level 1 document
export const createDocument = createAsyncThunk(
  "documentsConfiguration/createDocument",
  async (
    { documentId, data }: { documentId: string; data: Omit<Document, "id"> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const newDocument = await DocumentsService.createLevel1Document(
        documentId,
        data,
      );
      // Refresh the document list after creating
      dispatch(fetchDocuments());
      return newDocument;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create document",
      );
    }
  },
);

// Update an existing Level 1 document
export const updateDocument = createAsyncThunk(
  "documentsConfiguration/updateDocument",
  async (
    { documentId, data }: { documentId: string; data: Partial<Document> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const updatedDocument = await DocumentsService.updateLevel1Document(
        documentId,
        data,
      );
      // Refresh the document list after updating
      dispatch(fetchDocuments());
      return updatedDocument;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update document",
      );
    }
  },
);

// Delete a Level 1 document
export const deleteDocument = createAsyncThunk(
  "documentsConfiguration/deleteDocument",
  async (documentId: string, { rejectWithValue, dispatch }) => {
    try {
      await DocumentsService.deleteLevel1Document(documentId);
      // Refresh the document list after deleting
      dispatch(fetchDocuments());
      return documentId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete document",
      );
    }
  },
);

const documentsConfigurationSlice = createSlice({
  name: "documentsConfiguration",
  initialState,
  reducers: {
    clearDocuments: (state) => {
      state.documents.data = null;
      state.documents.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.documents.loading = true;
        state.documents.error = null;
      })
      .addCase(
        fetchDocuments.fulfilled,
        (state, action: PayloadAction<Document[]>) => {
          state.documents.loading = false;
          state.documents.data = action.payload;
        },
      )
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.documents.loading = false;
        state.documents.error = action.payload as string;
      })

      // Fetch documents to attach
      .addCase(fetchDocumentsToAttach.pending, (state) => {
        state.documents.loading = true;
        state.documents.error = null;
      })
      .addCase(
        fetchDocumentsToAttach.fulfilled,
        (state, action: PayloadAction<Document[]>) => {
          state.documents.loading = false;
          state.documents.data = action.payload;
        },
      )
      .addCase(fetchDocumentsToAttach.rejected, (state, action) => {
        state.documents.loading = false;
        state.documents.error = action.payload as string;
      })

      // Create document
      .addCase(createDocument.pending, (state) => {
        state.documents.loading = true;
        state.documents.error = null;
      })
      .addCase(createDocument.fulfilled, (state) => {
        state.documents.loading = false;
        // We refresh the full list via the side effect in the thunk
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.documents.loading = false;
        state.documents.error = action.payload as string;
      })

      // Update document
      .addCase(updateDocument.pending, (state) => {
        state.documents.loading = true;
        state.documents.error = null;
      })
      .addCase(updateDocument.fulfilled, (state) => {
        state.documents.loading = false;
        // We refresh the full list via the side effect in the thunk
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.documents.loading = false;
        state.documents.error = action.payload as string;
      })

      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.documents.loading = true;
        state.documents.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state) => {
        state.documents.loading = false;
        // We refresh the full list via the side effect in the thunk
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.documents.loading = false;
        state.documents.error = action.payload as string;
      });
  },
});

export const { clearDocuments } = documentsConfigurationSlice.actions;
export default documentsConfigurationSlice.reducer;
