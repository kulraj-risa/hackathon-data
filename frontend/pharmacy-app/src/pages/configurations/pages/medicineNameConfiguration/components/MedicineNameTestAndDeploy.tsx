import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState } from "risa-oasis-ui_v2";
import { MedicineNameConfigService } from "../../../../../api/services/medicineNameConfigService";
import { AppDispatch, RootState } from "../../../../../redux/store/store";

const MedicineNameTestAndDeploy: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { versions, currentVersion } = useSelector(
    (state: RootState) => state.medicineNameConfig,
  );

  // Test functionality states
  const [testVersionId, setTestVersionId] = useState(currentVersion);
  const [mrn, setMrn] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Deploy functionality states
  const [deployVersionId, setDeployVersionId] = useState("");
  const [isDeployLoading, setIsDeployLoading] = useState(false);

  // Handle test medicine name configuration
  const handleTestMedicineName = async () => {
    if (!mrn.trim()) {
      controlToastState("medicine-name-test-no-mrn");
      return;
    }

    if (!identifier.trim()) {
      controlToastState("medicine-name-test-no-identifier");
      return;
    }

    if (!optionsText.trim()) {
      controlToastState("medicine-name-test-no-options");
      return;
    }

    if (!testVersionId) {
      controlToastState("medicine-name-test-no-version");
      return;
    }

    setIsTestLoading(true);
    try {
      // Parse options from comma-separated text
      const options = optionsText
        .split(",")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      // Call test API endpoint with all required fields
      const response =
        await MedicineNameConfigService.testMedicineNameConfigurable(
          testVersionId,
          mrn,
          identifier,
          options,
        );

      setTestResponse(response);
      controlToastState("medicine-name-test-success");
    } catch (error) {
      console.error("Error testing medicine name configuration:", error);
      controlToastState("medicine-name-test-error");
      setTestResponse({
        error: "Failed to test medicine name configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  // Handle clear test response
  const handleClearTestResponse = () => {
    setTestResponse(null);
  };

  // Handle deploy version
  const handleDeployVersion = async () => {
    if (!deployVersionId) {
      controlToastState("medicine-name-deploy-no-version");
      return;
    }

    const confirmDeploy = window.confirm(
      `Are you sure you want to deploy version ${deployVersionId} to 'latest'? This will overwrite the current latest version.`,
    );

    if (!confirmDeploy) return;

    setIsDeployLoading(true);
    try {
      await MedicineNameConfigService.deployVersionToLatest(deployVersionId);
      controlToastState("medicine-name-deploy-success");
      setDeployVersionId("");
    } catch (error) {
      console.error("Error deploying version:", error);
      controlToastState("medicine-name-deploy-error");
    } finally {
      setIsDeployLoading(false);
    }
  };

  return (
    <div className="medicine-name-test-deploy h-full p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 className="text-h11 font-bold text-primaryGray-1">
            🚀 Test & Deploy Medicine Name Configuration
          </h2>
          <p className="mt-2 text-small text-primaryGray-8">
            Test medicine name configuration with specific versions using
            BigQuery data and deploy versions to production
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Test Section */}
          <div className="test-section">
            <div className="rounded-lg border border-primaryGray-16 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-h12 font-semibold text-primaryGray-1">
                🧪 Test Medicine Name Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-small font-medium text-primaryGray-1">
                    Configuration Version
                  </label>
                  <select
                    value={testVersionId}
                    onChange={(e) => setTestVersionId(e.target.value)}
                    className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                  >
                    <option value="">Select version...</option>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.id} - {version.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-small font-medium text-primaryGray-1">
                    Medical Record Number (MRN)
                  </label>
                  <input
                    type="text"
                    value={mrn}
                    onChange={(e) => setMrn(e.target.value)}
                    placeholder="Enter MRN, e.g., 12345678"
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
                    placeholder="Enter identifier, e.g., ABC123"
                    className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-small font-medium text-primaryGray-1">
                    Medicine Options (comma-separated)
                  </label>
                  <textarea
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Enter medicine options separated by commas. The drug name and prescription description will be fetched from BigQuery using MRN and identifier.&#10;&#10;Example: Lisinopril 10mg tablets, Lisinopril 20mg tablets, Lisinopril 5mg tablets"
                    className="h-32 w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    buttonType="primary"
                    size="medium"
                    onClick={handleTestMedicineName}
                    disabled={
                      isTestLoading ||
                      !mrn.trim() ||
                      !identifier.trim() ||
                      !optionsText.trim() ||
                      !testVersionId
                    }
                  >
                    {isTestLoading ? "Testing..." : "Test Medicine Name"}
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
                🚀 Deploy Version to Latest
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-small font-medium text-primaryGray-1">
                    Version to Deploy
                  </label>
                  <select
                    value={deployVersionId}
                    onChange={(e) => setDeployVersionId(e.target.value)}
                    className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                  >
                    <option value="">Select version...</option>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.id} - {version.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-small font-medium text-yellow-800">
                        Warning
                      </h3>
                      <div className="mt-2 text-small text-yellow-700">
                        <p>
                          Deploying a version will copy the medicine name
                          configuration from the selected version to the
                          'latest' version, overwriting the current production
                          configuration.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  buttonType="primary"
                  size="medium"
                  onClick={handleDeployVersion}
                  disabled={isDeployLoading || !deployVersionId}
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

              <div className="space-y-4">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primaryGray-1">
                      Status:
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-tiny font-medium ${
                        testResponse.status === "SUCCESS"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {testResponse.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primaryGray-1">
                      Config Loaded:
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-tiny font-medium ${
                        testResponse.config_loaded
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {testResponse.config_loaded ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primaryGray-1">
                      Version Used:
                    </span>
                    <span className="text-primaryGray-8">
                      {testResponse.version_used}
                    </span>
                  </div>
                </div>

                {/* Selected Medicine Name */}
                {testResponse.drug_name && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-green-600">✅</div>
                      <div>
                        <h4 className="font-medium text-green-800">
                          Selected Medicine:
                        </h4>
                        <p className="mt-1 text-small text-green-700">
                          {testResponse.drug_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {testResponse.error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-red-600">❌</div>
                      <div>
                        <h4 className="font-medium text-red-800">Error:</h4>
                        <p className="mt-1 text-small text-red-700">
                          {testResponse.error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Response (Collapsible) */}
                <details className="border-t border-primaryGray-16 pt-4">
                  <summary className="hover:text-primaryGray-0 cursor-pointer font-medium text-primaryGray-1">
                    View Raw Response
                  </summary>
                  <div className="bg-primaryGray-18 mt-3 rounded-md border border-primaryGray-16 p-4">
                    <pre className="overflow-x-auto text-small">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineNameTestAndDeploy;
