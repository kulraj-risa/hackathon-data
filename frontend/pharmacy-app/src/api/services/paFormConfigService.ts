import { FirestoreService } from "../firebase/firestoreService";
import { FirestoreCollectionReference } from "../firebase/references";

export interface PaFormConfigData {
  [key: string]: any;
}

export interface PaFormVersion {
  id: string;
  created_at: string;
  created_by?: string;
  description?: string;
  [key: string]: any;
}

export interface ChangeTracker {
  type: "add" | "delete" | "modify";
  path: string[];
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

export class PaFormConfigService {
  /**
   * Fetch all available versions from api_config/nycbs/select-pa-form/
   */
  static async getAllVersions(): Promise<PaFormVersion[]> {
    try {
      const collectionPath = FirestoreCollectionReference.paFormConfig();
      const versions =
        await FirestoreService.getAllDocuments<PaFormVersion>(collectionPath);

      // Sort versions by creation date (newest first)
      return versions.sort((a, b) => {
        const aDate = new Date(a.created_at || "");
        const bDate = new Date(b.created_at || "");
        return bDate.getTime() - aDate.getTime();
      });
    } catch (error) {
      console.error("Error fetching PA Form Configuration versions:", error);
      throw error;
    }
  }

  /**
   * Get a specific version of PA Form Configuration
   */
  static async getVersion(versionId: string): Promise<PaFormConfigData> {
    try {
      const documentPath = `api_config/nycbs/select-pa-form/${versionId}`;
      const data =
        await FirestoreService.getDocument<PaFormConfigData>(documentPath);
      return data;
    } catch (error) {
      console.error(
        `Error fetching PA Form Configuration version ${versionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new version with the provided data
   */
  static async createNewVersion(
    data: PaFormConfigData,
    description?: string,
    createdBy?: string,
    parentVersion?: string,
  ): Promise<string> {
    try {
      // Get existing versions to determine the next version number
      const existingVersions = await this.getAllVersions();
      const nextVersionNumber = this.getNextVersionNumber(existingVersions);

      const newVersionData = {
        ...data,
        id: nextVersionNumber,
        created_at: new Date().toISOString(),
        created_by: createdBy || "admin",
        description: description || `Version ${nextVersionNumber}`,
        parent_version: parentVersion || "v1",
      };

      // Create the new version document
      const collectionPath = `api_config/nycbs/select-pa-form`;
      await FirestoreService.setDocument(
        collectionPath,
        nextVersionNumber,
        newVersionData,
      );

      return nextVersionNumber;
    } catch (error) {
      console.error("Error creating new PA Form Configuration version:", error);
      throw error;
    }
  }

  /**
   * Helper method to determine the next version number
   */
  private static getNextVersionNumber(
    existingVersions: PaFormVersion[],
  ): string {
    if (existingVersions.length === 0) {
      return "v1";
    }

    // Extract version numbers and find the highest
    const versionNumbers = existingVersions
      .map((v) => v.id)
      .filter((id) => id.startsWith("v"))
      .map((id) => parseInt(id.substring(1), 10))
      .filter((num) => !isNaN(num));

    if (versionNumbers.length === 0) {
      return "v1";
    }

    const maxVersion = Math.max(...versionNumbers);
    return `v${maxVersion + 1}`;
  }

  /**
   * Compare two versions and return the differences
   */
  static async compareVersions(
    version1Id: string,
    version2Id: string,
  ): Promise<ChangeTracker[]> {
    try {
      const version1Data = await this.getVersion(version1Id);
      const version2Data = await this.getVersion(version2Id);

      return this.deepCompareObjects(version1Data, version2Data, []);
    } catch (error) {
      console.error("Error comparing versions:", error);
      throw error;
    }
  }

  /**
   * Deep compare objects and return change trackers
   */
  private static deepCompareObjects(
    obj1: any,
    obj2: any,
    currentPath: string[],
  ): ChangeTracker[] {
    const changes: ChangeTracker[] = [];

    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {}),
    ]);

    for (const key of allKeys) {
      const path = [...currentPath, key];
      const value1 = obj1?.[key];
      const value2 = obj2?.[key];

      // Skip metadata fields
      if (["id", "created_at", "created_by", "description"].includes(key)) {
        continue;
      }

      if (value1 === undefined && value2 !== undefined) {
        changes.push({
          type: "add",
          path,
          newValue: value2,
          timestamp: new Date().toISOString(),
        });
      } else if (value1 !== undefined && value2 === undefined) {
        changes.push({
          type: "delete",
          path,
          oldValue: value1,
          timestamp: new Date().toISOString(),
        });
      } else if (
        typeof value1 === "object" &&
        typeof value2 === "object" &&
        value1 !== null &&
        value2 !== null
      ) {
        // Recursively compare nested objects
        changes.push(...this.deepCompareObjects(value1, value2, path));
      } else if (value1 !== value2) {
        changes.push({
          type: "modify",
          path,
          oldValue: value1,
          newValue: value2,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return changes;
  }

  /**
   * Fetch the PA Form Configuration data (defaults to latest version)
   */
  static async getPaFormConfiguration(
    versionId: string = "v1",
  ): Promise<PaFormConfigData> {
    try {
      return await this.getVersion(versionId);
    } catch (error) {
      console.error("Error fetching PA Form Configuration:", error);
      throw error;
    }
  }

  /**
   * Update the entire PA Form Configuration for a specific version
   */
  static async updatePaFormConfiguration(
    data: Partial<PaFormConfigData>,
    versionId: string = "v1",
  ): Promise<void> {
    try {
      await FirestoreService.updateDocument(
        "api_config/nycbs/select-pa-form",
        versionId,
        data,
      );
    } catch (error) {
      console.error("Error updating PA Form Configuration:", error);
      throw error;
    }
  }

  /**
   * Add a new item to a nested array or object
   */
  static async addItemToPath(
    path: string[],
    newItem: any,
    versionId: string = "v1",
  ): Promise<PaFormConfigData> {
    try {
      // Fetch current data
      const currentData = await this.getPaFormConfiguration(versionId);

      // Navigate to the target location
      let current = currentData;
      for (let i = 0; i < path.length - 1; i++) {
        const pathSegment = path[i];
        if (!current[pathSegment]) {
          current[pathSegment] = {};
        }
        current = current[pathSegment];
      }

      const finalKey = path[path.length - 1];

      // If it's an array, push the new item
      if (Array.isArray(current[finalKey])) {
        current[finalKey].push(newItem);
      } else if (
        typeof current[finalKey] === "object" &&
        current[finalKey] !== null
      ) {
        // If it's an object and newItem is also an object, merge the properties
        if (
          typeof newItem === "object" &&
          newItem !== null &&
          !Array.isArray(newItem)
        ) {
          Object.assign(current[finalKey], newItem);
        } else {
          // If it's an object but newItem is not, generate a key for the new item
          const newKey = `item_${Date.now()}`;
          current[finalKey][newKey] = newItem;
        }
      } else {
        // If it doesn't exist, create based on newItem type
        if (
          typeof newItem === "object" &&
          newItem !== null &&
          !Array.isArray(newItem)
        ) {
          current[finalKey] = { ...newItem };
        } else {
          current[finalKey] = [newItem];
        }
      }

      // Update the document
      await this.updatePaFormConfiguration(currentData, versionId);

      return currentData;
    } catch (error) {
      console.error("Error adding item to PA Form Configuration:", error);
      throw error;
    }
  }

  /**
   * Delete an item from a nested array or object
   */
  static async deleteItemFromPath(
    path: string[],
    itemIndex?: number,
    itemKey?: string,
    versionId: string = "v1",
  ): Promise<PaFormConfigData> {
    try {
      // Fetch current data
      const currentData = await this.getPaFormConfiguration(versionId);

      // Navigate to the target location
      let current = currentData;
      for (let i = 0; i < path.length - 1; i++) {
        const pathSegment = path[i];
        if (!current[pathSegment]) {
          throw new Error(`Path ${path.join(".")} not found`);
        }
        current = current[pathSegment];
      }

      const finalKey = path[path.length - 1];

      // If it's an array and index is provided
      if (Array.isArray(current[finalKey]) && typeof itemIndex === "number") {
        current[finalKey].splice(itemIndex, 1);
      }
      // If it's an object and key is provided
      else if (typeof current[finalKey] === "object" && itemKey) {
        delete current[finalKey][itemKey];
      }
      // If deleting the entire key
      else if (
        typeof itemIndex === "undefined" &&
        typeof itemKey === "undefined"
      ) {
        delete current[finalKey];
      }

      // Update the document
      await this.updatePaFormConfiguration(currentData, versionId);

      return currentData;
    } catch (error) {
      console.error("Error deleting item from PA Form Configuration:", error);
      throw error;
    }
  }

  /**
   * Add a new top-level category
   */
  static async addCategory(
    categoryName: string,
    categoryData: any = {},
    versionId: string = "v1",
  ): Promise<PaFormConfigData> {
    try {
      const currentData = await this.getPaFormConfiguration(versionId);
      currentData[categoryName] = categoryData;

      await this.updatePaFormConfiguration(currentData, versionId);
      return currentData;
    } catch (error) {
      console.error("Error adding category to PA Form Configuration:", error);
      throw error;
    }
  }

  /**
   * Delete a top-level category
   */
  static async deleteCategory(
    categoryName: string,
    versionId: string = "v1",
  ): Promise<PaFormConfigData> {
    try {
      const currentData = await this.getPaFormConfiguration(versionId);
      delete currentData[categoryName];

      await this.updatePaFormConfiguration(currentData, versionId);
      return currentData;
    } catch (error) {
      console.error(
        "Error deleting category from PA Form Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Test PA form configuration using a specific version with MRN and identifier
   */
  static async testPaFormConfiguration(
    mrn: string,
    identifier: string,
    versionId: string,
  ): Promise<any> {
    try {
      const axios = (await import("axios")).default;
      const { getBearerToken } = await import("../postCall/bearerToken");

      // Get the authentication token
      const token = await getBearerToken();

      // Prepare the request body for PA form test with MRN, identifier, and version
      const requestBody = {
        mrn: mrn,
        identifier: identifier,
        version_to_fetch: versionId,
      };

      // Make the API call to the new configurable test endpoint
      const response = await axios.post(
        "https://api-dev.risalabs.ai/medical-necessity/v1/nycbs/select-pa-form-configurable-test",
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("Error testing PA form configuration:", error);

      // Enhanced error handling for axios
      if (error.response) {
        // Server responded with error status
        throw new Error(
          `API request failed with status ${error.response.status}: ${error.response.statusText}. ${error.response.data?.message || ""}`,
        );
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(
          "No response received from server. Please check your network connection.",
        );
      } else {
        // Other error
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  /**
   * Deploy a specific version to the "latest" version
   */
  static async deployVersionToLatest(versionId: string): Promise<void> {
    try {
      // Get the configuration data from the specified version
      const sourceConfig = await this.getVersion(versionId);

      // Create a new version with id "latest"
      const latestVersionData = {
        ...sourceConfig,
        id: "latest",
        created_at: new Date().toISOString(),
        created_by: "system",
        description: `Deployed from version ${versionId}`,
        deployed_from: versionId,
        deployed_at: new Date().toISOString(),
      };

      // Update the latest configuration
      await FirestoreService.updateDocument(
        "api_config/nycbs/select-pa-form",
        "latest",
        latestVersionData,
      );

      console.log(`Successfully deployed version ${versionId} to latest`);
    } catch (error) {
      console.error("Error deploying version to latest:", error);
      throw error;
    }
  }
}
