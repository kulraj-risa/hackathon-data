import React, { useState } from "react";
import { Button, SpinningLoader } from "risa-oasis-ui_v2";

import { AddIcon } from "../../../../../svg/add-icon";
import { CodeBranchIcon } from "../../../../../svg/code-branch-icon";
import SettingsIcon from "../../../../../svg/settings-icon";
import ConfigSelect, { SelectOption } from "../ConfigSelect";
import NestedObjectViewer from "../NestedObjectViewer";
import { getFieldNameFromPath, getPlaceholderForField } from "../utils/helpers";

interface ConfigurationBrowserContentProps {
  selectedLevel1Id: string;
  selectedLevel2Id: string;
  selectedLevel3Id: string;
  selectedVersionInUse: string;
  selectedItemData: any;
  shouldScroll: boolean;
  versionInUseLoading: boolean;
  level1Options: SelectOption[];
  level2Options: SelectOption[];
  level3Options: SelectOption[];
  versionInUseOptions: SelectOption[];
  handleLevel1Change: (option: SelectOption) => void;
  handleLevel2Change: (option: SelectOption) => void;
  handleLevel3Change: (option: SelectOption) => void;
  handleVersionInUseChange: (option: SelectOption) => void;
  browserState: any;
}

export const ConfigurationBrowserContent: React.FC<
  ConfigurationBrowserContentProps
