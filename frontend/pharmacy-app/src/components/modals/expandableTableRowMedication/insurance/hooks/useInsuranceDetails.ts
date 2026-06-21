import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBqRecordByIdentifier } from "../../../../../api/bigQuery/paCasesBigQuery";
import { SingleInsuranceInfoProps } from "../../../../../pages/insuranceDetails/components/singleInsuranceInfo";
import { generateInsuranceDetails } from "../../../../../pages/insuranceDetails/utils/generateInsuranceDetails";
import generatePbmEligibilityData from "../../../../../pages/insuranceDetails/utils/generatePbmEligibilityData";
import {
  mapBqRowToInsuranceDetailsModels,
  mapBqRowToPatientEligibilityModels,
} from "../../../../../pages/insuranceDetails/utils/mapBqToInsurance";
import {
  resetInsuranceDetails,
  setInsuranceDetails,
} from "../../../../../redux/slice/cmm/insuranceDetailsSlice";
import { setPatientEligibilityDetailsFromBq } from "../../../../../redux/slice/cmm/patientEligibilitySlice";
import { AppDispatch, RootState } from "../../../../../redux/store/store";

interface UseInsuranceDetailsProps {
  rowId?: string | number;
}

interface UseInsuranceDetailsReturn {
  finalInsuranceDetails: SingleInsuranceInfoProps[];
  loading: boolean;
  hasData: boolean;
}

export const useInsuranceDetails = ({
  rowId,
}: UseInsuranceDetailsProps): UseInsuranceDetailsReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const [fetchingBq, setFetchingBq] = useState(true);
  const { data: insuranceData, loading: insuranceLoading } = useSelector(
    (state: RootState) => state.insuranceDetails,
  );
  const { data: patientEligibilityData, loading: patientEligibilityLoading } =
    useSelector((state: RootState) => state.patientEligibility);

  useEffect(() => {
    if (!rowId) {
      setFetchingBq(false);
      return;
    }

    let cancelled = false;
    setFetchingBq(true);

    const load = async () => {
      try {
        const row = await fetchBqRecordByIdentifier(String(rowId));
        if (cancelled) return;
        if (!row) return;
        dispatch(setInsuranceDetails(mapBqRowToInsuranceDetailsModels(row)));
        dispatch(
          setPatientEligibilityDetailsFromBq(
            mapBqRowToPatientEligibilityModels(row),
          ),
        );
      } finally {
        if (!cancelled) setFetchingBq(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      dispatch(resetInsuranceDetails());
    };
  }, [rowId, dispatch]);

  // Memoize insurance details generation
  const insuranceDetails = useMemo(
    () => (insuranceData ? generateInsuranceDetails(insuranceData) : []),
    [insuranceData],
  );

  // Memoize PBM eligibility data generation
  const pbmEligibilityData = useMemo(
    () =>
      patientEligibilityData && patientEligibilityData?.length > 0
        ? patientEligibilityData.map((detail) =>
            generatePbmEligibilityData(detail),
          )
        : [],
    [patientEligibilityData],
  );

  // Combine insurance details and PBM eligibility data
  const finalInsuranceDetails: SingleInsuranceInfoProps[] = useMemo(() => {
    return [...insuranceDetails, ...pbmEligibilityData];
  }, [insuranceDetails, pbmEligibilityData]);

  const loading = fetchingBq || insuranceLoading || patientEligibilityLoading;
  const hasData = Boolean(insuranceData && insuranceData.length > 0);

  return {
    finalInsuranceDetails,
    loading,
    hasData,
  };
};
