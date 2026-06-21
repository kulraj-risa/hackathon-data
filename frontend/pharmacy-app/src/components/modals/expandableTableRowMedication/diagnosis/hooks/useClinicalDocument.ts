import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRapidsFileDownloadUrl } from "../../../../../api/firebase/rapidsFirestore";
import {
  fetchSingleOrderDocs,
  resetDocuments,
} from "../../../../../redux/slice/nycbsPharmaExternal/nycbsDocumentsSlice";
import { AppDispatch, RootState } from "../../../../../redux/store/store";

interface UseClinicalDocumentProps {
  rowId?: string | number;
}

interface UseClinicalDocumentReturn {
  clinicalDocUrl: string;
  loading: boolean;
  isLoadingUrl: boolean;
  error: string;
}

export const useClinicalDocument = ({
  rowId,
}: UseClinicalDocumentProps): UseClinicalDocumentReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: singleOrderDocs, loading } = useSelector(
    (state: RootState) => state.nycbsDocuments,
  );
  const [clinicalDocUrl, setClinicalDocUrl] = useState<string>("");
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
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

  // Effect to build clinical document URL when documents are received
  useEffect(() => {
    if (!singleOrderDocs || singleOrderDocs.length === 0) return;

    const clinicalDoc = singleOrderDocs.find(
      (doc) => doc.document_type === "clinical_attachment",
    );

    if (clinicalDoc?.file_path) {
      const downloadUrl = getRapidsFileDownloadUrl(clinicalDoc.file_path);
      if (downloadUrl) {
        setClinicalDocUrl(downloadUrl);
      } else {
        setError("Failed to load document URL");
      }
    }
  }, [singleOrderDocs]);

  return {
    clinicalDocUrl,
    loading: initialFetch || loading,
    isLoadingUrl,
    error,
  };
};
