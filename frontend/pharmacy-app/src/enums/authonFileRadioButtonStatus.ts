export const generateAuthOnFileRadioButtonStatusOptions = (
  authOnFileRadioButtonStatus: { label: string; value: string }[],
) => {
  const status = authOnFileRadioButtonStatus.map((status) => ({
    id: status.value,
    text: status.label,
    bgColor: "#F5F5F5",
    textColor: "#0F0F0F",
  }));

  return [...status];
};
