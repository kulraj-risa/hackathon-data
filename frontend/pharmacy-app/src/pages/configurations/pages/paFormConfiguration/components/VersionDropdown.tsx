import React from "react";
import { Select } from "risa-oasis-ui_v2";
import { PaFormVersion } from "../../../../../api/services/paFormConfigService";

interface VersionDropdownProps {
  versions: PaFormVersion[];
  currentVersion: string;
  onVersionChange: (versionId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const VersionDropdown: React.FC<VersionDropdownProps> = ({
  versions,
  currentVersion,
  onVersionChange,
  isLoading = false,
  disabled = false,
}) => {
  const formatVersionForDisplay = (version: PaFormVersion) => {
    const createdDate = new Date(version.created_at).toLocaleDateString();
    const createdTime = new Date(version.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      value: version.id,
      label: `${version.id} - ${version.description || "No description"}`,
      subLabel: `Created: ${createdDate} at ${createdTime} by ${version.created_by || "Unknown"}`,
    };
  };

  const versionOptions = versions.map(formatVersionForDisplay);

  const handleVersionChange = (data: { value: string }) => {
    onVersionChange(data.value);
  };

  return (
    <div className="version-dropdown">
      <div className="version-dropdown__header mb-2">
        <label className="text-small font-medium text-primaryGray-1">
          Select Version
        </label>
        <p className="mt-1 text-tiny text-primaryGray-8">
          Choose a version to view or modify its configuration
        </p>
      </div>

      <Select
        id="version-select"
        label=""
        options={versionOptions}
        placeholder={isLoading ? "Loading versions..." : "Select a version"}
        defaultValue={currentVersion}
        onOptionChange={handleVersionChange}
      />

      {versions.length > 0 && (
        <div className="version-dropdown__info mt-2">
          <div className="text-tiny text-primaryGray-8">
            <span className="font-medium">{versions.length}</span> version
            {versions.length !== 1 ? "s" : ""} available
          </div>
          {currentVersion && (
            <div className="text-tiny text-primaryGray-8">
              Currently viewing:{" "}
              <span className="font-medium text-primaryGray-1">
                {currentVersion}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionDropdown;
