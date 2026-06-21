import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState, Toast } from "risa-oasis-ui_v2";
import { PrescriptionParsingConfigService } from "../../../../../api/services/prescriptionParsingConfigService";
import { AppDispatch, RootState } from "../../../../../redux/store/store";

const PrescriptionParsingTestAndDeploy: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { versions, currentVersions } = useSelector(
    (state: RootState) => state.prescriptionParsingConfig,
  );

  // Test functionality states
  const [mrn, setMrn] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [testMainVersionId, setTestMainVersionId] = useState(
    currentVersions.main,
  );
  const [testDosageVersionId, setTestDosageVersionId] = useState(
    currentVersions.dosage,
  );
  const [testMedicineVersionId, setTestMedicineVersionId] = useState(
    currentVersions.medicine,
  );
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Deploy functionality states
  const [deployMainVersionId, setDeployMainVersionId] = useState("");
  const [deployDosageVersionId, setDeployDosageVersionId] = useState("");
  const [deployMedicineVersionId, setDeployMedicineVersionId] = useState("");
  const [isDeployLoading, setIsDeployLoading] = useState(false);
  const [deployedVersions, setDeployedVersions] = useState<{
    main: string;
    dosage: string;
    medicine: string;
  } | null>(null);

  // Handle test prescription parsing
  const handleTestPrescription = async () => {
    if (!mrn.trim() || !identifier.trim()) {
      controlToastState("prescription-parsing-test-no-request-body");
      return;
    }

    if (!testMainVersionId || !testDosageVersionId || !testMedicineVersionId) {
      controlToastState("prescription-parsing-test-no-version");
      return;
    }

    setIsTestLoading(true);
    try {
      // Call the API with MRN, identifier, and all three version IDs
      const response =
        await PrescriptionParsingConfigService.testPrescriptionParsing(
          mrn,
          identifier,
          testMainVersionId,
          testDosageVersionId,
          testMedicineVersionId,
        );

      // Add version information to the response
      const enhancedResponse = {
        ...response,
        test_versions_used: {
          main: testMainVersionId,
          dosage: testDosageVersionId,
          medicine: testMedicineVersionId,
        },
      };

      setTestResponse(enhancedResponse);
      controlToastState("prescription-parsing-test-success");
    } catch (error) {
      console.error("Error testing prescription parsing:", error);
      controlToastState("prescription-parsing-test-error");
      setTestResponse({
        error: "Failed to test prescription parsing",
        details: error,
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  // Handle clear test response
  const handleClearTestResponse = () => {
    setTestResponse(null);
  };

  // Handle deploy version to latest
  const handleDeployVersion = async () => {
    if (
      !deployMainVersionId ||
      !deployDosageVersionId ||
      !deployMedicineVersionId
    ) {
      controlToastState("prescription-parsing-deploy-no-version");
      return;
    }

    const confirmDeploy = window.confirm(
      `Are you sure you want to deploy the selected versions to 'latest'? This will overwrite the current production configuration.\n\nMain: ${deployMainVersionId}\nDosage: ${deployDosageVersionId}\nMedicine: ${deployMedicineVersionId}`,
    );

    if (!confirmDeploy) return;

    setIsDeployLoading(true);
    try {
      // Deploy each section independently by getting the data and updating the latest version

      // Deploy main config
      const mainConfig =
        await PrescriptionParsingConfigService.getVersionForSection(
          deployMainVersionId,
          "main",
        );
      await PrescriptionParsingConfigService.updatePrescriptionParsingConfigurationForSection(
        {
          ...mainConfig,
          id: "latest",
          created_at: new Date().toISOString(),
          created_by: "system",
          description: `Deployed from main version ${deployMainVersionId}`,
          deployed_from: deployMainVersionId,
          deployed_at: new Date().toISOString(),
        },
        "main",
        "latest",
      );

      // Deploy dosage config
      const dosageConfig =
        await PrescriptionParsingConfigService.getVersionForSection(
          deployDosageVersionId,
          "dosage",
        );
      await PrescriptionParsingConfigService.updatePrescriptionParsingConfigurationForSection(
        {
          ...dosageConfig,
          id: "latest",
          created_at: new Date().toISOString(),
          created_by: "system",
          description: `Deployed from dosage version ${deployDosageVersionId}`,
          deployed_from: deployDosageVersionId,
          deployed_at: new Date().toISOString(),
        },
        "dosage",
        "latest",
      );

      // Deploy medicine config
      const medicineConfig =
        await PrescriptionParsingConfigService.getVersionForSection(
          deployMedicineVersionId,
          "medicine",
        );
      await PrescriptionParsingConfigService.updatePrescriptionParsingConfigurationForSection(
        {
          ...medicineConfig,
          id: "latest",
          created_at: new Date().toISOString(),
          created_by: "system",
          description: `Deployed from medicine version ${deployMedicineVersionId}`,
          deployed_from: deployMedicineVersionId,
          deployed_at: new Date().toISOString(),
        },
        "medicine",
        "latest",
      );

      setDeployedVersions({
        main: deployMainVersionId,
        dosage: deployDosageVersionId,
        medicine: deployMedicineVersionId,
      });
      controlToastState("prescription-parsing-deploy-versions-success");
    } catch (error) {
      console.error("Error deploying versions:", error);
      controlToastState("prescription-parsing-deploy-error");
    } finally {
      setIsDeployLoading(false);
    }
  };

  return (
    <div className="prescription-parsing-test-deploy h-full p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 className="text-h11 font-bold text-primaryGray-1">
            🚀 Test & Deploy Prescription Parsing
          </h2>
          <p className="mt-2 text-small text-primaryGray-8">
            Test prescription parsing with specific configuration versions and
            deploy versions to production
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Test Section */}
          <div className="test-section">
            <div className="rounded-lg border border-primaryGray-16 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-h12 font-semibold text-primaryGray-1">
                🧪 Test Prescription Parsing
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      Main Config Version
                    </label>
                    <select
                      value={testMainVersionId}
                      onChange={(e) => setTestMainVersionId(e.target.value)}
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    >
                      <option value="">Select version...</option>
                      {versions.main.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.id} - {version.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      Dosage Parsing Version
                    </label>
                    <select
                      value={testDosageVersionId}
                      onChange={(e) => setTestDosageVersionId(e.target.value)}
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    >
                      <option value="">Select version...</option>
                      {versions.dosage.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.id} - {version.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      Medicine Details Version
                    </label>
                    <select
                      value={testMedicineVersionId}
                      onChange={(e) => setTestMedicineVersionId(e.target.value)}
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    >
                      <option value="">Select version...</option>
                      {versions.medicine.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.id} - {version.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      MRN (Medical Record Number)
                    </label>
                    <input
                      type="text"
                      value={mrn}
                      onChange={(e) => setMrn(e.target.value)}
                      placeholder="Enter MRN, e.g., MRN123456"
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      Identifier
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter prescription identifier, e.g., PRES_ID_789"
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    buttonType="primary"
                    size="medium"
                    onClick={handleTestPrescription}
                    disabled={
                      isTestLoading ||
                      !mrn.trim() ||
                      !identifier.trim() ||
                      !testMainVersionId ||
                      !testDosageVersionId ||
                      !testMedicineVersionId
                    }
                  >
                    {isTestLoading ? "Testing..." : "Test Prescription"}
                  </Button>

                  {testResponse && (
                    <Button
                      buttonType="secondary"
                      size="medium"
                      onClick={handleClearTestResponse}
                      disabled={isTestLoading}
                    >
                      Clear Response
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deploy Section */}
          <div className="deploy-section">
            <div className="rounded-lg border border-primaryGray-16 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-h12 font-semibold text-primaryGray-1">
                🚀 Deploy Versions to Latest
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      Main Config Version
                    </label>
                    <select
                      value={deployMainVersionId}
                      onChange={(e) => setDeployMainVersionId(e.target.value)}
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    >
                      <option value="">Select version...</option>
                      {versions.main.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.id} - {version.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      Dosage Parsing Version
                    </label>
                    <select
                      value={deployDosageVersionId}
                      onChange={(e) => setDeployDosageVersionId(e.target.value)}
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    >
                      <option value="">Select version...</option>
                      {versions.dosage.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.id} - {version.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-small font-medium text-primaryGray-1">
                      Medicine Details Version
                    </label>
                    <select
                      value={deployMedicineVersionId}
                      onChange={(e) =>
                        setDeployMedicineVersionId(e.target.value)
                      }
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    >
                      <option value="">Select version...</option>
                      {versions.medicine.map((version) => (
                        <option key={version.id} value={version.id}>
                          {version.id} - {version.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-small font-medium text-yellow-800">
                        Warning
                      </h3>
                      <div className="mt-2 text-small text-yellow-700">
                        <p>
                          Deploying versions will copy all configurations from
                          the selected versions to the 'latest' versions,
                          overwriting the current production configuration.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  buttonType="primary"
                  size="medium"
                  onClick={handleDeployVersion}
                  disabled={
                    isDeployLoading ||
                    !deployMainVersionId ||
                    !deployDosageVersionId ||
                    !deployMedicineVersionId
                  }
                >
                  {isDeployLoading ? "Deploying..." : "Deploy to Latest"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Response Section */}
        {testResponse && (
          <div className="test-response mt-8">
            <div className="rounded-lg border border-primaryGray-16 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-h12 font-semibold text-primaryGray-1">
                📋 Test Response
              </h3>

              <div className="bg-primaryGray-18 rounded-md border border-primaryGray-16 p-4">
                <pre className="overflow-x-auto text-small">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Toast Messages */}
      <Toast
        type="success"
        header={
          deployedVersions
            ? `Successfully deployed ${deployedVersions.main} (Main), ${deployedVersions.dosage} (Dosage), ${deployedVersions.medicine} (Medicine) to production`
            : "Versions Deployed Successfully"
        }
        id="prescription-parsing-deploy-versions-success"
      />
    </div>
  );
};

export default PrescriptionParsingTestAndDeploy;
