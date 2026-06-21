import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal, Modal, openModal } from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../api/firebase/references";
import { fetchPbmConfiguration } from "../../../redux/slice/pbmConfigurationSlice";
import { AppDispatch, RootState } from "../../../redux/store/store";
import WarningIcon from "../../../svg/warningIcon";
import StepCard from "../../stepCards/stepCard";

interface PbmConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PbmConfigModal = ({ isOpen, onClose }: PbmConfigModalProps) => {
  const { data, isLoading } = useSelector(
    (state: RootState) => state.pbmConfigurations,
  );
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const dispatch = useDispatch<AppDispatch>();

  const [localSteps, setLocalSteps] = useState<any[]>([]);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.workflow?.steps) {
      setLocalSteps(
        [...data.workflow.steps].sort((a, b) => a.priority - b.priority),
      );
    }
  }, [data?.workflow?.steps]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isSwapMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", index.toString());
    e.currentTarget.classList.add("dragging");
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isSwapMode) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("dragging");
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!isSwapMode) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (sourceIndex === targetIndex) return;

    const newSteps = [...localSteps];
    const sourceStep = newSteps[sourceIndex];
    const targetStep = newSteps[targetIndex];

    // Swap the steps
    newSteps[sourceIndex] = targetStep;
    newSteps[targetIndex] = sourceStep;

    // Update priorities
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      priority: index + 1,
    }));

    setLocalSteps(updatedSteps);
    setHasChanges(true);
  };

  const handleSwapModeToggle = () => {
    setIsSwapMode(!isSwapMode);
    if (!isSwapMode) {
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await FirestoreService.updateDocument(
        FirestoreCollectionReference.pbmConfigurations(),
        "v1",
        {
          "workflow.steps": localSteps,
          updated_at: new Date().toISOString(),
          updated_by: user?.email ?? "N/A",
        },
      );
      setHasChanges(false);
      setIsSwapMode(false);
      dispatch(fetchPbmConfiguration());
      onClose();
    } catch (error) {
      console.error("Error saving step order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      openModal("pbm-config-modal");
    } else {
      closeModal("pbm-config-modal");
    }
  }, [isOpen]);

  return (
    <Modal
      dialogId="pbm-config-modal"
      onSave={handleSave}
      title="Steps"
      saveButtonText={isSaving ? "Saving..." : "Save"}
      cancelText="Cancel"
      onClose={onClose}
      disableSave={!hasChanges || isSaving}
    >
      <div
        className="mx-1 mb-2 flex cursor-pointer items-center justify-end text-sm font-semibold text-tertiaryBlue-5 hover:text-tertiaryRed-5"
        onClick={handleSwapModeToggle}
      >
        {isSwapMode ? "Exit Swap Mode" : "Swap Step Orders"}
      </div>
      {isSwapMode && (
        <div className="mx-1 mb-4 flex max-w-full items-start gap-2 break-words rounded-md border border-yellow-700 bg-yellow-50 p-2 text-sm text-tiny text-yellow-700">
          <div className="py-1">
            <WarningIcon height="16" width="16" />
          </div>
          <div>
            Saving steps will revert any unsaved changes in the configuration.
            To proceed with saving swapped steps, ensure any changes in the
            configuration is saved first.
          </div>
        </div>
      )}
      <div className="h-full w-full">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {localSteps.map((step, index) => (
              <div
                key={step.id}
                draggable={isSwapMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`${isSwapMode ? "cursor-move overflow-y-auto" : "overflow-y-auto"}`}
              >
                <StepCard
                  type={data?.schema?.step_types?.[step.type]?.title}
                  priority={step.priority}
                  config={step.config}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PbmConfigModal;
