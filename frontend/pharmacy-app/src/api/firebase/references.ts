export const FirestoreCollectionReference = {
  loggedInUser: () => `payer_member`,
  payer: () => `payer`,
  payerInvitation: () => `payer_invitation`,
  payerTeams: (payerId: string) => `payer/${payerId}/teams`,
  payerMembers: (payerId: string) => `payer/${payerId}/members`,
  priorAuthRequests: () => `prior_auth_requests`,
  payerPatients: (payerId: string) => `payer/${payerId}/patients`,
  payerProviders: (payerId: string) => `payer/${payerId}/providers`,
  payerProcedures: (payerId: string) => `payer/${payerId}/procedures`,
  orders: () => `orders`,
  coverage: (orderId: string) => `orders/${orderId}/coverages`,
  checklist: (orderId: string) => `/orders/${orderId}/filledChecklist/`,
  patients: (clinicId: string) => `/healthcare_facility/${clinicId}/patients/`,
  providers: () => `/providers/`,
  members: () => `/healthcare_facility_invitation`,
  cptCode: () => "auth_config/cpt_benefit_map/v1",
  client: () => `/client`,
  healthcareFacility: () => `/healthcare_facility`,
  facilityPlan: (facilityId: string) =>
    `/healthcare_facility/${facilityId}/plan/`,
  pharmaQuestions: (collectionId: string) =>
    `/onco_emr/${collectionId}/questionnaire/`,
  oncoEmrOrders: () => `/onco_emr/`,
  formOptions: () => `/auth_config/form_options/v1/`,
  cmmFormConfig: () => `/auth_config/cmm_form_config/v1/`,
  cmmFormDiffData: (orderId: string) => `/onco_emr/${orderId}/form_diff_data/`,
  availityServiceReviewConfiguration: (orderId: string) =>
    `orders/${orderId}/form/`,
  submissionDocs: (orderId: string) => `/orders/${orderId}/submission/`,
  formQuestionnaire: (orderId: string) => `/orders/${orderId}/submission/`,
  nycbsMedicalPa: () => `/nycbs_medical_pa/`,
  nycbsMedicalPaPatients: (id: string) => `/nycbs_medical_pa/${id}/patients`,
  nycbsClaimsPa: () => `/nycbs_claims_pa/`,
  nycbsClaimsPaPatients: (id: string) => `/nycbs_claims_pa/${id}/patients`,
  medicalPaOrders: () => `/medical_pa_orders/`,
  finalWorklistOrders: () => `/medical_pa_orders/`,
  medicalPaOrdersCoverage: (id: string) =>
    `/medical_pa_orders/${id}/coverage_info/`,
  medicalPaOrdersComments: (orderId: string) =>
    `/medical_pa_orders/${orderId}/comments/`,
  cmmEvents: (orderId: string) => `/cmm_events/${orderId}/events/`,
  cmmChangesTracking: (orderId: string) =>
    `/cmm_workflow/${orderId}/changes_tracking`,
  cmmWorkflow: () => `/cmm_workflow/`,
  configurations: () => `configurations`,
  configurations3: (id: string, id2: string) =>
    id2 ? `configurations/${id}/${id2}` : `configurations/${id}`,
  medicalPaFormConfig: () => `/auth_config/medical_pa_form_config/v1/`,
  rpaConfigurationsDoc: () => `configurations/rpa`,
  rpaOrganization: (organizationId: string) =>
    `configurations/rpa/${organizationId}`,
  rpaVersions: (organizationId: string) =>
    `configurations/rpa/${organizationId}`,
  authConfig: () => `/auth_config/`,
  pbmConfigurations: () => `/auth_config/api_config/select_active_insurance/`,
  drugConfig: () => `/nycbs_drug/`,
  parseInsuranceCard: () =>
    `/auth_config/api_config/select_active_insurance/v1/parse_insurance_card/`,
  portalCredentials: () =>
    `/auth_config/centralised_otp_service/portal_credentials/`,
  uniqueDrugname: () => `/auth_config/unique_drug_name_from_onco_emr/`,
  clientPatients: (clientId: string) => `/client/${clientId}/patients/`,
  clientProviders: (clientId: string) => `/client/${clientId}/providers/`,
  clientPlan: (clientId: string) => `/client/${clientId}/plan/`,
  healthFacilityPatients: (facilityId: string) =>
    `/healthcare_facility/${facilityId}/patients/`,
  healthFacilityProviders: (facilityId: string) =>
    `/healthcare_facility/${facilityId}/providers/`,
  hc_facility_invitations: () => `/healthcare_facility_invitation`,
  encryptionKey: () =>
    `/auth_config/centralised_otp_service/password_encryption_key`,
  emailOptions: () => `/auth_config/centralised_otp_service/emails`,
  healthFacilityPlan: (facilityId: string) =>
    `/healthcare_facility/${facilityId}/plan/`,
  paFormConfig: () => `api_config/nycbs/select-pa-form/`,
  medicineNameConfig: () => `api_config/nycbs/get-medicine-name/`,
  prescriptionParsingConfig: () =>
    `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/`,
  getIcdInstructions: (organization: string, drugId: string) =>
    `api_config/${organization}/icd-config/v1/${drugId}/`,
  getClinicalQuestionnaireRules: (organization: string, drugId: string) =>
    `api_config/${organization}/medical_necessity/v1/${drugId}/`,
  addNewDrug: (organization: string) =>
    `api_config/${organization}/icd-config/`,
  sendToPlanConfigAdd: (organization: string) =>
    `/api_config/${organization}/send-to-plan-config/`,
  otpErrors: () => `/otp_errors/`,
  cmmProcessedOrders: () => `/cmm_workflow/`,
  followUpType: (organization: string) =>
    `/healthcare_facility/${organization}/log_event_details/`,
  payers: (id: string) => `/configurations/${id}`,
  getFaxIdForNotSend: (orderId: string) =>
    `/medical_pa_orders/${orderId}/submission_info/`,
  draftSubmission: (orderId: string) =>
    `/medical_pa_orders/${orderId}/draft_submissions/`,
  allPortalsForDraftSubmission: () =>
    `/auth_config/portals/for_draft_submissions`,
};

