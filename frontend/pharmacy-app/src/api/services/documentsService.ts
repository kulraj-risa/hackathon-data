import { FirestoreService } from "../firebase/firestoreService";
import {
  FirestoreCollectionReference,
  FirestoreDocumentReference,
} from "../firebase/references";

// Generic map type for nested fields
export interface NestedDocument {
  [key: string]: any;
}

export interface Document {
  id: string;
  name?: string;
  description?: string;
  required?: boolean;
  // Add support for any nested document structure
  [key: string]: any;
}

export class DocumentsService {
  static async getAllDocuments(): Promise<Document[]> {
    try {
      const path = FirestoreCollectionReference.configurations();
      const docs = await FirestoreService.getAllDocuments<Document>(path);
      return docs;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  }

  static async getConfigLevel2Documents(parentId: string): Promise<Document[]> {
    try {
      // For level 2, we need to check if it's a subcollection or just fields in a document

      try {
        // First try to treat it as a collection (configurations3 reference)
        const collectionPath = FirestoreCollectionReference.configurations3(
          parentId,
          "",
        );
        // Remove the trailing slash or empty segment
        const cleanPath = collectionPath.replace(/\/+$/, "");
        return await FirestoreService.getAllDocuments<Document>(cleanPath);
      } catch (collectionError) {
        console.log(
          "Not a collection, trying document fields instead:",
          collectionError,
        );

        // If that fails, treat it as a document and extract its fields
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (!document) {
          return [];
        }

        // Convert document fields to "documents" by extracting top-level fields
        // that are objects (excluding id and primitive fields)
        const level2Documents: Document[] = [];

        for (const [key, value] of Object.entries(document)) {
          // Skip the id field and non-object fields
          if (
            key === "id" ||
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
          ) {
            continue;
          }

          // Add each field as a document
          level2Documents.push({
            id: key,
            ...(typeof value === "object" ? value : {}),
          });
        }

        return level2Documents;
      }
    } catch (error) {
      console.error(
        `Error fetching level 2 documents for parent ${parentId}:`,
        error,
      );
      throw error;
    }
  }

  static async getConfigLevel3Documents(
    parentId: string,
    level2Id: string,
  ): Promise<Document[]> {
    try {
      // For level 3, it's a proper subcollection via configurations3
      const collectionPath = FirestoreCollectionReference.configurations3(
        parentId,
        level2Id,
      );

      try {
        // Try to treat it as a collection
        return await FirestoreService.getAllDocuments<Document>(collectionPath);
      } catch (collectionError) {
        console.log(
          "Not a collection, trying document fields instead:",
          collectionError,
        );

        // If that fails, try to get the parent document and extract fields
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (
          !document ||
          !document[level2Id] ||
          typeof document[level2Id] !== "object"
        ) {
          return [];
        }

        // Extract level3 items from the nested field
        const level3Documents: Document[] = [];
        const level2Data = document[level2Id];

        for (const [key, value] of Object.entries(level2Data)) {
          // Skip non-object values
          if (
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
          ) {
            continue;
          }

          // Add as a document
          level3Documents.push({
            id: key,
            ...(typeof value === "object" ? value : {}),
          });
        }

        return level3Documents;
      }
    } catch (error) {
      console.error(
        `Error fetching level 3 documents for parent ${parentId}/${level2Id}:`,
        error,
      );
      throw error;
    }
  }

  static async getDocument(documentId: string): Promise<Document> {
    try {
      const path = FirestoreDocumentReference.configurations2(documentId);
      return await FirestoreService.getDocument<Document>(path);
    } catch (error) {
      console.error(`Error fetching document with ID ${documentId}:`, error);
      throw error;
    }
  }

  static async getNestedDocuments(
    parentId: string,
    nestedCollection?: string,
  ): Promise<Document[]> {
    try {
      // If a specific nested collection name is provided, use it with configurations3
      if (nestedCollection) {
        return await this.getConfigLevel3Documents(parentId, nestedCollection);
      }

      // Otherwise, try to get the level 2 documents
      return await this.getConfigLevel2Documents(parentId);
    } catch (error) {
      console.error(
        `Error fetching nested documents for parent ${parentId}:`,
        error,
      );
      throw error;
    }
  }

  // CREATE OPERATIONS
  static async createLevel1Document(
    documentId: string,
    data: Omit<Document, "id">,
  ): Promise<Document> {
    try {
      const collectionPath = FirestoreCollectionReference.configurations();

      // If documentId is provided, use it, otherwise let Firestore generate one
      if (documentId) {
        await FirestoreService.setDocument(collectionPath, documentId, data);
        return { id: documentId, ...data };
      } else {
        return await FirestoreService.addDocument<Document>(
          collectionPath,
          data as any,
        );
      }
    } catch (error) {
      console.error("Error creating level 1 document:", error);
      throw error;
    }
  }

  static async createLevel2Document(
    parentId: string,
    documentId: string,
    data: Omit<Document, "id">,
  ): Promise<Document> {
    try {
      // First try as a subcollection
      try {
        const collectionPath = FirestoreCollectionReference.configurations3(
          parentId,
          "",
        );
        const cleanPath = collectionPath.replace(/\/+$/, "");

        if (documentId) {
          await FirestoreService.setDocument(cleanPath, documentId, data);
          return { id: documentId, ...data };
        } else {
          return await FirestoreService.addDocument<Document>(
            cleanPath,
            data as any,
          );
        }
      } catch (collectionError) {
        console.log(
          "Not a collection, updating parent document instead:",
          collectionError,
        );

        // If that fails, update the parent document with a new field
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (!document) {
          throw new Error(`Parent document ${parentId} not found`);
        }

        // Ensure document ID is set
        const finalDocId = documentId || `doc_${Date.now()}`;

        // Create an update object with the new field
        const update = {
          [finalDocId]: data,
        };

        await FirestoreService.updateDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          update,
        );

        return { id: finalDocId, ...data };
      }
    } catch (error) {
      console.error(
        `Error creating level 2 document under ${parentId}:`,
        error,
      );
      throw error;
    }
  }