> = ({
  selectedLevel1Id,
  selectedLevel2Id,
  selectedLevel3Id,
  selectedVersionInUse,
  selectedItemData,
  shouldScroll,
  versionInUseLoading,
  level1Options,
  level2Options,
  level3Options,
  versionInUseOptions,
  handleLevel1Change,
  handleLevel2Change,
  handleLevel3Change,
  handleVersionInUseChange,
  browserState,
}) => {
  const [selectedVersionToDeploy, setSelectedVersionToDeploy] =
    useState<string>(selectedVersionInUse);

  const {
    setAddListItemDialogState,
    setAddKeywordDocumentDialogState,
    setAddCategoryDialogState,
    setVersionIdDialogState,
    setDeleteItemDialogState,
  } = browserState;

  const handleOpenAddListItemDialog = (path: string[], currentValue: any[]) => {
    setAddListItemDialogState({
      isOpen: true,
      fieldPath: path,
      currentValue,
      title: `Add Item to ${getFieldNameFromPath(path)}`,
      placeholder: getPlaceholderForField(path),
      fieldName: "Item Value",
    });
  };

  const handleOpenAddKeywordDocumentDialog = (
    path: string[],
    currentValue: any[],
  ) => {
    setAddKeywordDocumentDialogState({
      isOpen: true,
      fieldPath: path,
      currentValue,
      title: "Add New Keyword Document",
    });
  };

  const handleOpenAddCategoryDialog = () =>
    setAddCategoryDialogState({ isOpen: true });

  const handleOpenVersionIdDialog = () => {
    setVersionIdDialogState({ isOpen: true });
  };

  const handleDeleteItem = (
    itemPath: string[],
    itemName: string,
    itemIndex?: number,
    itemType?: "list-item" | "keyword-document" | "category",
  ) => {
    const fullPath = `Configuration > ${selectedLevel3Id} > ${itemPath.join(" > ")}`;
    setDeleteItemDialogState({
      isOpen: true,
      itemPath,
      itemName,
      itemIndex,
      itemType: itemType || "list-item",
      fullPath,
    });
  };

  const handleVersionToDeployChange = (option: SelectOption) => {
    setSelectedVersionToDeploy(option.value);
  };

  const handleDeployClick = () => {
    const selectedOption = versionInUseOptions.find(
      (option) => option.value === selectedVersionToDeploy,
    );
    if (selectedOption) {
      handleVersionInUseChange(selectedOption);
    }
  };

  return (
    <>
      <div className="section">
        <h5 className="section-title">Organization</h5>
        <div className="level-row">
          <div className="select-container">
            <ConfigSelect
              id="level1-select"
              label=""
              options={level1Options}
              value={selectedLevel1Id}
              onChange={handleLevel1Change}
              placeholder="Organizations"
            />
          </div>
        </div>
      </div>

      {selectedLevel1Id && (
        <div className="section">
          <div className="levels-container">
            <div className="level-row level-row-combined">
              <div className="level-item">
                <h5 className="section-title">Configuration Type</h5>
                <div className="select-container">
                  {level2Options.length === 0 ? (
                    <p className="no-data-message">
                      No configuration types found. Add one to get started.
                    </p>
                  ) : (
                    <ConfigSelect
                      id="level2-select"
                      label=""
                      options={level2Options}
                      value={selectedLevel2Id}
                      onChange={handleLevel2Change}
                      placeholder="Configurations"
                    />
                  )}
                </div>
              </div>

              {selectedLevel2Id && (
                <div className="level-item">
                  <h5 className="section-title">Version</h5>
                  <div className="select-container">
                    {level3Options.length === 0 ? (
                      <div className="version-controls">
                        <p className="no-data-message">No versions found.</p>
                        <Button
                          buttonType="primary"
                          size="small"
                          onClick={handleOpenVersionIdDialog}
                          disabled={false}
                        >
                          <AddIcon width="16" height="16" color="#0056d6" />
                          Version
                        </Button>
                      </div>
                    ) : (
                      <div className="version-controls">
                        <div className="config-select-wrapper">
                          <ConfigSelect
                            id="level3-select"
                            label=""
                            options={level3Options}
                            value={selectedLevel3Id}
                            onChange={handleLevel3Change}
                            placeholder="Versions"
                          />
                        </div>
                        <Button
                          buttonType="secondary"
                          size="small"
                          onClick={handleOpenVersionIdDialog}
                          disabled={false}
                        >
                          <AddIcon width="16" height="16" color="#0056d6" />
                          Version
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLevel2Id && versionInUseOptions.length > 0 && (
                <div className="level-item">
                  <h5 className="section-title">Version Deployed (Live)</h5>
                  <div className="version-controls">
                    <div className="config-select-wrapper">
                      <ConfigSelect
                        id="version-in-use-select"
                        label=""
                        options={versionInUseOptions}
                        value={selectedVersionToDeploy}
                        onChange={handleVersionToDeployChange}
                        placeholder="Select Version to Deploy"
                      />
                    </div>
                    {versionInUseLoading ? (
                      <div className="loading-button">
                        <SpinningLoader />
                      </div>
                    ) : (
                      <Button
                        buttonType="primary"
                        size="small"
                        onClick={handleDeployClick}
                        disabled={false}
                      >
                        Deploy
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedItemData && (
        <div className="section">
          <div className="section-header">
            <div className="header-content">
              <h3>
                {selectedLevel3Id ? (
                  <>
                    <CodeBranchIcon
                      width="16"
                      height="16"
                      color="#4a90e2"
                      className=""
                    />
                    Configuration for Version :{" "}
                    <span style={{ color: "#4a90e2", marginLeft: "5px" }}>
                      {selectedLevel3Id}
                    </span>
                  </>
                ) : (
                  <>
                    <SettingsIcon onClick={() => {}} />
                    Configuration Details
                  </>
                )}
              </h3>
            </div>
          </div>
          <div className="content-card scrollable-details">
            <NestedObjectViewer
              data={
                selectedItemData.configuration
                  ? Object.keys(selectedItemData.configuration)
                      .sort()
                      .reduce((acc, key) => {
                        acc[key] = selectedItemData.configuration[key];
                        return acc;
                      }, {})
                  : {}
              }
              excludeFields={["id"]}
              showEditButton={false}
              onAddToList={
                selectedLevel3Id ? handleOpenAddListItemDialog : undefined
              }
              onAddKeywordDocument={
                selectedLevel3Id
                  ? handleOpenAddKeywordDocumentDialog
                  : undefined
              }
              onAddCategory={
                selectedLevel3Id ? handleOpenAddCategoryDialog : undefined
              }
              onDeleteItem={selectedLevel3Id ? handleDeleteItem : undefined}
              shouldScroll={shouldScroll}
            />
          </div>
        </div>
      )}
    </>
  );
};
