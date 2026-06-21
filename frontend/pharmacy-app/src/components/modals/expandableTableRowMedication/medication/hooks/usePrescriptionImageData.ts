import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRapidsFileDownloadUrl } from "../../../../../api/firebase/rapidsFirestore";
import { CmmDocType } from "../../../../../enums/cmmDocType";
import {
  fetchSingleOrderDocs,
  resetDocuments,
} from "../../../../../redux/slice/nycbsPharmaExternal/nycbsDocumentsSlice";
import { AppDispatch, RootState } from "../../../../../redux/store/store";

interface UsePrescriptionImageDataProps {
  rowId?: string | number;
}

interface UsePrescriptionImageDataReturn {
  prescriptionImageUrls: string[];
  loading: boolean;
  isLoadingUrls: boolean;
  error: string;
  loadedImagesCount: number;
  handleImageLoad: () => void;
}

export const usePrescriptionImageData = ({
  rowId,
}: UsePrescriptionImageDataProps): UsePrescriptionImageDataReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: singleOrderDocs, loading } = useSelector(
    (state: RootState) => state.nycbsDocuments,
  );
  const [prescriptionImageUrls, setPrescriptionImageUrls] = useState<string[]>(
    [],
  );
  const [isLoadingUrls, setIsLoadingUrls] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
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

  // Effect to build prescription image URLs when documents are received
  useEffect(() => {
    if (!singleOrderDocs || singleOrderDocs.length === 0) return;

    const prescriptionDocs = singleOrderDocs.filter(
      (doc) => doc.document_type === CmmDocType.PRESCRIPTION,
    );

    if (prescriptionDocs.length > 0) {
      setIsLoadingUrls(true);
      setError("");
      setLoadedImagesCount(0);

      const urls = prescriptionDocs
        .map((doc) => getRapidsFileDownloadUrl(doc.file_path ?? ""))
        .filter((url) => !!url);

      if (urls.length > 0) {
        setPrescriptionImageUrls(urls);
      } else {
        setError("No prescription file paths found");
      }
      setIsLoadingUrls(false);
    }
  }, [singleOrderDocs]);

  const handleImageLoad = () => {
    setLoadedImagesCount((prev) => prev + 1);
  };

  return {
    prescriptionImageUrls,
    loading: initialFetch || loading,
    isLoadingUrls,
    error,
    loadedImagesCount,
    handleImageLoad,
  };
};
