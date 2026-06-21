import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRapidsFileDownloadUrl } from "../../../../../api/firebase/rapidsFirestore";
import { NycbDocumentModel } from "../../../../../data-model/nycbsPharmaOrder";
import {
  fetchSingleOrderDocs,
  resetDocuments,
} from "../../../../../redux/slice/nycbsPharmaExternal/nycbsDocumentsSlice";
import { AppDispatch, RootState } from "../../../../../redux/store/store";

interface UseInsuranceDocumentsProps {
  rowId?: string | number;
}

interface UseInsuranceDocumentsReturn {
  insuranceDocuments: NycbDocumentModel[];
  currentPage: number;
  docUrl: string;
  loading: boolean;
  fetchingDocUrl: boolean;
  error: string;
  setCurrentPage: (page: number) => void;
}

export const useInsuranceDocuments = ({
  rowId,
}: UseInsuranceDocumentsProps): UseInsuranceDocumentsReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: nycbsDocuments, loading } = useSelector(
    (state: RootState) => state.nycbsDocuments,
  );
  const [insuranceDocuments, setInsuranceDocuments] = useState<
    NycbDocumentModel[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [docUrl, setDocUrl] = useState<string>("");
  const [fetchingDocUrl, setFetchingDocUrl] = useState(false);
  const [error, setError] = useState<string>("");
  const [initialFetch, setInitialFetch] = useState(true);

  // Effect to fetch single order documents when rowId changes
  useEffect(() => {
    if (rowId) {
      dispatch(fetchSingleOrderDocs(String(rowId)));
    }
    setInitialFetch(false);

    return () => {
      dispatch(resetDocuments());
    };
  }, [rowId, dispatch]);

  // Effect to filter and sort insurance documents
  useEffect(() => {
    if (nycbsDocuments && nycbsDocuments.length > 0) {
      const insuranceDocument = nycbsDocuments.filter(
        (doc) => doc.document_type === "insurance_card",
      );
      const sortedInsuranceDocumentsByVisitDate = insuranceDocument.sort(
        (a, b) => {
          return (
            new Date(b?.visit_date ?? "").getTime() -
            new Date(a?.visit_date ?? "").getTime()
          );
        },
      );
      setInsuranceDocuments(sortedInsuranceDocumentsByVisitDate);
      setCurrentPage(1); // Reset to first page when documents change
    }
  }, [nycbsDocuments]);

  // Effect to build document URL for current page
  useEffect(() => {
    if (insuranceDocuments.length === 0) return;

    const insuranceDocument = insuranceDocuments[currentPage - 1];
    const downloadUrl = getRapidsFileDownloadUrl(
      insuranceDocument.file_path ?? "",
    );
    if (downloadUrl) {
      setDocUrl(downloadUrl);
    } else {
      setError("Failed to load document URL");
    }
  }, [currentPage, insuranceDocuments]);

  return {
    insuranceDocuments,
    currentPage,
    docUrl,
    loading: initialFetch || loading,
    fetchingDocUrl,
    error,
    setCurrentPage,
  };
};
