export const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  id: string,
  setInputValue: (value: string) => void,
  onValueChangeOfTextField: (value: string, id: string) => void,
) => {
  setInputValue(e.target.value);
  onValueChangeOfTextField(e.target.value, id);
};
