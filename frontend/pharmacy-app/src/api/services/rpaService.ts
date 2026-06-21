import { FirestoreService } from "../firebase/firestoreService";
import {
  FirestoreCollectionReference,
  FirestoreDocumentReference,
} from "../firebase/references";

export interface RpaOrganization {
  id: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

export interface RpaVersion {
  id: string;
  name?: string;
  version?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  [key: string]: any;
}

export class RpaService {
  // GET OPERATIONS
  static async getAllOrganizations(): Promise<RpaOrganization[]> {
    try {
      // Follow the same pattern as DocumentsService.getConfigLevel2Documents
      // For RPA organizations, we need to check if they're subcollections or fields in the rpa document

      try {
        // First try to treat it as subcollections under configurations/rpa
        const collectionPath = "configurations/rpa";
        return await FirestoreService.getAllDocuments<RpaOrganization>(
          collectionPath,
        );
      } catch (collectionError) {
        console.log(
          "Not subcollections, trying rpa document fields instead:",
          collectionError,
        );

        // If that fails, get the rpa document and extract its fields as organizations
        const docPath = FirestoreDocumentReference.rpaConfigurationsDocument();
        const rpaDocument = await FirestoreService.getDocument<any>(docPath);

        if (!rpaDocument) {
          return [];
        }

        // Convert document fields to "organizations" by extracting top-level fields
        // that are objects (excluding id and primitive fields)
        const organizations: RpaOrganization[] = [];

        for (const [key, value] of Object.entries(rpaDocument)) {
          // Skip the id field and non-object fields
          if (
            key === "id" ||
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
          ) {
            continue;
          }

          // Add each field as an organization
          organizations.push({
            id: key,
            ...(typeof value === "object" ? value : {}),
          });
        }

        console.log(
          "RPA Organizations fetched from document fields:",
          organizations,
        );
        return organizations;
      }
    } catch (error) {
      console.error("Error fetching RPA organizations:", error);
      throw error;
    }
  }

  static async getVersionsForOrganization(
    organizationId: string,
  ): Promise<RpaVersion[]> {
    try {
      // Follow the same pattern as DocumentsService.getConfigLevel3Documents
      // For RPA versions, try subcollections first, then document fields

      try {
        // First try to treat it as a subcollection
        const collectionPath =
          FirestoreCollectionReference.rpaVersions(organizationId);
        return await FirestoreService.getAllDocuments<RpaVersion>(
          collectionPath,
        );
      } catch (collectionError) {
        console.log(
          "Not a subcollection, trying document fields instead:",
          collectionError,
        );

        // If that fails, get the rpa document and extract nested fields
        const docPath = FirestoreDocumentReference.rpaConfigurationsDocument();
        const rpaDocument = await FirestoreService.getDocument<any>(docPath);

        if (
          !rpaDocument ||
          !rpaDocument[organizationId] ||
          typeof rpaDocument[organizationId] !== "object"
        ) {
          return [];
        }

        // Extract versions from the nested organization field
        const versions: RpaVersion[] = [];
        const organizationData = rpaDocument[organizationId];

        for (const [key, value] of Object.entries(organizationData)) {
          // Skip non-object values
          if (
            typeof value !== "object" ||
            value === null ||
            Array.isArray(value)
          ) {
            continue;
          }

          // Add as a version
          versions.push({
            id: key,
            ...(typeof value === "object" ? value : {}),
          });
        }

        console.log(
          `RPA Versions for organization ${organizationId} from document fields:`,
          versions,
        );
        return versions;
      }
    } catch (error) {
      console.error(
        `Error fetching RPA versions for organization ${organizationId}:`,
        error,
      );
      throw error;
    }
  }

  static async getOrganization(
    organizationId: string,
  ): Promise<RpaOrganization> {
    try {
      // Try to get organization as a direct document first
      try {
        const path = `configurations/rpa/${organizationId}`;
        return await FirestoreService.getDocument<RpaOrganization>(path);
      } catch (docError) {
        console.log(
          "Not a direct document, trying rpa document field instead:",
          docError,
        );

        // If that fails, get it from the rpa document fields
        const docPath = FirestoreDocumentReference.rpaConfigurationsDocument();
        const rpaDocument = await FirestoreService.getDocument<any>(docPath);

        if (
          !rpaDocument ||
          !rpaDocument[organizationId] ||
          typeof rpaDocument[organizationId] !== "object"
        ) {
          throw new Error(`Organization ${organizationId} not found`);
        }

        return {
          id: organizationId,
          ...rpaDocument[organizationId],
        };
      }
    } catch (error) {
      console.error(
        `Error fetching RPA organization with ID ${organizationId}:`,
        error,
      );
      throw error;
    }
  }

  static async getVersion(
    organizationId: string,
    versionId: string,
  ): Promise<RpaVersion> {
    try {
      // Try to get version as a direct document first
      try {
        const path = FirestoreDocumentReference.rpaVersionDoc(
          organizationId,
          versionId,
        );
        return await FirestoreService.getDocument<RpaVersion>(path);
      } catch (docError) {
        console.log(
          "Not a direct document, trying rpa document nested field instead:",
          docError,
        );

        // If that fails, get it from the rpa document nested fields
        const docPath = FirestoreDocumentReference.rpaConfigurationsDocument();
        const rpaDocument = await FirestoreService.getDocument<any>(docPath);

        if (
          !rpaDocument ||
          !rpaDocument[organizationId] ||
          typeof rpaDocument[organizationId] !== "object" ||
          !rpaDocument[organizationId][versionId] ||
          typeof rpaDocument[organizationId][versionId] !== "object"
        ) {
          throw new Error(
            `Version ${versionId} not found in organization ${organizationId}`,
          );
        }

        return {
          id: versionId,
          ...rpaDocument[organizationId][versionId],
        };
      }
    } catch (error) {
      console.error(
        `Error fetching RPA version ${versionId} for organization ${organizationId}:`,
        error,
      );
      throw error;
    }
  }

