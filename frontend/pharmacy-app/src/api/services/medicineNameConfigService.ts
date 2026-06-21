import { FirestoreService } from "../firebase/firestoreService";
import { FirestoreCollectionReference } from "../firebase/references";

export interface MedicineNameConfigData {
  [key: string]: any;
}

export interface MedicineNameVersion {
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

export class MedicineNameConfigService {
  /**
   * Fetch all available versions from api_config/nycbs/get-medicine-name/
   */
  static async getAllVersions(): Promise<MedicineNameVersion[]> {
    try {
      const collectionPath = FirestoreCollectionReference.medicineNameConfig();
      const versions =
        await FirestoreService.getAllDocuments<MedicineNameVersion>(
          collectionPath,
        );

      // Sort versions by creation date (newest first)
      return versions.sort((a, b) => {
        const aDate = new Date(a.created_at || "");
        const bDate = new Date(b.created_at || "");
        return bDate.getTime() - aDate.getTime();
      });
    } catch (error) {
      console.error(
        "Error fetching Medicine Name Configuration versions:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get a specific version of Medicine Name Configuration
   */
  static async getVersion(versionId: string): Promise<MedicineNameConfigData> {
    try {
      const collectionPath = FirestoreCollectionReference.medicineNameConfig();
      const docPath = `${collectionPath}${versionId}`;
      const data =
        await FirestoreService.getDocument<MedicineNameConfigData>(docPath);

      if (!data) {
        throw new Error(
          `Medicine Name Configuration version ${versionId} not found`,
        );
      }

      return data;
    } catch (error) {
      console.error(
        "Error fetching Medicine Name Configuration version:",
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new version of Medicine Name Configuration
   */
  static async createNewVersion(
    data: MedicineNameConfigData,
    description?: string,
    createdBy?: string,
    parentVersion?: string,
  ): Promise<string> {
    try {
      const existingVersions = await this.getAllVersions();
      const newVersionId = this.getNextVersionNumber(existingVersions);

      const versionData: MedicineNameConfigData = {
        ...data,
        id: newVersionId,
        created_at: new Date().toISOString(),
        created_by: createdBy || "system",
        description:
          description || `Medicine Name Configuration ${newVersionId}`,
        parent_version: parentVersion || "v1",
      };

      const collectionPath = FirestoreCollectionReference.medicineNameConfig();

      await FirestoreService.setDocument(
        collectionPath,
        newVersionId,
        versionData,
      );

      return newVersionId;
    } catch (error) {
      console.error(
        "Error creating new Medicine Name Configuration version:",
        error,
      );
      throw error;
    }
  }

  /**
   * Generate the next version number based on existing versions
   */
  private static getNextVersionNumber(
    existingVersions: MedicineNameVersion[],
  ): string {
    if (existingVersions.length === 0) {
      return "v1";
    }

    // Extract version numbers and find the highest
    const versionNumbers = existingVersions
      .map((version) => {
        const match = version.id.match(/^v(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    const maxVersion = Math.max(...versionNumbers, 0);
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
      const version1 = await this.getVersion(version1Id);
      const version2 = await this.getVersion(version2Id);

      return this.deepCompareObjects(version1, version2, []);
    } catch (error) {
      console.error(
        "Error comparing Medicine Name Configuration versions:",
        error,
      );
      throw error;
    }
  }

  /**
   * Deep compare two objects and return differences
   */
  private static deepCompareObjects(
    obj1: any,
    obj2: any,
    currentPath: string[],
  ): ChangeTracker[] {
    const changes: ChangeTracker[] = [];
    const timestamp = new Date().toISOString();

    // Handle null/undefined cases
    if (obj1 === null || obj1 === undefined) {
      if (obj2 !== null && obj2 !== undefined) {
        changes.push({
          type: "add",
          path: currentPath,
          oldValue: obj1,
          newValue: obj2,
          timestamp,
        });
      }
      return changes;
    }

    if (obj2 === null || obj2 === undefined) {
      changes.push({
        type: "delete",
        path: currentPath,
        oldValue: obj1,
        newValue: obj2,
        timestamp,
      });
      return changes;
    }

    // Handle primitive values
    if (typeof obj1 !== "object" || typeof obj2 !== "object") {
      if (obj1 !== obj2) {
        changes.push({
          type: "modify",
          path: currentPath,
          oldValue: obj1,
          newValue: obj2,
          timestamp,
        });
      }
      return changes;
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        const newPath = [...currentPath, i.toString()];
        changes.push(...this.deepCompareObjects(obj1[i], obj2[i], newPath));
      }
      return changes;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of allKeys) {
      const newPath = [...currentPath, key];
      changes.push(...this.deepCompareObjects(obj1[key], obj2[key], newPath));
    }

    return changes;
  }

  /**
   * Get Medicine Name Configuration (defaults to v1 if no version specified)
   */
  static async getMedicineNameConfiguration(
    versionId: string = "v1",
  ): Promise<MedicineNameConfigData> {
    try {
      return await this.getVersion(versionId);
    } catch (error) {
      console.error("Error fetching Medicine Name Configuration:", error);
      throw error;
    }
  }

  /**
   * Update Medicine Name Configuration
   */
  static async updateMedicineNameConfiguration(
    data: Partial<MedicineNameConfigData>,
    versionId: string = "v1",
  ): Promise<void> {
    try {
      const collectionPath = FirestoreCollectionReference.medicineNameConfig();

      await FirestoreService.updateDocument(collectionPath, versionId, data);
    } catch (error) {
      console.error("Error updating Medicine Name Configuration:", error);
      throw error;
    }
  }

  /**
   * Add item to a specific path in Medicine Name Configuration
   */
  static async addItemToPath(
    path: string[],
    newItem: any,
    versionId: string = "v1",
  ): Promise<MedicineNameConfigData> {
    try {
      const currentData = await this.getVersion(versionId);

      // Navigate to the target location
      let current = currentData;
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!(segment in current)) {
          current[segment] = {};
        }
        current = current[segment];
      }

      const lastSegment = path[path.length - 1];

      // Handle different types of additions
      if (Array.isArray(current[lastSegment])) {
        // Add to array
        current[lastSegment].push(newItem);
      } else if (
        typeof current[lastSegment] === "object" &&
        current[lastSegment] !== null
      ) {
        // Add to object - generate a unique key
        const keys = Object.keys(current[lastSegment]);
        const newKey = `item_${keys.length + 1}`;
        current[lastSegment][newKey] = newItem;
      } else {
        // Create new structure
        if (typeof newItem === "object" && !Array.isArray(newItem)) {
          current[lastSegment] = { ...current[lastSegment], ...newItem };
        } else {
          current[lastSegment] = newItem;
        }
      }

      await this.updateMedicineNameConfiguration(currentData, versionId);
      return currentData;
    } catch (error) {
      console.error("Error adding item to Medicine Name Configuration:", error);
      throw error;
    }
  }

  /**
   * Delete item from a specific path in Medicine Name Configuration
   */
  static async deleteItemFromPath(
    path: string[],
    itemIndex?: number,
    itemKey?: string,
    versionId: string = "v1",
  ): Promise<MedicineNameConfigData> {
    try {
      const currentData = await this.getVersion(versionId);

      // Navigate to the target location
      let current = currentData;
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!(segment in current)) {
          throw new Error(`Path not found: ${path.slice(0, i + 1).join(".")}`);
        }
        current = current[segment];
      }

      const lastSegment = path[path.length - 1];

      if (itemIndex !== undefined && Array.isArray(current[lastSegment])) {
        // Delete from array
        current[lastSegment].splice(itemIndex, 1);
      } else if (itemKey && typeof current[lastSegment] === "object") {
        // Delete from object
        delete current[lastSegment][itemKey];
      } else {
        // Delete entire property
        delete current[lastSegment];
      }

      await this.updateMedicineNameConfiguration(currentData, versionId);
      return currentData;
    } catch (error) {
      console.error(
        "Error deleting item from Medicine Name Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Add a new category to Medicine Name Configuration
   */
  static async addCategory(
    categoryName: string,
    categoryData: any = {},
    versionId: string = "v1",
  ): Promise<MedicineNameConfigData> {
    try {
      const currentData = await this.getVersion(versionId);

      currentData[categoryName] = categoryData;

      await this.updateMedicineNameConfiguration(currentData, versionId);
      return currentData;
    } catch (error) {
      console.error(
        "Error adding category to Medicine Name Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a category from Medicine Name Configuration
   */
  static async deleteCategory(
    categoryName: string,
    versionId: string = "v1",
  ): Promise<MedicineNameConfigData> {
    try {
      const currentData = await this.getVersion(versionId);

      delete currentData[categoryName];

      await this.updateMedicineNameConfiguration(currentData, versionId);
      return currentData;
    } catch (error) {
      console.error(
        "Error deleting category from Medicine Name Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Test medicine name configuration using a specific version
   */
  static async testMedicineNameConfiguration(
    medicineText: string,
    versionId: string,
  ): Promise<any> {
    try {
      const { proxyApiCallWrapper } = await import("../proxyCallWrapper");
      const { getBearerToken } = await import("../postCall/bearerToken");

      // Get the authentication token
      const token = await getBearerToken();

      // Prepare the request body for medicine name test
      const requestBody = {
        medicine_text: medicineText,
        version_to_fetch: versionId,
      };

      // Make the API call to the backend test endpoint
      const response = await proxyApiCallWrapper(
        requestBody,
        "/medical-necessity/v1/nycbs/test-medicine-name",
        token,
      );

      return response;
    } catch (error) {
      console.error("Error testing medicine name configuration:", error);
      throw error;
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
      const collectionPath = FirestoreCollectionReference.medicineNameConfig();
      await FirestoreService.updateDocument(
        collectionPath,
        "latest",
        latestVersionData,
      );

      console.log(`Successfully deployed version ${versionId} to latest`);
    } catch (error) {
      console.error("Error deploying version to latest:", error);
      throw error;
    }
  }

  /**
   * Test medicine name configuration with a specific version using BigQuery data
   */
  static async testMedicineNameConfigurable(
    version: string,
    mrn: string,
    identifier: string,
    options: string[],
  ): Promise<{
    status: string;
    drug_name: string | null;
    error: string | null;
    version_used: string;
    config_loaded: boolean;
  }> {
    try {
      const { getBearerToken } = await import("../postCall/bearerToken");
      const axios = (await import("axios")).default;
      const token = await getBearerToken();

      const requestBody = {
        version: version,
        mrn: mrn,
        identifier: identifier,
        options: options,
      };

      console.log("Testing medicine name config with payload:", requestBody);

      const response = await axios.post(
        `https://api-dev.risalabs.ai/medical-necessity/v1/nycbs/get-medicine-name-configurable-test`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Medicine name test result:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error testing medicine name configuration:", error);
      if (error.isAxiosError) {
        throw new Error(
          `HTTP error! status: ${error.response?.status || "unknown"}`,
        );
      }
      throw error;
    }
  }
}
