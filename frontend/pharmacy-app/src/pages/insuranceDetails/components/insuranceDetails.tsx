import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";

import { generateInsuranceDetails } from "../utils/generateInsuranceDetails";
import generatePbmEligibilityData from "../utils/generatePbmEligibilityData";
import SingleInsuranceInfo, {
  SingleInsuranceInfoProps,
} from "./singleInsuranceInfo";

const InsuranceDetails = () => {
  const { data } = useSelector((state: RootState) => state.insuranceDetails);
  const { data: patientEligibilityData } = useSelector(
    (state: RootState) => state.patientEligibility,
  );

  const insuranceDetails = useMemo(
    () => (data ? generateInsuranceDetails(data) : []),
    [data],
  );

  const pbmEligibilityData = useMemo(
    () =>
      patientEligibilityData && patientEligibilityData?.length > 0
        ? patientEligibilityData.map((detail) =>
            generatePbmEligibilityData(detail),
          )
        : [],
    [patientEligibilityData],
  );

  const finalInsuranceDetails: SingleInsuranceInfoProps[] = useMemo(() => {
    return [...insuranceDetails, ...pbmEligibilityData];
  }, [insuranceDetails, pbmEligibilityData]);

  return (
    <div className="insurance-details flex flex-col gap-6">
      {finalInsuranceDetails.map((insurance, index) => (
        <SingleInsuranceInfo {...insurance} />
      ))}
    </div>
  );
};

export default InsuranceDetails;
