import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPrescriptionData,
  resetPrescriptionDataOnUnmount,
} from "../../../../../redux/slice/cmm/prescriptionSlice";
import { AppDispatch, RootState } from "../../../../../redux/store/store";
import { generatePatientDataForPrescription } from "../../../prescriptionModal/utils/generateDataForPrescription";
import { generateDrugDataForPrescription } from "../../../prescriptionModal/utils/generateDrugDataForPrescription";
import { PrescriptionDetailsData } from "../types";

interface UsePrescriptionDetailsProps {
  rowId?: string | number;
}

interface UsePrescriptionDetailsReturn extends PrescriptionDetailsData {
  loading: boolean;
  error: any;
}

export const usePrescriptionDetails = ({
  rowId,
}: UsePrescriptionDetailsProps): UsePrescriptionDetailsReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector(
    (state: RootState) => state.prescription,
  );

  const [patientDetails, setPatientDetails] = useState<any[]>([]);
  const [drugDetails, setDrugDetails] = useState<any[]>([]);
  const [initialFetch, setInitialFetch] = useState(true);

  // Effect to fetch prescription data when rowId changes
  useEffect(() => {
    if (rowId) {
      dispatch(fetchPrescriptionData(String(rowId)));
    }
    setInitialFetch(false);

    return () => {
      dispatch(resetPrescriptionDataOnUnmount());
    };
  }, [rowId, dispatch]);

  // Effect to process data when it's received
  useEffect(() => {
    if (data) {
      setPatientDetails(generatePatientDataForPrescription(data));
      setDrugDetails(generateDrugDataForPrescription(data));
    }
  }, [data]);

  return {
    patientDetails,
    drugDetails,
    loading: initialFetch || loading,
    error,
  };
};
