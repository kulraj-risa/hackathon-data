import moment from "moment";
import { InsuranceDetailsModel } from "../../../data-model/insuranceDetails";
import {
  determineBackgroundColorOfTags,
  determineTextColorOfTags,
} from "./determineColorOfTags";

export const generateInsuranceDetails = (
  insuranceData: InsuranceDetailsModel[],
) => {
  const priorityOrder = [
    "primary",
    "secondary",
    "tertiary",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
  ];

  return insuranceData
    .map((insurance) => {
      const insurerName = insurance?.insurer ?? "";
      const tagText = insurance?.type ?? "Other";
      const insurerForeGroundColor = determineTextColorOfTags(tagText);
      const insurerBackgroundColor = determineBackgroundColorOfTags(tagText);
      const insuranceDetails = generateDataForInsuranceCards(insurance);

      return {
        insurerName,
        insurerTag: {
          tagText,
          tagColor: insurerForeGroundColor,
          tagBgColor: insurerBackgroundColor,
        },
        insuranceDetails,
        sortOrder:
          priorityOrder.indexOf(tagText.toLowerCase()) !== -1
            ? priorityOrder.indexOf(tagText.toLowerCase())
            : 100,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

const generateDataForInsuranceCards = (
  insurance: InsuranceDetailsModel,
): {
  header: string;
  body: string;
}[] => {
  const generatedData = [
    {
      header: "Policy Number",
      body: insurance?.policyNumber ? "••••••" : "",
    },
    {
      header: "Effective Date",
      body: insurance?.effectiveDate
        ? moment(insurance?.effectiveDate).format("MM/DD/YYYY")
        : "",
    },
    {
      header: "Phone Number",
      body: insurance?.phone ?? "",
    },
    {
      header: "Group Number",
      body: insurance?.groupNumber ?? "",
    },
    {
      header: "Plan Name",
      body: insurance?.planName ?? "",
    },
    {
      header: "Plan Number",
      body: insurance?.planNumber ?? "",
    },
    {
      header: "Retail Benefit",
      body: insurance?.retailBenefit ?? "",
    },
    {
      header: "Mail Order Benefit",
      body: insurance?.mailOrderBenefit ?? "",
    },
    {
      header: "LTC Benefit",
      body: insurance?.ltc ?? "",
    },
    {
      header: "Specialty Benefit",
      body: insurance?.specialty ?? "",
    },
  ];

  return generatedData.filter((item) => item.body !== "");
};
