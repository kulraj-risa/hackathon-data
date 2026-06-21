import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPrescriptionData,
  resetPrescriptionDataOnUnmount,
} from "../../../../../redux/slice/cmm/prescriptionSlice";
import { AppDispatch, RootState } from "../../../../../redux/store/store";
import { generatePatientDataForPrescription } from "../../../prescriptionModal/utils/generateDataForPrescription";
import { generateDrugDataForPrescription } from "../../../prescriptionModal/utils/generateDrugDataForPrescription";
import { PrescriptionData } from "../types";

interface UsePrescriptionDataProps {
  rowId?: string | number;
}

interface UsePrescriptionDataReturn extends PrescriptionData {
  loading: boolean;
  error: any;
}

export const usePrescriptionData = ({
  rowId,
}: UsePrescriptionDataProps): UsePrescriptionDataReturn => {
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
    // Clear initial fetch flag after dispatch (next render will pick up Redux loading)
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
