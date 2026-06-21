import React from "react";
import { Button, SpinningLoader } from "risa-oasis-ui_v2";
import { fetchDocuments } from "../../../../redux/slice/documentsConfiguration";
import { ConfigurationBrowserContent } from "./components/ConfigurationBrowserContent";
import { ConfigurationBrowserDialogs } from "./components/ConfigurationBrowserDialogs";
import "./ConfigurationBrowser.scss";
import { createLevelHandlers } from "./handlers/levelHandlers";
import { useConfigurationBrowser } from "./hooks/useConfigurationBrowser";
import { useConfigurationEffects } from "./hooks/useConfigurationEffects";
import { useVersionManagement } from "./hooks/useVersionManagement";

const ConfigurationBrowser: React.FC = () => {
  const browserState = useConfigurationBrowser();
  const {
    documents,
    currentDocument,
    storeLevel2Documents,
    storeLevel3Documents,
    isLoading,
    error,
    dispatch,
    selectedLevel1Id,
    setSelectedLevel1Id,
    selectedLevel2Id,
    setSelectedLevel2Id,
    selectedLevel3Id,
    setSelectedLevel3Id,
    selectedVersionInUse,
    setSelectedVersionInUse,
    selectedItemData,
    setSelectedItemData,
    shouldScroll,
    setShouldScroll,
    versionInUseLoading,
    setVersionInUseLoading,
  } = browserState;

  // Use effects for state management
  useConfigurationEffects({
    selectedLevel1Id,
    selectedLevel2Id,
    selectedLevel3Id,
    selectedItemData,
    shouldScroll,
    currentDocument,
    storeLevel2Documents,
    storeLevel3Documents,
    dispatch,
    setSelectedLevel2Id,
    setSelectedLevel3Id,
    setSelectedVersionInUse,
    setSelectedItemData,
    setShouldScroll,
  });

  // Version management
  const {
    level2Options,
    level3Options,
    versionInUseOptions,
    findMatchingVersion,
  } = useVersionManagement({
    storeLevel2Documents,
    storeLevel3Documents,
    selectedVersionInUse,
    selectedLevel2Id,
    versionInUseLoading,
    setSelectedVersionInUse,
  });

  // Level handlers
  const {
    handleLevel1Change,
    handleLevel2Change,
    handleLevel3Change,
    handleVersionInUseChange,
  } = createLevelHandlers(
    setSelectedLevel1Id,
    setSelectedLevel2Id,
    setSelectedLevel3Id,
    setSelectedVersionInUse,
    setSelectedItemData,
    setVersionInUseLoading,
    selectedLevel1Id,
    selectedLevel2Id,
    selectedLevel3Id,
    storeLevel3Documents,
    findMatchingVersion,
    dispatch,
  );

  // Create document options for level 1
  const level1Options =
    documents?.map((doc) => ({
      value: doc.id,
      label: doc.id,
    })) || [];

  if (isLoading && !documents) {
    return (
      <div className="configuration-browser">
        <div className="loading-container">
          <SpinningLoader />
          <p>Loading configuration documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="configuration-browser">
        <div className="error-container">
          <h3>Error loading documents</h3>
          <p>{error}</p>
          <Button
            onClick={() => dispatch(fetchDocuments())}
            buttonType="primary"
            size="medium"
            disabled={false}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="configuration-browser">
      <ConfigurationBrowserContent
        selectedLevel1Id={selectedLevel1Id}
        selectedLevel2Id={selectedLevel2Id}
        selectedLevel3Id={selectedLevel3Id}
        selectedVersionInUse={selectedVersionInUse}
        selectedItemData={selectedItemData}
        shouldScroll={shouldScroll}
        versionInUseLoading={versionInUseLoading}
        level1Options={level1Options}
        level2Options={level2Options}
        level3Options={level3Options}
        versionInUseOptions={versionInUseOptions}
        handleLevel1Change={handleLevel1Change}
        handleLevel2Change={handleLevel2Change}
        handleLevel3Change={handleLevel3Change}
        handleVersionInUseChange={handleVersionInUseChange}
        browserState={browserState}
      />

      <ConfigurationBrowserDialogs
        browserState={browserState}
        isLoading={isLoading}
        storeLevel3Documents={storeLevel3Documents}
      />

      {isLoading && (
        <div className="loading-indicator">
          <SpinningLoader />
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default ConfigurationBrowser;