export const FirestoreDocumentReference = {
  loggedInUser: (userId: string) => `payer_member/${userId}`,
  payer: (payerId: string) => `payer/${payerId}`,
  payerTeam: (payerId: string, teamId: string) =>
    `payer/${payerId}/teams/${teamId}`,
  payerMember: (payerId: string, memberId: string) =>
    `payer/${payerId}/members/${memberId}`,
  priorAuthRequest: (orderId: string) => `prior_auth_requests/${orderId}`,
  team: (payerId: string, teamId: string) => `payer/${payerId}/teams/${teamId}`,
  orders: (orderId: string) => `/orders/${orderId}/`,
  availityServiceReviewConfiguration: (orderId: string) =>
    `orders/${orderId}/form/config`,
  availityServiceReviewFilledData: (orderId: string) =>
    `orders/${orderId}/form/filled/v1`,
  provider: (id: string) => `/provider/${id}`,
  formQuestionnaire: (orderId: string) =>
    `/orders/${orderId}/submission/questionnaire`,
  medicalPaOrders: (orderId: string) => `/medical_pa_orders/${orderId}`,
  medicalPaOrderQuestionnaire: (orderId: string) =>
    `/medical_pa_orders/${orderId}/nch_portal/filing_details`,
  medicalPaOrderFaxFillingDetails: (orderId: string) =>
    `/medical_pa_orders/${orderId}/fax_questionair/filing_details`,
  configurations2: (id: string) => `configurations/${id}`,
  medicalPaOrdersClinicalData: (orderId: string) =>
    `/medical_pa_orders/${orderId}/clinical_data/condition`,
  rpaConfigurationsDocument: () => `configurations/rpa`,
  rpaVersionDoc: (organizationId: string, versionId: string) =>
    `configurations/rpa/${organizationId}/${versionId}`,
  medicalPaFormConfig: (id: string) =>
    `/auth_config/medical_pa_form_config/v1/${id}`,
  sendToPlanConfig: (organization: string) =>
    `/api_config/${organization}/send-to-plan-config/v1`,
  pbmConfigurations: () => `/auth_config/api_config/select_active_insurance/v1`,
  parsedInsurance: () =>
    `/auth_config/api_config/select_active_insurance/v1/parse_insurance_card/v1`,
  credentialDetails: (credentialId: string) =>
    `/auth_config/centralised_otp_service/portal_credentials/${credentialId}`,
  drugsConfig: () => `api_config/nycbs/icd-config/v1`,
  uniqueFormName: () => `/auth_config/unique_form_name_from_cmm`,
  updateDrugConfig: (organization: string, drugId: string) =>
    `api_config/${organization}/icd-config/v1/${drugId}/`,
  paFormConfig: () => `api_config/nycbs/select-pa-form/v1`,
  medicineNameConfig: (organization: string) =>
    `api_config/nycbs/get-medicine-name/v1`,
  prescriptionParsingConfig: (versionId: string) =>
    `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/other_configs/${versionId}`,
  prescriptionParsingDosageConfig: (versionId: string) =>
    `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/dosage_parsing/${versionId}`,
  prescriptionParsingMedicineConfig: (versionId: string) =>
    `api_config/nycbs/parse-information-from-prescription-configurable-final/latest/medicine_details/${versionId}`,
  drugsConfigurationPath: (organization: string) =>
    `api_config/${organization}/icd-config/medication_list`,
  boOptions: (facilityId: string) =>
    `/healthcare_facility/${facilityId}/options/bo_options`,
  authStatusOptions: (facilityId: string) =>
    `/healthcare_facility/${facilityId}/options/auth_options`,
  demoDoc: (orderId: string) =>
    `/medical_pa_orders/${orderId}/nch_portal/filing_details`,
  processedOrdersToday: (organization: string, date: string) =>
    `healthcare_facility/${organization}/medical_pa_orders/${date}`,
  submissionConfig: (orderId: string) =>
    `/medical_pa_orders/${orderId}/workflow_config/primary`,
  healthFacility: (facilityId: string) => `/healthcare_facility/${facilityId}`,
  ClinicalQuestionnaireRulesUpdate: (organization: string, drugname: string) =>
    `api_config/${organization}/medical_necessity/v1/${drugname}`,
  insuranceOptions: (insuranceId: string) =>
    `/configurations/auth_grid/payers/${insuranceId}`,
  giInfoPath: (organization: string, date: string) =>
    `/healthcare_facility/${organization}/group_inbox_orders/${date}`,
  getFaxInfoPath: (orderId: string) =>
    `/medical_pa_orders/${orderId}/submission_info/output`,
  drugCohort: () => `/auth_config/drug_cohort`,
};
