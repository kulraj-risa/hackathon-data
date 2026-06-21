import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Modal } from "risa-oasis-ui_v2";
import { mapDiagnosesDetails } from "../../../data-model/dignosisDetailsModal";
import { DiagnosisModalViewMode } from "../../../enums/diagnosisModalViewMode";
import { RootState } from "../../../redux/store/store";
import CustomTable from "../../custom-table/custom-table";
import "./diagnosisCodeModal.scss";
import {
  DiagnosisCodesTableHeader,
  generateDiagnosisTableData,
} from "./table/diagnosisTableData";

interface DiagnosisCodeModalProps {
  onClose: () => void;
}

const DiagnosisCodeModal = (props: DiagnosisCodeModalProps) => {
  const [viewMode, setViewMode] = useState<DiagnosisModalViewMode>(
    DiagnosisModalViewMode.TABLE,
  );
  const [selectedThinking, setSelectedThinking] = useState({
    thinking: "",
    diagnosisId: "",
  });

  const handleViewThinking = useCallback(
    (thinking: string, diagnosisId: string) => {
      setSelectedThinking({ thinking, diagnosisId });
      setViewMode(DiagnosisModalViewMode.THINKING);
    },
    [],
  );

  const handleBackToTable = () => {
    setViewMode(DiagnosisModalViewMode.TABLE);
  };

  const { data: singleCmmOrderData, loading } = useSelector(
    (state: RootState) => state.cmmSingleOrder,
  );

  const diagnosisTableData = useMemo(() => {
    const raw = (singleCmmOrderData as any)?.all_diagnosis_codes;
    const allCodes: any[] = Array.isArray(raw) ? raw : [];
    if (!Array.isArray(allCodes) || allCodes.length === 0) return [];
    const details = allCodes.map((code: any) => mapDiagnosesDetails(code));
    return generateDiagnosisTableData(details, handleViewThinking);
  }, [singleCmmOrderData, handleViewThinking]);

  return (
    <Modal
      dialogId={"diagnosis-codes-modal"}
      onSave={props.onClose}
      title={
        viewMode === DiagnosisModalViewMode.TABLE
          ? "Diagnosis Codes"
          : `LLM Thinking - Diagnosis ${selectedThinking.diagnosisId}`
      }
      saveButtonText={"Close"}
      cancelText={""}
      onCancel={props.onClose}
      onClose={props.onClose}
      heightPercentage={80}
      showSingleButton={true}
      hideFooter={true}
    >
      <div className="diagnosis-codes-modal--container">
        {loading ? (
          <div className="flex h-full items-center justify-center p-8 text-primaryGray-9">
            Loading diagnosis data...
          </div>
        ) : viewMode === DiagnosisModalViewMode.TABLE ? (
          <CustomTable
            tableHeaders={DiagnosisCodesTableHeader}
            tableData={diagnosisTableData}
            tableName={"Diagnosis Codes"}
            hideSearchBar={true}
            totalCount={diagnosisTableData.length}
            itemsPerPage={10}
            pagesPerView={10}
            count={diagnosisTableData.length}
          />
        ) : (
          <div className="llm-thinking-view">
            <button
              onClick={handleBackToTable}
              className="diagnosis-modal__back-button"
            >
              ← Back to Table
            </button>
            <div className="llm-thinking-modal__content">
              <div className="llm-thinking-modal__text-container">
                <pre className="llm-thinking-modal__text">
                  {selectedThinking.thinking || "No thinking data available."}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DiagnosisCodeModal;