  static async createLevel3Document(
    parentId: string,
    level2Id: string,
    documentId: string,
    data: Omit<Document, "id">,
  ): Promise<Document> {
    try {
      // First try as a subcollection
      try {
        const collectionPath = FirestoreCollectionReference.configurations3(
          parentId,
          level2Id,
        );

        if (documentId) {
          await FirestoreService.setDocument(collectionPath, documentId, data);
          return { id: documentId, ...data };
        } else {
          return await FirestoreService.addDocument<Document>(
            collectionPath,
            data as any,
          );
        }
      } catch (collectionError) {
        console.log(
          "Not a collection, updating parent document instead:",
          collectionError,
        );

        // If that fails, update the parent document with a nested field
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (!document) {
          throw new Error(`Parent document ${parentId} not found`);
        }

        // Ensure level2 object exists
        if (!document[level2Id] || typeof document[level2Id] !== "object") {
          document[level2Id] = {};
        }

        // Ensure document ID is set
        const finalDocId = documentId || `doc_${Date.now()}`;

        // Create an update object with the new nested field
        const update = {
          [`${level2Id}.${finalDocId}`]: data,
        };

        await FirestoreService.updateDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          update,
        );

        return { id: finalDocId, ...data };
      }
    } catch (error) {
      console.error(
        `Error creating level 3 document under ${parentId}/${level2Id}:`,
        error,
      );
      throw error;
    }
  }

  // UPDATE OPERATIONS
  static async updateLevel1Document(
    documentId: string,
    data: Partial<Document>,
  ): Promise<Document> {
    try {
      const collectionPath = FirestoreCollectionReference.configurations();
      await FirestoreService.updateDocument(collectionPath, documentId, data);

      // Fetch and return the updated document
      return await this.getDocument(documentId);
    } catch (error) {
      console.error(`Error updating level 1 document ${documentId}:`, error);
      throw error;
    }
  }

  static async updateLevel2Document(
    parentId: string,
    documentId: string,
    data: Partial<Document>,
  ): Promise<Document> {
    try {
      // First try as a subcollection
      try {
        const collectionPath = FirestoreCollectionReference.configurations3(
          parentId,
          "",
        );
        const cleanPath = collectionPath.replace(/\/+$/, "");

        await FirestoreService.updateDocument(cleanPath, documentId, data);

        // Fetch and return the updated document
        const updatedDoc = await FirestoreService.getDocument<Document>(
          `${cleanPath}/${documentId}`,
        );
        return updatedDoc;
      } catch (collectionError) {
        console.log(
          "Not a collection, updating parent document instead:",
          collectionError,
        );

        // If that fails, update the field in the parent document
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (!document) {
          throw new Error(`Parent document ${parentId} not found`);
        }

        if (!document[documentId]) {
          throw new Error(
            `Level 2 document ${documentId} not found in parent ${parentId}`,
          );
        }

        // Merge the data with existing data
        const updatedData = { ...document[documentId], ...data };

        // Create an update object
        const update = {
          [documentId]: updatedData,
        };

        await FirestoreService.updateDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          update,
        );

        return { id: documentId, ...updatedData };
      }
    } catch (error) {
      console.error(
        `Error updating level 2 document ${parentId}/${documentId}:`,
        error,
      );
      throw error;
    }
  }

  static async updateLevel3Document(
    parentId: string,
    level2Id: string,
    documentId: string,
    data: Partial<Document>,
  ): Promise<Document> {
    try {
      // First try as a subcollection
      try {
        const collectionPath = FirestoreCollectionReference.configurations3(
          parentId,
          level2Id,
        );

        await FirestoreService.updateDocument(collectionPath, documentId, data);

        // Fetch and return the updated document
        const updatedDoc = await FirestoreService.getDocument<Document>(
          `${collectionPath}/${documentId}`,
        );
        return updatedDoc;
      } catch (collectionError) {
        console.log(
          "Not a collection, updating parent document instead:",
          collectionError,
        );

        // If that fails, update the nested field in the parent document
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (!document) {
          throw new Error(`Parent document ${parentId} not found`);
        }

        if (!document[level2Id] || typeof document[level2Id] !== "object") {
          throw new Error(
            `Level 2 document ${level2Id} not found in parent ${parentId}`,
          );
        }

        if (!document[level2Id][documentId]) {
          throw new Error(
            `Level 3 document ${documentId} not found in ${parentId}/${level2Id}`,
          );
        }

        // Merge the data with existing data
        const updatedData = { ...document[level2Id][documentId], ...data };

        // Create an update object
        const update = {
          [`${level2Id}.${documentId}`]: updatedData,
        };

        await FirestoreService.updateDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          update,
        );

        return { id: documentId, ...updatedData };
      }
    } catch (error) {
      console.error(
        `Error updating level 3 document ${parentId}/${level2Id}/${documentId}:`,
        error,
      );
      throw error;
    }
  }

  // DELETE OPERATIONS
  static async deleteLevel1Document(documentId: string): Promise<void> {
    try {
      const collectionPath = FirestoreCollectionReference.configurations();
      await FirestoreService.deleteDocument(collectionPath, documentId);
    } catch (error) {
      console.error(`Error deleting level 1 document ${documentId}:`, error);
      throw error;
    }
  }

  static async deleteLevel2Document(
    parentId: string,
    documentId: string,
  ): Promise<void> {
    try {
      // First try as a subcollection
      try {
        const collectionPath = FirestoreCollectionReference.configurations3(
          parentId,
          "",
        );
        const cleanPath = collectionPath.replace(/\/+$/, "");

        await FirestoreService.deleteDocument(cleanPath, documentId);
      } catch (collectionError) {
        console.log(
          "Not a collection, updating parent document instead:",
          collectionError,
        );

        // If that fails, remove the field from the parent document
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (!document) {
          throw new Error(`Parent document ${parentId} not found`);
        }

        if (!document[documentId]) {
          throw new Error(
            `Level 2 document ${documentId} not found in parent ${parentId}`,
          );
        }

        // Create an update object that removes the field
        // Unfortunately Firestore doesn't have a direct "remove field" operation in the JS SDK
        // We'll use a workaround by setting it to null, then cleaning it up
        const update = {
          [documentId]: null,
        };

        await FirestoreService.updateDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          update,
        );

        // Create a cleaned up version without the field and update again
        const { id, ...documentWithoutId } = document;
        const updatedDoc = { ...documentWithoutId };
        delete updatedDoc[documentId];

        await FirestoreService.setDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          updatedDoc,
        );
      }
    } catch (error) {
      console.error(
        `Error deleting level 2 document ${parentId}/${documentId}:`,
        error,
      );
      throw error;
    }
  }

  static async deleteLevel3Document(
    parentId: string,
    level2Id: string,
    documentId: string,
  ): Promise<void> {
    try {
      // First try as a subcollection
      try {
        const collectionPath = FirestoreCollectionReference.configurations3(
          parentId,
          level2Id,
        );

        await FirestoreService.deleteDocument(collectionPath, documentId);
      } catch (collectionError) {
        console.log(
          "Not a collection, updating parent document instead:",
          collectionError,
        );

        // If that fails, remove the nested field from the parent document
        const docPath = FirestoreDocumentReference.configurations2(parentId);
        const document = await FirestoreService.getDocument<Document>(docPath);

        if (!document) {
          throw new Error(`Parent document ${parentId} not found`);
        }

        if (!document[level2Id] || typeof document[level2Id] !== "object") {
          throw new Error(
            `Level 2 document ${level2Id} not found in parent ${parentId}`,
          );
        }

        if (!document[level2Id][documentId]) {
          throw new Error(
            `Level 3 document ${documentId} not found in ${parentId}/${level2Id}`,
          );
        }

        // Create an update object that removes the nested field
        const update = {
          [`${level2Id}.${documentId}`]: null,
        };

        await FirestoreService.updateDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          update,
        );

        // Create a cleaned up version without the field and update again
        const updatedLevel2 = { ...document[level2Id] };
        delete updatedLevel2[documentId];

        const finalUpdate = {
          [level2Id]: updatedLevel2,
        };

        await FirestoreService.updateDocument(
          FirestoreCollectionReference.configurations(),
          parentId,
          finalUpdate,
        );
      }
    } catch (error) {
      console.error(
        `Error deleting level 3 document ${parentId}/${level2Id}/${documentId}:`,
        error,
      );
      throw error;
    }
  }
}
