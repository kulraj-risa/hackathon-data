import { Navigate } from "react-router-dom";
import ErrorPage from "../components/errorPage/errorPage";
import { PharmaFormFieldsProvider } from "../context/pharmaFormFieldsContext";
import AgentStudio from "../pages/agentStudio/agentStudio";
import Analytics from "../pages/analytics/analytics";
import CaseSimulator from "../pages/caseSimulator/caseSimulator";
import CaseWorkspace from "../pages/caseWorkspace/caseWorkspace";
import CaseQaReview from "../pages/caseQaReview/caseQaReview";
import CmmOrder from "../pages/cmmOrder/cmmOrder";
import Configurations from "../pages/configurations/configurations";
import DocumentsToAttach from "../pages/configurations/pages/documentsConfiguration/documentsToAttach";
import FieldMappingConfig from "../pages/configurations/pages/fieldMapping/fieldMappingConfig";
import MedicineNameConfiguration from "../pages/configurations/pages/medicineNameConfiguration/medicineNameConfiguration";
import PaCasesData from "../pages/configurations/pages/paCasesData/paCasesData";
import PaCasesSchemaConfig from "../pages/configurations/pages/paCasesSchemaConfig/paCasesSchemaConfig";
import PaFormConfiguration from "../pages/configurations/pages/paFormConfiguration/paFormConfiguration";
import ClinicalQuestionnaire from "../pages/configurations/pages/pharmaPaConfiguration/pages/clinicalQuestionnaire/clinicalQuestionnaire";
import DrugsConfiguration from "../pages/configurations/pages/pharmaPaConfiguration/pages/drugConfig/drugsConfig";
import PbmConfiguration from "../pages/configurations/pages/pharmaPaConfiguration/pages/pbmConfiguration/pbmConfiguration";
import ProviderList from "../pages/configurations/pages/pharmaPaConfiguration/pages/providerList/providerList";
import SendToPlanConfig from "../pages/configurations/pages/pharmaPaConfiguration/pages/sendToPlanConfig/sendToPlanConfig";
import PharmaPaConfigurationLayout from "../pages/configurations/pages/pharmaPaConfiguration/pharmaPaConfigurationLayout";
import PrescriptionParsingConfiguration from "../pages/configurations/pages/prescriptionParsingConfiguration/prescriptionParsingConfiguration";
import WorklistConfig from "../pages/configurations/pages/worklistConfig/worklistConfig";
import CredentialsConfig from "../pages/credentialsConfigration/credentialsConfig";
import FetchIcd from "../pages/fetchIcd/fetchIcd";
import InsuranceDetailsLayout from "../pages/insuranceDetails/insuranceDetailsLayout";
import InternalProcessedOrderStatus from "../pages/internalProcessedOrderStatus/internalProcessedOrderStatus";
import MedicalNecessity from "../pages/medicalNecessity/medicalNecessity";
import PaSearch from "../pages/paSearch/paSearch";
import PharmaOutcomeLayout from "../pages/pharmaOutcome/pharmaOutcomeLayout";
import PharmaPaDiffDataLayout from "../pages/pharmaPaDiffData/pharmaPaDiffDataLayout";
import PharmaPaDiffViewer from "../pages/pharmaPaDiffViewer/pharmaPaDiffViewer";
import PharmaPaFormLayout from "../pages/pharmaPaForm/pharmaPaFormLayout";
import PharmaPaWorklistLayout from "../pages/pharmaPaWorklist/pharmaPaWorklistLayout";
import PharmaQuestionaireLayout from "../pages/pharmaQuestionaire/pharmaQuestionaireLayout";
import PharmaStpFile from "../pages/pharmaStpFile/pharmaStpFile";
import PharmaStpFileLayout from "../pages/pharmaStpFile/pharmaStpFileLayout";
import Profile from "../pages/settings/profile/profile";
import Security from "../pages/settings/security/security";
import Settings from "../pages/settings/settings";
import Support from "../pages/settings/support/support";

