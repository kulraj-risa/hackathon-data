export enum Features {
  ORDERS = "orders",
  AUTH_CHECK = "authReview",
  COVERAGE = "coverageCheck",
  MEDICAL_NECESSITY = "medicalNeccessityChecklist",
  SUBMISSION = "paSubmission",
  STATUS = "paStatus",
  PHARMA_PA = "pharmaPa",
  NYCBS_PHARMA_EXTERNAL = "nycbsPharmaExternal",
  EXTERNAL_WORKLIST = "externalWorklist",
}

export enum Type {
  BASIC = "basic",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise",
}

export enum ScreenNames {
  PHARMA_PA_FORM = "pharma-pa-form",
  INSURANCE_DETAILS = "insurance-details",
  PHARMA_PA_QUESTIONNAIRE = "pharma-pa-questionnaire",
  SEND_TO_PLAN_MODAL = "send-to-plan-modal",
}

export enum HealthCareFacilityFeatures {
  authReview = "Auth Review",
  coverageCheck = "Coverage Check",
  medicalNeccessityChecklist = "Medical Necessity Checklist",
  paSubmission = "PA Submission",
  pharmaPa = "Pharma PA",
  externalWorklist = "External Worklist",
  analytics = "Analytics",
}

export const Organizations = {
  "NYCBS Medical PA": "NYCBS Medical PA",
  "MaryBird Medical": "MaryBird Medical",
  "CHC Medical PA": "CHC Medical PA",
};

export const getFeaturesNameFromTheEnum = (
  feature: keyof typeof HealthCareFacilityFeatures,
): string => {
  return HealthCareFacilityFeatures[feature];
};
