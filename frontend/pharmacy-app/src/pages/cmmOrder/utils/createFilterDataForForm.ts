import {
  CmmFilterKeys,
  FormPickedValues,
  StatusValues,
} from "../../../enums/cmmFilterKeys";

export const createFilterForInsuranceCardDate = () => {
  return {
    id: CmmFilterKeys.DateOfFiling,
    label: "Date of Filing",
    options: [],
    type: "date" as const,
  };
};

export const createFilterForStatus = () => {
  return {
    id: CmmFilterKeys.Status,
    label: "Status",
    options: [
      {
        label: "Form Filled",
        value: StatusValues.FormFilled,
      },
      {
        label: "Sent to plan",
        value: StatusValues.SentToPlan,
      },
      {
        label: "QA Fetched",
        value: StatusValues.QaFetched,
      },
      {
        label: "Inaccuracy",
        value: StatusValues.Inaccuracy,
      },
      {
        label: "Form Error",
        value: StatusValues.FormError,
      },
    ],
    type: "string" as const,
  };
};

export const createFilterForFormPickedVia = () => {
  return {
    id: CmmFilterKeys.FormPickedVia,
    label: "Form Picked Via",
    options: [
      {
        label: "Rx Details 25",
        value: FormPickedValues.RxDetails25,
      },
      {
        label: "Rx Details 24",
        value: FormPickedValues.RxDetails24,
      },
      {
        label: "PBM",
        value: FormPickedValues.Pbm,
      },
    ],
    type: "string" as const,
  };
};
