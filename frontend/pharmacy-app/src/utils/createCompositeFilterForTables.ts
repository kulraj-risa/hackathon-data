import { and, or, orderBy, where } from "firebase/firestore";

export const createCompositeFilterForMedicalPaTables = (
  facilityId: string,
  providerId: string,
  status: string,
  searchTerm?: string,
  isAdmin?: boolean,
) => {
  const conditions = [
    where("assigned_to.facility_id", "==", facilityId),
    where("assigned_to.provider_id", "==", providerId),
    where("status.master_auth_status", "==", status),
    searchTerm
      ? where("search_index", "array-contains", searchTerm.toLowerCase())
      : undefined,
  ].filter((condition) => condition !== undefined) as any; // Remove undefined values

  const compositeQuery = and(...conditions);

  return compositeQuery;
};

export const createCompositeFilterForMedicalMyPaOrdersTables = (
  facilityId: string,
  providerId: string,
  searchTerm?: string,
) => {
  const conditions = [
    where("assigned_to.facility_id", "==", facilityId),
    where("assigned_to.provider_id", "==", providerId),
    where("status.master_auth_status", "==", "new"),
    searchTerm
      ? where("search_index", "array-contains", searchTerm.toLowerCase())
      : undefined,
  ].filter((condition) => condition !== undefined) as any; // Remove undefined values

  const compositeQuery = and(...conditions);

  return compositeQuery;
};

export const createOrderByForMedicalPaTables = () => {
  return orderBy("created_at", "desc");
};

export const createCompositeFilterForCmmFormDiffTable = (
  selectedOrganization: string,
  searchTerm?: string,
) => {
  const conditions = [
    where("diff_documents_created", "==", true),
    where("org_id", "==", selectedOrganization),
    searchTerm
      ? or(
          where("patient_mrn", "==", searchTerm),
          where("final_cmm_data.cmm_result_key", "==", searchTerm),
        )
      : undefined,
  ].filter((condition) => condition !== undefined) as any; // Remove undefined values

  const compositeQuery = and(...conditions);

  return compositeQuery;
};
