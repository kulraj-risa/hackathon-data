import { useEffect, useState } from "react";
import { AddMore } from "../../svg/add-more";
import SingleOptionInputBox from "../singleOptionInputBox/singleOptionInputBox";

interface Option {
  id: string;
  value: string;
  label: string;
}

interface OptionForForm {
  value: string;
  label: string;
}

interface OptionsInputBoxProps {
  options?: OptionForForm[];
  emittedOptions?: (options: OptionForForm[]) => void;
}

export const OptionsInputBox = (props: OptionsInputBoxProps) => {
  const [options, setOptions] = useState<Option[]>([
    { id: "0", value: "", label: "" },
  ]);

  useEffect(() => {
    if (props?.options && props?.options.length > 0) {
      setOptions(
        props?.options.map((option, index) => ({
          id: index.toString(),
          value: option.value,
          label: option.label,
        })),
      );
    }
  }, []);

  useEffect(() => {
    if (props?.emittedOptions) {
      const finalOptionsWithId = options.map((option, index) => ({
        value: option.value,
        label: option.label,
      }));
      props?.emittedOptions(finalOptionsWithId);
    }
  }, [options]);

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: Date.now().toString(), value: "", label: "" },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    setOptions((prev) => prev.filter((option) => option.id !== id));
  };

  const handleOptionChange = (
    id: string,
    field: "value" | "label",
    newValue: string,
  ) => {
    setOptions((prev) =>
      prev.map((option) =>
        option.id === id ? { ...option, [field]: newValue } : option,
      ),
    );
  };

  return (
    <>
      <div className="options-input-box--container">
        <div className="options-input-box--header mb-3 flex justify-between">
          <div className="options-input-box--header--title text-sm">
            Options
          </div>
          <div
            className="options-input-box--header--icon flex cursor-pointer items-center gap-2 text-tiny font-bold text-tertiaryBlue-4"
            onClick={handleAddOption}
          >
            <AddMore /> Add Option
          </div>
        </div>
        <div className="options-input-box--body flex flex-col gap-3">
          {options.map((option) => (
            <SingleOptionInputBox
              key={option.id}
              id={option.id}
              value={option.value}
              label={option.label}
              onValueChange={(newValue) =>
                handleOptionChange(option.id, "value", newValue)
              }
              onLabelChange={(newValue) =>
                handleOptionChange(option.id, "label", newValue)
              }
              onRemove={() => handleRemoveOption(option.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
};
