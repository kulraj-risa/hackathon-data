import React from "react";
import { Select } from "risa-oasis-ui_v2";

export interface SelectOption {
  value: string;
  label: string;
}

interface ConfigSelectProps {
  id: string;
  label: string;
  options: SelectOption[];
  value: string;
  placeholder?: string;
  onChange: (value: any) => void;
  required?: boolean;
}

const ConfigSelect: React.FC<ConfigSelectProps> = ({
  id,
  label,
  options,
  value,
  placeholder = "Select an option",
  onChange,
  required = false,
}) => {
  return (
    <div className="config-select">
      <Select
        id={id}
        label={label}
        options={options}
        onOptionChange={onChange}
        defaultValue={value}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};

export default ConfigSelect;
