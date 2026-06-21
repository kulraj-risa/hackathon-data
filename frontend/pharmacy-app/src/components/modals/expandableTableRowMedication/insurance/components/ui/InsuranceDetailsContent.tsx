import React from "react";
import SingleInsuranceInfo, {
  SingleInsuranceInfoProps,
} from "../../../../../../pages/insuranceDetails/components/singleInsuranceInfo";

interface InsuranceDetailsContentProps {
  insuranceDetails: SingleInsuranceInfoProps[];
}

export const InsuranceDetailsContent: React.FC<
  InsuranceDetailsContentProps
> = ({ insuranceDetails }) => {
  return (
    <div className="insurance-details flex h-full w-full flex-col gap-6 overflow-y-auto bg-white p-2">
      {insuranceDetails.map((insurance, index) => (
        <SingleInsuranceInfo key={index} {...insurance} />
      ))}
    </div>
  );
};
