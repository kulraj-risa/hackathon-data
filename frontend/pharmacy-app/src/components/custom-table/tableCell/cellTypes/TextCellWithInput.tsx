import { handleInputChange } from "./actionHandlers/textCellWithInputHandlers";
import { useTextInputHook } from "./hooks/useTextInputHook";

interface TextCellWithInputProps {
  value: {
    data: string;
    id: string;
    allowInputModification: boolean;
  };
  onValueChangeOfTextField: (value: string, id: string) => void;
}

const TextCellWithInput: React.FC<TextCellWithInputProps> = ({
  value,
  onValueChangeOfTextField,
}) => {
  const { inputValue, setInputValue, checkIfInputIsEmpty } = useTextInputHook(
    value.data,
  );

  return (
    <div className="text-cell-with-input--container flex w-full items-center">
      {value.allowInputModification ? (
        <input
          type="text"
          value={inputValue}
          id={value.id}
          onChange={(e) =>
            handleInputChange(
              e,
              value.id,
              setInputValue,
              onValueChangeOfTextField,
            )
          }
          className={`w-full rounded-md border border-primaryGray-15 p-1 text-xs outline-none ${checkIfInputIsEmpty ? "border-red-500" : "border-primaryGray-15"}`}
        />
      ) : (
        <span className="w-full truncate text-primaryGray-1">{value.data}</span>
      )}
    </div>
  );
};

export default TextCellWithInput;
