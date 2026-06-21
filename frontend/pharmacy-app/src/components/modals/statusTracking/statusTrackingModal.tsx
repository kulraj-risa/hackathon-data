import moment from "moment";
import { useEffect, useState } from "react";
import {
  closeModal,
  controlToastState,
  DateInput,
  Modal,
  openModal,
  TextInput,
} from "risa-oasis-ui_v2";
import { postStatusTracking } from "../../../api/postCall/statusTracking";
import { AddMore } from "../../../svg/add-more";

interface StatusTrackingModalProps {
  onClose?: () => void;
}

interface FieldSet {
  id: string;
  drugName: string;
  patientMRN: string;
  patientName: string;
  dateOfBirth: string;
  coverMyMedId: string;
}

interface OrderPayload {
  drug: string;
  patient_mrn: string;
  patient_name: string;
  dob: string;
  covermymed_id: string;
}

export const StatusTrackingModal = ({ onClose }: StatusTrackingModalProps) => {
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [fieldSets, setFieldSets] = useState<FieldSet[]>([
    {
      id: "",
      drugName: "",
      patientMRN: "",
      patientName: "",
      dateOfBirth: "",
      coverMyMedId: "",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    openModal("status-tracking-modal");
  }, []);

  const handleClose = () => {
    closeModal("status-tracking-modal");
    if (onClose) {
      onClose();
    }
  };

  const addNewFieldSet = () => {
    const newSet: FieldSet = {
      id: Date.now().toString(),
      drugName: "",
      patientMRN: "",
      patientName: "",
      dateOfBirth: "",
      coverMyMedId: "",
    };
    setFieldSets([...fieldSets, newSet]);
  };

  const updateFieldSet = (
    setId: string,
    field: keyof FieldSet,
    value: string,
  ) => {
    setFieldSets(
      fieldSets.map((set) =>
        set.id === setId ? { ...set, [field]: value } : set,
      ),
    );
  };

  const removeFieldSet = (setId: string) => {
    if (fieldSets.length > 1) {
      setFieldSets(fieldSets.filter((set) => set.id !== setId));
    }
  };

  const validateFields = (): boolean => {
    return fieldSets.every(
      (set) =>
        set.drugName.trim() !== "" &&
        set.patientMRN.trim() !== "" &&
        set.patientName.trim() !== "" &&
        set.dateOfBirth.trim() !== "" &&
        set.coverMyMedId.trim() !== "",
    );
  };

  const handleSave = async () => {
    if (!validateFields()) {
      controlToastState(`order-pushed-failure`);
      return;
    }

    setIsLoading(true);
    try {
      const orders: OrderPayload[] = fieldSets.map((set) => ({
        drug: set.drugName,
        patient_mrn: set.patientMRN,
        patient_name: set.patientName,
        dob: set.dateOfBirth,
        covermymed_id: set.coverMyMedId,
      }));

      const payload = {
        orders: orders,
      };

      const response = await postStatusTracking(payload);
      if (response.ok) {
        controlToastState(`order-pushed-success`);
        closeModal("status-tracking-modal");
      }

      handleClose();
    } catch (error) {
      console.error("Error making API call:", error);
      controlToastState(`order-pushed-failure`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      dialogId={`status-tracking-modal`}
      onSave={handleSave}
      title={"Status Tracking"}
      saveButtonText={isLoading ? "Saving..." : "Save"}
      cancelText={"Cancel"}
      disableSave={isLoading}
      onClose={handleClose}
      heightPercentage={60}
    >
      <div className="w-full">
        <div className="flex flex-col gap-3 overflow-y-auto">
          {fieldSets.map((fieldSet, index) => (
            <fieldset
              key={fieldSet.id}
              className="relative rounded border border-gray-300 p-4"
            >
              <legend className="flex flex-row items-center justify-between px-2 font-semibold">
                Fields Required
                {fieldSets.length > 1 && (
                  <div
                    onClick={() => removeFieldSet(fieldSet.id)}
                    className="absolute right-0 top-0 mr-4 flex cursor-pointer flex-row gap-2 bg-white px-2 text-sm text-tertiaryRed-4 hover:text-tertiaryRed-5"
                  >
                    <div>x</div>
                    <div>Remove</div>
                  </div>
                )}
              </legend>
              <div className="grid grid-cols-1 gap-3">
                <TextInput
                  id={`drug-name-${fieldSet.id}`}
                  label={"Drug"}
                  required
                  defaultValue={fieldSet.drugName}
                  onChange={(data) =>
                    updateFieldSet(fieldSet.id, "drugName", data.value)
                  }
                  error={""}
                />
                <TextInput
                  id={`patient-mrn-${fieldSet.id}`}
                  label={"Patient MRN"}
                  required
                  defaultValue={fieldSet.patientMRN}
                  onChange={(data) =>
                    updateFieldSet(fieldSet.id, "patientMRN", data.value)
                  }
                  error={""}
                />
                <TextInput
                  id={`patient-name-${fieldSet.id}`}
                  label={"Patient Name"}
                  required
                  defaultValue={fieldSet.patientName}
                  onChange={(data) =>
                    updateFieldSet(fieldSet.id, "patientName", data.value)
                  }
                  error={""}
                />
                <DateInput
                  id={`date-of-birth-${fieldSet.id}`}
                  label={"Date of Birth"}
                  required
                  format="MM/DD/YYYY"
                  defaultValue={fieldSet.dateOfBirth}
                  onChange={(data) =>
                    updateFieldSet(
                      fieldSet.id,
                      "dateOfBirth",
                      moment(data.value).format("MM/DD/YYYY"),
                    )
                  }
                  error={""}
                />
                <TextInput
                  id={`covermymed-id-${fieldSet.id}`}
                  label={"CoverMyMed ID"}
                  required
                  defaultValue={fieldSet.coverMyMedId}
                  onChange={(data) =>
                    updateFieldSet(fieldSet.id, "coverMyMedId", data.value)
                  }
                  error={""}
                />
              </div>
            </fieldset>
          ))}

          <div className="mt-1 flex justify-end">
            <div
              onClick={addNewFieldSet}
              className="flex cursor-pointer items-center gap-2"
            >
              Add New
              <AddMore />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
