import { AuthStatusOptionModel } from "../data-model/authStatusOptions";
import { BadgeWithIconProps } from "../data-model/badgeWithIconProps";

export enum MedicalPaOrdersAuthStatus {
  NotToWork_Fedora = "not_to_work_fedora",
  NotToWork_Stat = "not_to_work_stat",
  WorkedByOnsite = "worked_by_onsite",
  NotAvailable = "not_available",
  Query = "query",
  Hold = "hold",
  AuthRequired = "auth_required",
  Pending = "pending",
  DeniedByRISA = "denied_by_risa",
  DenialByRISA = "denial_by_risa",
  ExistingDenial = "existing_denial",
  AuthByRISA = "auth_by_risa",
  NoAuthRequired = "no_auth_required",
  AuthOnFile = "auth_on_file",
  POD = "pod",
  NotApplicable = "not_applicable",
  TreatmentPlanChanged = "treatment_plan_changed",
  DrugChanged = "drug_changed",
  DrugRemoved = "drug_removed",
  DosChanged = "dos_changed",
  NotToWork_OralDrug = "not_to_work_oral_drug",
  Oral_Drug = "oral_drug",
  POI = "poi",
  AuthReview = "auth_review",
}

export const getAuthStatusIdFromText = (
  statusText: string,
  authStatusOptions: AuthStatusOptionModel[],
) => {
  return authStatusOptions.find((status) => status.text === statusText)?.id;
};

export const getLeastPriorityAuthStatusId = (
  statusIds: string[],
  authStatusOptions: AuthStatusOptionModel[],
): string | undefined => {
  const matchingStatuses = authStatusOptions.filter((status) =>
    statusIds.includes(status.id),
  );

  if (matchingStatuses.length === 0) {
    return undefined;
  }

  const leastPriorityStatus = matchingStatuses.reduce((current, next) => {
    const currentPriority = current.priority ?? Number.MAX_SAFE_INTEGER;
    const nextPriority = next.priority ?? Number.MAX_SAFE_INTEGER;

    return nextPriority < currentPriority ? next : current;
  });

  return leastPriorityStatus.id;
};

export const getBadgePropsForAuthStatus = (
  authStatusOptions: AuthStatusOptionModel[],
  status?: string,
): BadgeWithIconProps | undefined => {
  if (!status) {
    return authStatusOptions.find(
      (option) => option.id === MedicalPaOrdersAuthStatus.NotAvailable,
    );
  }

  return authStatusOptions.find((option) => option.id === status);
};
