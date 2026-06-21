import { useEffect, useState } from "react";
import { FirestoreService } from "../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../api/firebase/references";
import { logError } from "../utils/customLogger";

export interface DrugCohortItem {
  drug_name: string;
  color: string;
}

export interface DrugCohortData {
  data: DrugCohortItem[];
  id: string;
}

/**
 * Hook to fetch drug cohort data from Firestore
 * @returns {object} Object containing drugCohort data, loading state, and error
 */
export const useDrugCohort = () => {
  const [drugCohort, setDrugCohort] = useState<DrugCohortItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrugCohort = async () => {
      try {
        setLoading(true);
        setError(null);

        const cohortData = await FirestoreService.getDocument<DrugCohortData>(
          FirestoreDocumentReference.drugCohort(),
        );

        if (cohortData?.data && Array.isArray(cohortData.data)) {
          setDrugCohort(cohortData.data);
        } else {
          setError("Invalid drug cohort data format");
        }
      } catch (err) {
        logError(err as Error, "Error fetching drug cohort");
        setError("Failed to fetch drug cohort data");
      } finally {
        setLoading(false);
      }
    };

    fetchDrugCohort();
  }, []);

  return {
    drugCohort,
    loading,
    error,
  };
};
