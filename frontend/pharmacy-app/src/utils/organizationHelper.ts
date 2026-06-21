import { FirestoreService } from "../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../api/firebase/references";
import { LocalStorageKeys } from "../enums/localStorageKeys";
import { logDataToConsole, logError } from "./customLogger";
import {
  getItemFromLocalStorage,
  setItemInLocalStorage,
} from "./localStorageHelper";

/**
 * Checks if the current organization is external and sets the internal organization ID
 * if one exists and is not already set.
 */
export const checkAndSetInternalOrganization = async (): Promise<void> => {
  try {
    const healthcareFacilityId = getItemFromLocalStorage(
      LocalStorageKeys.HEALTHCARE_FACILITY_ID,
    );

    if (!healthcareFacilityId) {
      logError(
        new Error("No healthcare facility ID found in localStorage"),
        "checkAndSetInternalOrganization",
      );
      return;
    }

    // Get the current health facility data
    const healthFacilityData = await FirestoreService.getDocument<{
      is_external_organization?: boolean;
      [key: string]: any;
    }>(`healthcare_facility/${healthcareFacilityId}`);

    // Check if this is an external organization
    if (healthFacilityData?.is_external_organization === true) {
      const existingInternalOrgId = getItemFromLocalStorage(
        LocalStorageKeys.INTERNAL_ORGANIZATION_FACILITY_ID,
      );

      // If no internal organization ID is set, fetch and set the first one
      if (!existingInternalOrgId) {
        try {
          // Get the first document from the plan collection
          const planDocs = await FirestoreService.getAllDocuments(
            FirestoreCollectionReference.healthFacilityPlan(
              healthcareFacilityId,
            ),
          );

          if (planDocs && planDocs.length > 0) {
            const firstPlan = planDocs[0] as any;
            const internalOrganizations = firstPlan.internal_organizations;

            if (internalOrganizations && internalOrganizations.length > 0) {
              const firstInternalOrg = internalOrganizations[0];
              if (firstInternalOrg.facility_id) {
                setItemInLocalStorage(
                  LocalStorageKeys.INTERNAL_ORGANIZATION_FACILITY_ID,
                  firstInternalOrg.facility_id,
                );
                logDataToConsole(
                  "Set internal organization facility ID:",
                  firstInternalOrg.facility_id,
                );
              }
            }
          }
        } catch (error) {
          logError(
            error as Error,
            "Error fetching plan data for internal organization setup",
          );
        }
      }
    }
  } catch (error) {
    logError(error as Error, "Error in checkAndSetInternalOrganization");
  }
};

/**
 * Gets the organization ID to use for external worklist API calls.
 * Prioritizes internal organization ID over healthcare facility ID.
 */
export const getOrgIdForFetchExternalWorklist = (): string => {
  const internalOrgId = getItemFromLocalStorage(
    LocalStorageKeys.INTERNAL_ORGANIZATION_FACILITY_ID,
  );
  const healthcareFacilityId = getItemFromLocalStorage(
    LocalStorageKeys.HEALTHCARE_FACILITY_ID,
  );

  return internalOrgId || healthcareFacilityId || "";
};
