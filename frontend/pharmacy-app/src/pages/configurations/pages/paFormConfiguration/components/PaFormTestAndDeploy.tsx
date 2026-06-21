import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState } from "risa-oasis-ui_v2";
import { PaFormConfigService } from "../../../../../api/services/paFormConfigService";
import { AppDispatch, RootState } from "../../../../../redux/store/store";

const PaFormTestAndDeploy: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { versions, currentVersion } = useSelector(
    (state: RootState) => state.paFormConfig,
  );

  // Test functionality states
  const [mrn, setMrn] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [testVersionId, setTestVersionId] = useState(currentVersion);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Deploy functionality states
  const [deployVersionId, setDeployVersionId] = useState("");
  const [isDeployLoading, setIsDeployLoading] = useState(false);

  // Handle test PA form configuration
  const handleTestPaForm = async () => {
    if (!mrn.trim() || !identifier.trim()) {
      controlToastState("pa-form-test-no-request-body");
      return;
    }

    if (!testVersionId) {
      controlToastState("pa-form-test-no-version");
      return;
    }

    setIsTestLoading(true);
    try {
      // Call test API endpoint with MRN, identifier and version
      const response = await PaFormConfigService.testPaFormConfiguration(
        mrn,
        identifier,
        testVersionId,
      );

      setTestResponse(response);
      controlToastState("pa-form-test-success");
    } catch (error) {
      console.error("Error testing PA form configuration:", error);
      controlToastState("pa-form-test-error");
      setTestResponse({
        error: "Failed to test PA form configuration",
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
      controlToastState("pa-form-deploy-no-version");
      return;
    }

    const confirmDeploy = window.confirm(
      `Are you sure you want to deploy version ${deployVersionId} to 'latest'? This will overwrite the current latest version.`,
    );

    if (!confirmDeploy) return;

    setIsDeployLoading(true);
    try {
      await PaFormConfigService.deployVersionToLatest(deployVersionId);
      controlToastState("pa-form-deploy-success");
      setDeployVersionId("");
    } catch (error) {
      console.error("Error deploying version:", error);
      controlToastState("pa-form-deploy-error");
    } finally {
      setIsDeployLoading(false);
    }
  };

  return (
    <div className="pa-form-test-deploy h-full p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h2 className="text-h11 font-bold text-primaryGray-1">
            🚀 Test & Deploy PA Form Configuration
          </h2>
          <p className="mt-2 text-small text-primaryGray-8">
            Test PA form configuration with specific versions and deploy
            versions to production
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Test Section */}
          <div className="test-section">
            <div className="rounded-lg border border-primaryGray-16 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-h12 font-semibold text-primaryGray-1">
                🧪 Test PA Form Configuration
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
                      placeholder="Enter PA form identifier, e.g., PA_ID_789"
                      className="w-full rounded border border-primaryGray-16 px-3 py-2 text-small"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    buttonType="primary"
                    size="medium"
                    onClick={handleTestPaForm}
                    disabled={
                      isTestLoading ||
                      !mrn.trim() ||
                      !identifier.trim() ||
                      !testVersionId
                    }
                  >
                    {isTestLoading ? "Testing..." : "Test PA Form"}
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
                          Deploying a version will copy the PA form
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

              <div className="bg-primaryGray-18 rounded-md border border-primaryGray-16 p-4">
                <pre className="overflow-x-auto text-small">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaFormTestAndDeploy;
