import React from "react";
import { Select } from "risa-oasis-ui_v2";
import { MedicineNameVersion } from "../../../../../api/services/medicineNameConfigService";

interface MedicineNameVersionDropdownProps {
  versions: MedicineNameVersion[];
  currentVersion: string;
  onVersionChange: (versionId: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const MedicineNameVersionDropdown: React.FC<
  MedicineNameVersionDropdownProps
> = ({ versions, currentVersion, onVersionChange, isLoading, disabled }) => {
  const formatVersionForDisplay = (version: MedicineNameVersion) => {
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
    <div className="medicine-name-version-dropdown">
      <div className="version-dropdown__header mb-2">
        <label className="text-small font-medium text-primaryGray-1">
          Medicine Name Configuration Version
        </label>
        <p className="mt-1 text-tiny text-primaryGray-8">
          Choose a version to view or modify medicine name configuration
        </p>
      </div>

      <Select
        id="medicine-name-version-select"
        label=""
        options={versionOptions}
        placeholder={isLoading ? "Loading versions..." : "Select a version"}
        defaultValue={currentVersion}
        onOptionChange={handleVersionChange}
      />

      {versions.length > 0 && (
        <div className="mt-2 text-tiny text-primaryGray-8">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
            <span>
              Currently viewing:{" "}
              {versions.find((v) => v.id === currentVersion)?.id ||
                currentVersion}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineNameVersionDropdown;
