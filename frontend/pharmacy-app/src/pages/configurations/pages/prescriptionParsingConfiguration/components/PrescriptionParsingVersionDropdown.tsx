import React from "react";
import { Select } from "risa-oasis-ui_v2";
import { PrescriptionParsingVersion } from "../../../../../api/services/prescriptionParsingConfigService";

interface PrescriptionParsingVersionDropdownProps {
  versions: PrescriptionParsingVersion[];
  currentVersion: string;
  onVersionChange: (versionId: string) => void;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
}

const PrescriptionParsingVersionDropdown: React.FC<
  PrescriptionParsingVersionDropdownProps
> = ({
  versions,
  currentVersion,
  onVersionChange,
  isLoading = false,
  hasUnsavedChanges = false,
}) => {
  const handleVersionChange = (data: { value: string }) => {
    onVersionChange(data.value);
  };

  const formatVersionLabel = (version: PrescriptionParsingVersion) => {
    const date = new Date(version.created_at).toLocaleDateString();
    const description = version.description || `Version ${version.id}`;
    return `${version.id} - ${description} (${date})`;
  };

  const versionOptions = versions.map((version) => ({
    value: version.id,
    label: formatVersionLabel(version),
  }));

  return (
    <div className="flex items-center gap-2">
      <span className="text-small font-medium text-primaryGray-8">
        Version:
      </span>
      <div className="relative">
        <Select
          id="prescription-parsing-version-select"
          label=""
          value={currentVersion}
          onOptionChange={handleVersionChange}
          options={versionOptions}
          placeholder="Select version..."
        />
        {hasUnsavedChanges && (
          <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-500" />
        )}
      </div>
      {isLoading && (
        <div className="text-tiny text-primaryGray-8">Loading versions...</div>
      )}
    </div>
  );
};

export default PrescriptionParsingVersionDropdown;
