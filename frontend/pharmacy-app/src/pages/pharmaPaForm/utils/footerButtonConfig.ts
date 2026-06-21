import { NycbsPharmaOrderModel } from "../../../data-model/nycbsPharmaOrder";
import { NycbsPharmaOrderKeys } from "../../../enums/nycbsPharmaOrder";
import { generateFieldNamesWhichHaveNoValue } from "../../cmmOrder/table/cmmOrderTableData";
import { getButtonConfig } from "../../cmmOrder/utils/getButtonLabel";

interface FooterButtonConfigParams {
  data: NycbsPharmaOrderModel | null;
  isAllFieldsValidationFree: boolean;
  isFormDirty: boolean;
}

export const getFooterButtonConfig = ({
  data,
  isAllFieldsValidationFree,
  isFormDirty,
}: FooterButtonConfigParams) => {
  if (!data) {
    return {
      label: "Send to Plan",
      disabled: true,
    };
  }

  const noDataFields = generateFieldNamesWhichHaveNoValue(data);
  const hasMissingData = noDataFields.length > 0;
  const buttonConfig = getButtonConfig(
    data?.[NycbsPharmaOrderKeys.Status] ?? "",
    hasMissingData,
  );

  // Additional checks for form-specific conditions
  let isDisabled = buttonConfig.disabled;

  // If button is for "Send to Plan", apply additional validation checks
  if (buttonConfig.buttonId === "send_to_plan") {
    if (
      data?.[NycbsPharmaOrderKeys.CmmResultKey] === undefined ||
      data?.[NycbsPharmaOrderKeys.CmmResultKey] === null ||
      data?.[NycbsPharmaOrderKeys.CmmResultKey]?.trim() === ""
    ) {
      isDisabled = true;
    }

    if (!isAllFieldsValidationFree) {
      isDisabled = true;
    }

    if (isFormDirty) {
      isDisabled = true;
    }
  }

  return {
    label: buttonConfig.label,
    buttonId: buttonConfig.buttonId,
    disabled: isDisabled,
  };
};
