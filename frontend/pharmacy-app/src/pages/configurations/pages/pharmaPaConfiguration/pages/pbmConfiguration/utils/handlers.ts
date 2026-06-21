import { controlToastState } from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../../../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../../../../../api/firebase/references";
import { fetchPbmConfiguration } from "../../../../../../../redux/slice/pbmConfigurationSlice";
import { cleanObject } from "../../../../../../../utils/cleanObject";
import {
  deleteNestedValue,
  getNestedValue,
  setNestedValue,
} from "../../../../../../../utils/getNestedValue";

export const handleAddMore = (
  path: string,
  initialData: Record<string, any>,
  setInitialData: (data: Record<string, any>) => void,
  schemaCopies: { [key: string]: number },
  updateSchemaCopies: (path: string, copies: number) => void,
) => {
  const currentData = { ...initialData };
  const newValue = {};
  const newData = setNestedValue(currentData, path, newValue);
  updateSchemaCopies(path, (schemaCopies[path] || 0) + 1);
  setInitialData(newData);
};

export const handleDelete = (
  path: string,
  copyIndex: number,
  initialData: Record<string, any>,
  setInitialData: (data: Record<string, any>) => void,
  schemaCopies: { [key: string]: number },
  updateSchemaCopies: (path: string, copies: number) => void,
) => {
  const newPath = `${path}[${copyIndex}]`;
  const currentData = { ...initialData };
  const newData = deleteNestedValue(currentData, newPath);
  updateSchemaCopies(path, (schemaCopies[path] || 0) - 1);
  setInitialData(newData);
};

export const handleChange = (
  e: any,
  path: string,
  type: string,
  ui_component: string | undefined,
  initialData: Record<string, any>,
  setInitialData: (data: Record<string, any>) => void,
  setResetField: (value: boolean) => void,
) => {
  setResetField(false);
  if (type !== "array") {
    const currentData = { ...initialData };
    const newData = setNestedValue(
      currentData,
      path,
      ui_component === "number" ? Number(e.value) : e.value,
    );
    setInitialData(newData);
  }
};

export const handleAddMoreInArray = (
  data: any,
  path: string,
  ui_component: string | undefined,
  initialData: Record<string, any>,
  setInitialData: (data: Record<string, any>) => void,
  setResetField: (value: boolean) => void,
) => {
  if (data.value.trim() !== "") {
    const value = ui_component === "number" ? Number(data.value) : data.value;
    const currentData = { ...initialData };
    const existingValue = getNestedValue(currentData, path);
    const newData = setNestedValue(
      currentData,
      path,
      existingValue ? value : [value],
    );
    setInitialData(newData);
    setResetField(true);
  }
};

export const handleCrossClick = (
  path: string,
  index: number,
  initialData: Record<string, any>,
  setInitialData: (data: Record<string, any>) => void,
) => {
  const newPath = `${path}[${index}]`;
  const currentData = { ...initialData };
  const newData = deleteNestedValue(currentData, newPath);
  setInitialData(newData);
};

export const handleSaveChanges = async (
  data: any,
  initialData: Record<string, any>,
  user: any,
  setIsSaving: (value: boolean) => void,
  dispatch: any,
) => {
  setIsSaving(true);
  try {
    const oldData = { ...data };
    const newCleanedData = cleanObject(initialData);
    const allSteps = data?.workflow?.steps;
    const updatedSteps = allSteps?.map((step: any) => {
      if (step.type) {
        return {
          ...step,
          config: newCleanedData[step.type],
        };
      }
      return step;
    });
    const updatedData = {
      ...oldData,
      workflow: {
        ...oldData.workflow,
        steps: updatedSteps,
      },
      updated_at: new Date().toISOString(),
      updated_by: user?.email ?? "N/A",
    };

    await FirestoreService.updateDocument(
      FirestoreCollectionReference.pbmConfigurations(),
      "v1",
      updatedData,
    );
    controlToastState("pbm-config-save-success");
    dispatch(fetchPbmConfiguration());
  } catch (error) {
    controlToastState("pbm-config-save-error");
  } finally {
    setIsSaving(false);
  }
};