  // CREATE OPERATIONS
  static async createOrganization(
    organizationId: string,
    data: Omit<RpaOrganization, "id">,
  ): Promise<RpaOrganization> {
    try {
      // Create organization as a document under configurations/rpa
      const path = `configurations/rpa`;
      await FirestoreService.setDocument(path, organizationId, data);
      return { id: organizationId, ...data };
    } catch (error) {
      console.error("Error creating RPA organization:", error);
      throw error;
    }
  }

  static async createVersion(
    organizationId: string,
    versionId: string,
    data: Omit<RpaVersion, "id">,
  ): Promise<RpaVersion> {
    try {
      const collectionPath =
        FirestoreCollectionReference.rpaVersions(organizationId);

      if (versionId) {
        await FirestoreService.setDocument(collectionPath, versionId, data);
        return { id: versionId, ...data };
      } else {
        return await FirestoreService.addDocument<RpaVersion>(
          collectionPath,
          data as any,
        );
      }
    } catch (error) {
      console.error(
        `Error creating RPA version for organization ${organizationId}:`,
        error,
      );
      throw error;
    }
  }

  // UPDATE OPERATIONS
  static async updateOrganization(
    organizationId: string,
    data: Partial<RpaOrganization>,
  ): Promise<RpaOrganization> {
    try {
      const path = `configurations/rpa`;
      await FirestoreService.updateDocument(path, organizationId, data);

      // Fetch and return the updated organization
      return await this.getOrganization(organizationId);
    } catch (error) {
      console.error(
        `Error updating RPA organization ${organizationId}:`,
        error,
      );
      throw error;
    }
  }

  static async updateVersion(
    organizationId: string,
    versionId: string,
    data: Partial<RpaVersion>,
  ): Promise<RpaVersion> {
    try {
      console.log("updateVersion called with:", {
        organizationId,
        versionId,
        data,
      });

      // Try to update as a subcollection first
      try {
        const collectionPath =
          FirestoreCollectionReference.rpaVersions(organizationId);
        console.log("Attempting subcollection update at path:", collectionPath);
        await FirestoreService.updateDocument(collectionPath, versionId, data);
        console.log("Successfully updated RPA version as subcollection");
      } catch (subcollectionError) {
        console.log(
          "Failed to update as subcollection, trying nested field update:",
          subcollectionError,
        );

        // If that fails, update as nested field in the main rpa document
        const docPath = FirestoreDocumentReference.rpaConfigurationsDocument();
        console.log(
          "Attempting nested field update at document path:",
          docPath,
        );

        // First get the current organization data to merge with updates
        const rpaDocument = await FirestoreService.getDocument<any>(docPath);
        console.log("Current RPA document:", rpaDocument);

        if (
          rpaDocument &&
          rpaDocument[organizationId] &&
          rpaDocument[organizationId][versionId]
        ) {
          // Merge the existing version data with the updates
          const currentVersionData = rpaDocument[organizationId][versionId];
          const updatedVersionData = { ...currentVersionData, ...data };

          console.log("Merging data:", {
            current: currentVersionData,
            updates: data,
            merged: updatedVersionData,
          });

          // Update the entire organization data with the new version data
          const updatedOrgData = {
            ...rpaDocument[organizationId],
            [versionId]: updatedVersionData,
          };

          console.log("Updating organization data:", updatedOrgData);

          // Update the document with the new organization data
          await FirestoreService.updateDocument("configurations", "rpa", {
            [organizationId]: updatedOrgData,
          });

          console.log("Successfully updated RPA version as nested field");
        } else {
          const errorMsg = `Version ${versionId} not found in organization ${organizationId}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      }

      // Fetch and return the updated version
      const updatedVersion = await this.getVersion(organizationId, versionId);
      console.log("Fetched updated version:", updatedVersion);
      return updatedVersion;
    } catch (error) {
      console.error(
        `Error updating RPA version ${versionId} for organization ${organizationId}:`,
        error,
      );
      throw error;
    }
  }

  // DELETE OPERATIONS
  static async deleteOrganization(organizationId: string): Promise<void> {
    try {
      const path = `configurations/rpa`;
      await FirestoreService.deleteDocument(path, organizationId);
    } catch (error) {
      console.error(
        `Error deleting RPA organization ${organizationId}:`,
        error,
      );
      throw error;
    }
  }

  static async deleteVersion(
    organizationId: string,
    versionId: string,
  ): Promise<void> {
    try {
      const collectionPath =
        FirestoreCollectionReference.rpaVersions(organizationId);
      await FirestoreService.deleteDocument(collectionPath, versionId);
    } catch (error) {
      console.error(
        `Error deleting RPA version ${versionId} for organization ${organizationId}:`,
        error,
      );
      throw error;
    }
  }
}
