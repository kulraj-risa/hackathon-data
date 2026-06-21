import JsonView from "@uiw/react-json-view";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { useEffect, useState } from "react";
import { Modal, SpinningLoader } from "risa-oasis-ui_v2";
import { fetchBqRecordByIdentifier } from "../../../api/bigQuery/paCasesBigQuery";
import { mapToCoverMyMedsInputModel } from "../../../data-model/cmmInputRequestModel";
import { mapBqRowToFlatModel } from "../../../utils/mapBqRowToFlatModel";

interface CmmInputViewerModalForCmmOrdersProps {
  onClose: () => void;
  orderId: string;
}

const CmmInputViewerModalForCmmOrders = (
  props: CmmInputViewerModalForCmmOrdersProps,
) => {
  const [cmmInput, setCmmInput] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCmmInput = async () => {
      try {
        setLoading(true);
        const bqRow = await fetchBqRecordByIdentifier(props.orderId);
        if (bqRow) {
          const cmmInputData = mapToCoverMyMedsInputModel(
            mapBqRowToFlatModel(bqRow),
          );
          setCmmInput(cmmInputData);
        } else {
          setError("No record found in BigQuery for this order");
        }
      } catch (err) {
        setError("Failed to fetch CMM input data from BigQuery");
      } finally {
        setLoading(false);
      }
    };

    if (props.orderId) {
      fetchCmmInput();
    }
  }, [props.orderId]);

  return (
    <Modal
      dialogId="cmm-input-viewer-modal"
      title="CMM Input Viewer"
      saveButtonText="Close"
      cancelText="Cancel"
      onSave={props.onClose}
      heightPercentage={70}
      onClose={props.onClose}
      hideFooter={true}
    >
      <div className="cmm-input--viewer h-full w-full rounded-md">
        {loading && (
          <div className="flex flex-row items-center justify-center gap-2 p-8">
            <SpinningLoader />
            <div className="text-gray-600">Loading CMM input data...</div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center p-8">
            <div className="text-red-600">{error}</div>
          </div>
        )}
        {!loading && !error && cmmInput && (
          <JsonView style={githubLightTheme} value={cmmInput} />
        )}
      </div>
    </Modal>
  );
};

export default CmmInputViewerModalForCmmOrders;
