import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeModal,
  controlToastState,
  Modal,
  openModal,
} from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { fetchParsedInsurance } from "../../../redux/slice/parsedInsuranceSlice";
import { AppDispatch, RootState } from "../../../redux/store/store";
import CardComponent from "./component/cardComponent";

interface ParsedInsuranceCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatKey = (key: string) => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const ParsedInsuranceCard = ({ isOpen, onClose }: ParsedInsuranceCardProps) => {
  const { parsedInsuranceData } = useSelector(
    (state: RootState) => state.parsedInsurance,
  );

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const [updatedData, setUpdatedData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  const handleSave = async () => {
    setIsSaving(true);
    if (!updatedData) {
      return;
    }
    let newDataToSave = {
      ...updatedData,
    };
    newDataToSave["updated_at"] = new Date().toISOString();
    newDataToSave["updated_by"] = user?.email ?? "";
    try {
      await FirestoreService.updateDocument(
        FirestoreCollectionReference.parseInsuranceCard(),
        parsedInsuranceData.id,
        { ...newDataToSave },
      );
      controlToastState("parsed-insurance-card-save-success");
      dispatch(fetchParsedInsurance());
      setIsSaving(false);
      onClose();
    } catch (error) {
      console.error("Error saving parsed insurance data:", error);
      controlToastState("parsed-insurance-card-save-failure");
    }
  };

  useEffect(() => {
    if (isOpen) {
      openModal("parsed-insurance-card");
    } else {
      closeModal("parsed-insurance-card");
    }
  }, [isOpen]);

  return (
    <Modal
      dialogId="parsed-insurance-card"
      title="Parsed Insurance Card"
      onClose={onClose}
      onSave={handleSave}
      saveButtonText={isSaving ? "Saving..." : "Save"}
      cancelText="Cancel"
      heightPercentage={70}
      disableSave={isSaving ? true : false}
    >
      <div className="flex flex-col gap-2">
        {parsedInsuranceData &&
          Object.keys(parsedInsuranceData)
            .filter(
              (key) =>
                key !== "id" && key !== "updated_at" && key !== "updated_by",
            )
            .map((key) => (
              <CardComponent
                key={key}
                title={formatKey(key)}
                data={parsedInsuranceData[key]}
                onChange={(newValue) => {
                  setUpdatedData((prev) => ({
                    ...prev,
                    [key]: newValue,
                  }));
                }}
              />
            ))}
      </div>
    </Modal>
  );
};

export default ParsedInsuranceCard;
