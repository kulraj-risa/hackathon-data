import { useMemo, useState } from "react";

export const useTextInputHook = (defaultValue: string) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  const checkIfInputIsEmpty = useMemo(() => {
    return inputValue.trim() === "";
  }, [inputValue]);
  return {
    inputValue,
    setInputValue,
    checkIfInputIsEmpty,
  };
};
