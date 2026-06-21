import { OrderStatus } from "../../../enums/authStatus";

interface ButtonConfig {
  label: string;
  buttonId: string;
  disabled: boolean;
}

export const getButtonConfig = (
  status?: string,
  hasMissingData?: boolean,
): ButtonConfig => {
  switch (status) {
    case OrderStatus.IN_PROGRESS:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: true,
      };
    case OrderStatus.INACCURACY:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: true,
      };
    case OrderStatus.PRESCRIPTION_ERROR:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: true,
      };
    case OrderStatus.INSURANCE_ERROR:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: true,
      };
    case OrderStatus.FORM_ERROR:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: true,
      };
    case OrderStatus.FORM_FILLED:
      // If there's missing data (Yes), disable the button
      // If no missing data (No), enable the button
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: hasMissingData === true,
      };
    case OrderStatus.SENDING_TO_PLAN:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: true,
      };
    case OrderStatus.SENDING_TO_PLAN_ERROR:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: false,
      };
    case OrderStatus.SENT_TO_PLAN:
      return {
        label: "View Clinical",
        buttonId: "view_clinical",
        disabled: false,
      };
    case OrderStatus.QA_IN_PROGRESS:
      return {
        label: "Fetch QA",
        buttonId: "fetch_qa",
        disabled: true,
      };
    case OrderStatus.QA_NOT_FOUND:
      return {
        label: "Retry QA",
        buttonId: "retry_qa",
        disabled: false,
      };
    case OrderStatus.QA_ERROR:
      return {
        label: "Retry QA",
        buttonId: "retry_qa",
        disabled: false,
      };
    case OrderStatus.QA_INCOMPLETE:
      return {
        label: "View Clinical",
        buttonId: "view_clinical",
        disabled: false,
      };
    case OrderStatus.QA_FETCHED:
    case OrderStatus.Approved:
    case OrderStatus.Denied:
    case OrderStatus.Pending:
    case "Question Response":
    case "Request Response":
      return {
        label: "View Clinical",
        buttonId: "view_clinical",
        disabled: false,
      };
    default:
      return {
        label: "Send to Plan",
        buttonId: "send_to_plan",
        disabled: true,
      };
  }
};