void PaCasesData;
void FieldMappingConfig;
export const PharmaPaRouteConfig = [
  {
    index: true,
    element: <Navigate to="pharma-pa-worklists/pharma-pa-orders" replace />,
  },
  {
    path: "pharma-pa-worklists",
    element: <PharmaPaWorklistLayout />,
    children: [
      { index: true, element: <Navigate to="pharma-pa-orders" replace /> },
      { path: "pharma-pa-orders", element: <CmmOrder /> },
      { path: "pharma-pa-case/:id", element: <CaseWorkspace /> },
      {
        path: "pharma-pa-form/:id",
        element: (
          <PharmaFormFieldsProvider>
            <PharmaPaFormLayout />
          </PharmaFormFieldsProvider>
        ),
      },
      {
        path: "pharma-pa-questionaire/:id",
        element: <PharmaQuestionaireLayout />,
      },
      {
        path: "pharma-pa-outcome/:id",
        element: <PharmaOutcomeLayout />,
      },
      {
        path: "insurance-details/:id",
        element: (
          <PharmaFormFieldsProvider>
            <InsuranceDetailsLayout />
          </PharmaFormFieldsProvider>
        ),
      },
    ],
  },
  {
    path: "pharma-pa-sftp-file",
    element: <PharmaStpFileLayout />,
    children: [
      { index: true, element: <Navigate to="sftp-file-orders" replace /> },
      { path: "sftp-file-orders", element: <PharmaStpFile /> },
      {
        path: "pharma-pa-form/:id",
        element: (
          <PharmaFormFieldsProvider>
            <PharmaPaFormLayout />
          </PharmaFormFieldsProvider>
        ),
      },
      {
        path: "pharma-pa-questionaire/:id",
        element: <PharmaQuestionaireLayout />,
      },
      {
        path: "pharma-pa-outcome/:id",
        element: <PharmaOutcomeLayout />,
      },
      {
        path: "insurance-details/:id",
        element: (
          <PharmaFormFieldsProvider>
            <InsuranceDetailsLayout />
          </PharmaFormFieldsProvider>
        ),
      },
    ],
  },
  {
    path: "pharma-pa-fetch-icd",
    element: <FetchIcd />,
  },
  {
    path: "pharma-pa-medical-necessity",
    element: <MedicalNecessity />,
  },
  {
    path: "pharma-pa-diff-data",
    element: <PharmaPaWorklistLayout />,
    children: [
      { index: true, element: <Navigate to="diff-data-table" replace /> },
      { path: "diff-data-table", element: <PharmaPaDiffDataLayout /> },
      {
        path: "diff-data-viewer/:id",
        element: <PharmaPaDiffViewer />,
      },
    ],
  },
  {
    path: "pharma-pa-status-internal",
    element: <InternalProcessedOrderStatus />,
  },
  {
    path: "configurations",
    element: <Configurations />,
    children: [
      {
        index: true,
        element: <Navigate to="pa-cases-schema" replace />,
      },
      {
        path: "pa-cases-schema",
        element: <PaCasesSchemaConfig />,
      },
      {
        path: "worklist-config",
        element: <WorklistConfig />,
      },
      {
        path: "pa-cases-data",
        element: <PaCasesData />,
      },
      {
        path: "field-mapping",
        element: <FieldMappingConfig />,
      },
      { path: "documents-configuration", element: <DocumentsToAttach /> },
      // {
      //   path: "form-configuration",
      //   element: <FormConfigurationLayout />,
      //   children: [
      //     { index: true, element: <Navigate to="form-config" replace /> },
      //     { path: "form-config", element: <FormConfig /> },
      //     {
      //       path: "form-config/:id",
      //       element: <SingleFormConfiguration />,
      //     },
      //   ],
      // },
      {
        path: "pa-form-configuration",
        element: <PaFormConfiguration />,
      },
      {
        path: "medicine-name-configuration",
        element: <MedicineNameConfiguration />,
      },
      {
        path: "prescription-parsing-configuration",
        element: <PrescriptionParsingConfiguration />,
      },
      {
        path: "pharma-pa-configuration",
        element: <PharmaPaConfigurationLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="send-to-plan-config" replace />,
          },
          { path: "send-to-plan-config", element: <SendToPlanConfig /> },
          { path: "pbm-configurations", element: <PbmConfiguration /> },
          { path: "drugs-configuration", element: <DrugsConfiguration /> },
          { path: "clinical-questionaire", element: <ClinicalQuestionnaire /> },
        ],
      },

      {
        path: "credentials-configuration",
        element: <CredentialsConfig />,
      },
      // { path: "client-configuration", element: <ClientConfiguration /> },
      { path: "provider-list", element: <ProviderList /> },
      // { path: "payer-config", element: <PayerConfiguration /> },
      // { path: "nar-agent-grid", element: <NarAgentGridLayout /> },
      // {
      //   path: "health-facility",
      //   element: <HealthFacilityConfiguration />,
      // },
    ],
  },
  {
    path: "pa-search",
    element: <PaSearch />,
  },
  {
    path: "pharma-analytics",
    element: <Analytics />,
  },
  {
    path: "pharma-agent-studio",
    element: <AgentStudio />,
  },
  {
    path: "pharma-pa-simulator",
    element: <CaseSimulator />,
  },
  {
    path: "pharma-pa-qa-review",
    element: <CaseQaReview />,
  },
  {
    path: "settings",
    element: <Settings />,
    children: [
      { index: true, element: <Navigate to="profile" replace /> },
      { path: "profile", element: <Profile /> },
      { path: "security", element: <Security /> },
      { path: "support", element: <Support /> },
    ],
  },

  {
    path: "*",
    element: <ErrorPage />,
  },
];
