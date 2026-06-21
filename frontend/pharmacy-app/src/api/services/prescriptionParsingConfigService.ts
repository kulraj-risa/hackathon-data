import { FirestoreService } from "../firebase/firestoreService";

export interface PrescriptionParsingConfigData {
  [key: string]: any;
  dosage_parsing?: any;
  medicine_details?: any;
}

export interface PrescriptionParsingVersion {
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

export class PrescriptionParsingConfigService {
  /**
   * Helper function to sanitize data by removing undefined values
   * Firestore doesn't accept undefined values, so we need to clean them
   */
  private static sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (typeof data === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Get all versions for a specific section
   */
  static async getAllVersionsForSection(
    section: "main" | "dosage" | "medicine" = "main",
  ): Promise<PrescriptionParsingVersion[]> {
    try {
      let collectionPath: string;

      switch (section) {
        case "main":
          collectionPath =
            "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs";
          break;
        case "dosage":
          collectionPath =
            "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing";
          break;
        case "medicine":
          collectionPath =
            "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details";
          break;
        default:
          collectionPath =
            "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs";
      }

      const documents =
        await FirestoreService.getAllDocuments<any>(collectionPath);
      const versions: PrescriptionParsingVersion[] = [];

      documents.forEach((doc) => {
        if (doc && doc.id && (doc.id.startsWith("v") || doc.id === "latest")) {
          versions.push({
            id: doc.id,
            created_at: doc.created_at || new Date().toISOString(),
            created_by: doc.created_by || "unknown",
            description: doc.description || "No description",
            section: section,
          });
        }
      });

      // Sort by version number (v1, v2, v3, etc.) with 'latest' first
      versions.sort((a, b) => {
        if (a.id === "latest") return -1;
        if (b.id === "latest") return 1;
        const aNum = parseInt(a.id.substring(1));
        const bNum = parseInt(b.id.substring(1));
        return bNum - aNum; // Latest first
      });

      return versions;
    } catch (error) {
      console.error("Error fetching versions for section:", section, error);
      throw error;
    }
  }

  /**
   * Get all versions (backwards compatibility)
   */
  static async getAllVersions(): Promise<PrescriptionParsingVersion[]> {
    return this.getAllVersionsForSection("main");
  }

  /**
   * Get a specific version for a section
   */
  static async getVersionForSection(
    versionId: string,
    section: "main" | "dosage" | "medicine" = "main",
  ): Promise<PrescriptionParsingConfigData> {
    try {
      let documentPath: string;

      switch (section) {
        case "main":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/${versionId}`;
          break;
        case "dosage":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing/${versionId}`;
          break;
        case "medicine":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details/${versionId}`;
          break;
        default:
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/${versionId}`;
      }

      const data =
        await FirestoreService.getDocument<PrescriptionParsingConfigData>(
          documentPath,
        );

      if (!data) {
        throw new Error(
          `Version ${versionId} not found for section ${section}`,
        );
      }

      if (section === "main") {
        // For main section, exclude dosage_parsing and medicine_details to prevent cross-contamination
        const { dosage_parsing, medicine_details, ...mainConfigData } = data;
        return mainConfigData as PrescriptionParsingConfigData;
      }

      return data as PrescriptionParsingConfigData;
    } catch (error) {
      console.error(
        "Error fetching version for section:",
        section,
        versionId,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a specific version (backwards compatibility)
   */
  static async getVersion(
    versionId: string,
  ): Promise<PrescriptionParsingConfigData> {
    return this.getVersionForSection(versionId, "main");
  }

  /**
   * Get prescription parsing configuration for a specific section
   */
  static async getPrescriptionParsingConfigurationForSection(
    versionId: string = "v1",
    section: "main" | "dosage" | "medicine" = "main",
  ): Promise<PrescriptionParsingConfigData> {
    try {
      let documentPath: string;

      switch (section) {
        case "main":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/${versionId}`;
          break;
        case "dosage":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing/${versionId}`;
          break;
        case "medicine":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details/${versionId}`;
          break;
        default:
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/${versionId}`;
      }

      const sectionData = await FirestoreService.getDocument<any>(documentPath);

      if (!sectionData) {
        throw new Error(
          `Version ${versionId} not found for section ${section}`,
        );
      }

      // For main section, also fetch sub-configurations for completeness
      if (section === "main") {
        const [dosageDoc, medicineDoc] = await Promise.all([
          FirestoreService.getDocument<any>(
            `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing/latest`,
          ).catch(() => null),
          FirestoreService.getDocument<any>(
            `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details/latest`,
          ).catch(() => null),
        ]);

        return {
          ...sectionData,
          dosage_parsing: dosageDoc || undefined,
          medicine_details: medicineDoc || undefined,
        } as PrescriptionParsingConfigData;
      }

      // For dosage and medicine sections, return the data directly
      return sectionData as PrescriptionParsingConfigData;
    } catch (error) {
      console.error(
        "Error fetching prescription parsing configuration for section:",
        section,
        versionId,
        error,
      );
      throw error;
    }
  }

  /**
   * Get prescription parsing configuration (backwards compatibility)
   */
  static async getPrescriptionParsingConfiguration(
    versionId: string = "v1",
  ): Promise<PrescriptionParsingConfigData> {
    return this.getVersionForSection(versionId, "main");
  }

  /**
   * Create a new version for a specific section
   */
  static async createNewVersionForSection(
    data: Partial<PrescriptionParsingConfigData>,
    description: string,
    section: "main" | "dosage" | "medicine" = "main",
    createdBy: string = "unknown",
    parentVersion: string = "latest",
  ): Promise<string> {
    try {
      const nextVersionId = await this.getNextVersionId(section);
      const timestamp = new Date().toISOString();

      // Sanitize the data to remove undefined values
      const sanitizedData = this.sanitizeData(data);

      // Add metadata to the data
      const dataWithMetadata = {
        ...sanitizedData,
        id: nextVersionId,
        description,
        created_at: timestamp,
        created_by: createdBy,
        parent_version: parentVersion,
      };

      let documentPath: string;

      switch (section) {
        case "main":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/${nextVersionId}`;
          break;
        case "dosage":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing/${nextVersionId}`;
          break;
        case "medicine":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details/${nextVersionId}`;
          break;
        default:
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/${nextVersionId}`;
      }

      await FirestoreService.setDocument(
        documentPath.split("/").slice(0, -1).join("/"),
        nextVersionId,
        dataWithMetadata,
      );

      return nextVersionId;
    } catch (error) {
      console.error("Error creating new version for section:", section, error);
      throw error;
    }
  }

  /**
   * Create a new version with the provided data
   */
  static async createNewVersion(
    data: Partial<PrescriptionParsingConfigData>,
    description: string,
    createdBy: string = "unknown",
    parentVersion: string = "latest",
  ): Promise<string> {
    try {
      const { dosage_parsing, medicine_details, ...mainData } = data;
      const nextVersionId = await this.getNextVersionId("main");
      const timestamp = new Date().toISOString();

      // Sanitize all data to remove undefined values
      const sanitizedMainData = this.sanitizeData(mainData);
      const sanitizedDosageData = dosage_parsing
        ? this.sanitizeData(dosage_parsing)
        : null;
      const sanitizedMedicineData = medicine_details
        ? this.sanitizeData(medicine_details)
        : null;

      // Create main version
      const mainVersionData = {
        ...sanitizedMainData,
        id: nextVersionId,
        description,
        created_at: timestamp,
        created_by: createdBy,
        parent_version: parentVersion,
      };

      await FirestoreService.setDocument(
        "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs",
        nextVersionId,
        mainVersionData,
      );

      // Create dosage parsing version if data exists
      if (sanitizedDosageData) {
        await FirestoreService.setDocument(
          "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing",
          nextVersionId,
          {
            ...sanitizedDosageData,
            id: nextVersionId,
            description: `Dosage parsing for ${description}`,
            created_at: timestamp,
            created_by: createdBy,
            parent_version: parentVersion,
          },
        );
      }

      // Create medicine details version if data exists
      if (sanitizedMedicineData) {
        await FirestoreService.setDocument(
          "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details",
          nextVersionId,
          {
            ...sanitizedMedicineData,
            id: nextVersionId,
            description: `Medicine details for ${description}`,
            created_at: timestamp,
            created_by: createdBy,
            parent_version: parentVersion,
          },
        );
      }

      return nextVersionId;
    } catch (error) {
      console.error("Error creating new version:", error);
      throw error;
    }
  }

  /**
   * Helper method to determine the next version number
   */
  private static getNextVersionNumber(
    existingVersions: PrescriptionParsingVersion[],
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
   * Helper method to determine the next version ID for a specific section
   */
  private static async getNextVersionId(
    section: "main" | "dosage" | "medicine",
  ): Promise<string> {
    const versions = await this.getAllVersionsForSection(section);
    const versionNumbers = versions
      .map((v) => parseInt(v.id.substring(1)))
      .filter((num) => !isNaN(num));
    const nextVersionNumber = Math.max(...versionNumbers, 0) + 1;
    return `v${nextVersionNumber}`;
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
   * Update the entire Prescription Parsing Configuration for a specific version
   */
  static async updatePrescriptionParsingConfiguration(
    data: Partial<PrescriptionParsingConfigData>,
    versionId: string = "latest",
  ): Promise<void> {
    try {
      const { dosage_parsing, medicine_details, ...mainData } = data;

      // Sanitize all data before updating
      const sanitizedMainData = this.sanitizeData(mainData);
      const sanitizedDosageData = dosage_parsing
        ? this.sanitizeData(dosage_parsing)
        : null;
      const sanitizedMedicineData = medicine_details
        ? this.sanitizeData(medicine_details)
        : null;

      // Update main configuration
      if (Object.keys(sanitizedMainData).length > 0) {
        await FirestoreService.updateDocument(
          "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs",
          versionId,
          sanitizedMainData,
        );
      }

      // Update dosage parsing configuration if provided
      if (sanitizedDosageData) {
        await FirestoreService.updateDocument(
          "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing",
          "latest",
          sanitizedDosageData,
        );
      }

      // Update medicine details configuration if provided
      if (sanitizedMedicineData) {
        await FirestoreService.updateDocument(
          "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details",
          "latest",
          sanitizedMedicineData,
        );
      }
    } catch (error) {
      console.error(
        "Error updating Prescription Parsing Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Add a new item to a nested array or object
   */
  static async addItemToPath(
    path: string[],
    newItem: any,
    section: "main" | "dosage" | "medicine" = "main",
    versionId: string = "latest",
  ): Promise<PrescriptionParsingConfigData> {
    try {
      // Fetch current data
      const currentData = await this.getVersionForSection(versionId, section);

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
      await this.updatePrescriptionParsingConfigurationForSection(
        currentData,
        section,
        versionId,
      );

      return currentData;
    } catch (error) {
      console.error(
        "Error adding item to Prescription Parsing Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Delete an item from a nested array or object
   */
  static async deleteItemFromPath(
    path: string[],
    section: "main" | "dosage" | "medicine" = "main",
    itemIndex?: number,
    itemKey?: string,
    versionId: string = "latest",
  ): Promise<PrescriptionParsingConfigData> {
    try {
      // Fetch current data
      const currentData = await this.getVersionForSection(versionId, section);

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
      await this.updatePrescriptionParsingConfigurationForSection(
        currentData,
        section,
        versionId,
      );

      return currentData;
    } catch (error) {
      console.error(
        "Error deleting item from Prescription Parsing Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Add a new top-level category
   */
  static async addCategory(
    categoryName: string,
    categoryData: any = {},
    section: "main" | "dosage" | "medicine" = "main",
    versionId: string = "latest",
  ): Promise<PrescriptionParsingConfigData> {
    try {
      const currentData = await this.getVersionForSection(versionId, section);
      const sanitizedCategoryData = this.sanitizeData(categoryData);
      currentData[categoryName] = sanitizedCategoryData;

      await this.updatePrescriptionParsingConfigurationForSection(
        currentData,
        section,
        versionId,
      );
      return currentData;
    } catch (error) {
      console.error(
        "Error adding category to Prescription Parsing Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a top-level category
   */
  static async deleteCategory(
    categoryName: string,
    section: "main" | "dosage" | "medicine" = "main",
    versionId: string = "latest",
  ): Promise<PrescriptionParsingConfigData> {
    try {
      const currentData = await this.getVersionForSection(versionId, section);
      delete currentData[categoryName];

      await this.updatePrescriptionParsingConfigurationForSection(
        currentData,
        section,
        versionId,
      );
      return currentData;
    } catch (error) {
      console.error(
        "Error deleting category from Prescription Parsing Configuration:",
        error,
      );
      throw error;
    }
  }

  /**
   * Test prescription parsing using specific versions of the configuration
   */
  static async testPrescriptionParsing(
    mrn: string,
    identifier: string,
    mainVersionId: string,
    dosageVersionId: string,
    medicineVersionId: string,
  ): Promise<any> {
    try {
      const axios = (await import("axios")).default;
      const { getBearerToken } = await import("../postCall/bearerToken");

      // Get the authentication token
      const token = await getBearerToken();

      // Prepare the request body with MRN, identifier, and version IDs
      const requestBody = {
        mrn: mrn,
        identifier: identifier,
        main_version_to_fetch: mainVersionId,
        dosage_version_to_fetch: dosageVersionId,
        medicine_version_to_fetch: medicineVersionId,
      };

      // Make the API call directly using axios
      const response = await axios.post(
        "https://api-dev.risalabs.ai/medical-necessity/v1/nycbs/parse-prescription-test",
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
      console.error("Error testing prescription parsing:", error);

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
      // Get the configuration data from the specified version (main section)
      const sourceConfig = await this.getVersionForSection(versionId, "main");

      // Sanitize the data before deploying
      const sanitizedConfig = this.sanitizeData(sourceConfig);

      // Create a new version with id "latest"
      const latestVersionData = {
        ...sanitizedConfig,
        id: "latest",
        created_at: new Date().toISOString(),
        created_by: "system",
        description: `Deployed from version ${versionId}`,
        deployed_from: versionId,
        deployed_at: new Date().toISOString(),
      };

      // Update the main configuration
      await FirestoreService.updateDocument(
        "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs",
        "latest",
        latestVersionData,
      );

      // Try to get and deploy dosage parsing configuration
      try {
        const dosageConfig = await this.getVersionForSection(
          versionId,
          "dosage",
        );
        const sanitizedDosageConfig = this.sanitizeData(dosageConfig);
        await FirestoreService.updateDocument(
          "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing",
          "latest",
          {
            ...sanitizedDosageConfig,
            id: "latest",
            created_at: new Date().toISOString(),
            created_by: "system",
            description: `Deployed dosage parsing from version ${versionId}`,
            deployed_from: versionId,
            deployed_at: new Date().toISOString(),
          },
        );
      } catch (error) {
        console.log(
          `No dosage parsing configuration found for version ${versionId}`,
        );
      }

      // Try to get and deploy medicine details configuration
      try {
        const medicineConfig = await this.getVersionForSection(
          versionId,
          "medicine",
        );
        const sanitizedMedicineConfig = this.sanitizeData(medicineConfig);
        await FirestoreService.updateDocument(
          "api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details",
          "latest",
          {
            ...sanitizedMedicineConfig,
            id: "latest",
            created_at: new Date().toISOString(),
            created_by: "system",
            description: `Deployed medicine details from version ${versionId}`,
            deployed_from: versionId,
            deployed_at: new Date().toISOString(),
          },
        );
      } catch (error) {
        console.log(
          `No medicine details configuration found for version ${versionId}`,
        );
      }

      console.log(`Successfully deployed version ${versionId} to latest`);
    } catch (error) {
      console.error("Error deploying version to latest:", error);
      throw error;
    }
  }

  /**
   * Update configuration for a specific section
   */
  static async updatePrescriptionParsingConfigurationForSection(
    data: Partial<PrescriptionParsingConfigData>,
    section: "main" | "dosage" | "medicine" = "main",
    versionId: string = "latest",
  ): Promise<void> {
    try {
      // Sanitize data before updating
      const sanitizedData = this.sanitizeData(data);

      let documentPath: string;
      switch (section) {
        case "main":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs`;
          break;
        case "dosage":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing`;
          break;
        case "medicine":
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details`;
          break;
        default:
          documentPath = `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs`;
      }

      await FirestoreService.updateDocument(
        documentPath,
        versionId,
        sanitizedData,
      );
    } catch (error) {
      console.error(
        "Error updating Prescription Parsing Configuration for section:",
        section,
        error,
      );
      throw error;
    }
  }
}
