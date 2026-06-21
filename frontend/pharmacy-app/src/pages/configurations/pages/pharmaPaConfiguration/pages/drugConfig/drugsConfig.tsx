import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState, Select, TextInput } from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../../../../api/firebase/firestoreService";
import {
  FirestoreCollectionReference,
  FirestoreDocumentReference,
} from "../../../../../../api/firebase/references";
import { determineIcdCode } from "../../../../../../api/postCall/icdCodePostCall";
import { LoaderMessage } from "../../../../../../components/loaderMessage/loaderMessage";
import {
  IcdInstructionsResponse,
  MedicationItem,
} from "../../../../../../data-model/drugConfigModel";
import { DrugConfigOrg } from "../../../../../../enums/drugConfigOrg";
import { OrganizationType } from "../../../../../../enums/organizationTypes";
import { fetchDrugConfigfromFirebase } from "../../../../../../redux/slice/drugConfigSlice";
import { AppDispatch, RootState } from "../../../../../../redux/store/store";
import { AddMore } from "../../../../../../svg/add-more";
import CardWithDeleteIcon from "../../components/cardWithDeleteIcon";
import EditableDeleteCard from "../../components/editableDeleteCard";
import { fetchIcdInstructionsrespnse } from "../drugConfig/utils/drugConfigService";

const DrugsConfiguration = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: drugConfig, loading } = useSelector(
    (state: RootState) => state.drugConfig,
  );

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<MedicationItem | null>(null);
  const [currentDrugData, setCurrentDrugData] = useState<MedicationItem | null>(
    null,
  );
  const [icdInstructions, setIcdInstructions] = useState<any[]>([]);
  const [icdInstructionsResponse, setIcdInstructionsResponse] =
    useState<IcdInstructionsResponse | null>(null);
  const [isAddRelatedDrug, setIsAddRelatedDrug] = useState(false);
  const [relatedDrugText, setRelatedDrugText] = useState("");
  const [icdInstructionFields, setIcdInstructionFields] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [showAllFields, setShowAllFields] = useState(true);
  const [isRelatedDrugDuplicate, setIsRelatedDrugDuplicate] = useState(false);
  const [duplicateIcdFields, setDuplicateIcdFields] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newDrugName, setNewDrugName] = useState("");
  const [duplicateDrug, setDuplicateDrug] = useState(false);
  const [hasDuplicateIcdInstructions, setHasDuplicateIcdInstructions] =
    useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [organization, setOrganization] = useState<string>(DrugConfigOrg.NYCBS);
  const [editedIcdInstructions, setEditedIcdInstructions] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    dispatch(fetchDrugConfigfromFirebase(organization));
  }, [dispatch, organization]);

  useEffect(() => {
    setSelectedDrug(drugConfig?.medications?.[0] || null);
  }, [drugConfig]);

  useEffect(() => {
    if (selectedDrug) {
      setCurrentDrugData(selectedDrug);
      setEditedIcdInstructions({});
    }
  }, [selectedDrug]);

  const handleDrugSelect = (option: { value: string }) => {
    const drug = drugConfig?.medications?.find((d) => d.name === option.value);
    setSelectedDrug(drug || null);
    setCurrentDrugData(drug || null);
    setIsRelatedDrugDuplicate(false);
    setDuplicateIcdFields([]);
    setIcdInstructionFields(["", "", "", ""]);
    setHasChanges(false);
    setEditedIcdInstructions({});
  };

  const handleIcdInstructionTextChange = (
    originalText: string,
    newText: string,
  ) => {
    setEditedIcdInstructions((prev) => ({
      ...prev,
      [originalText]: newText,
    }));
    setHasChanges(true);
  };

  const checkRelatedDrugDuplicate = (value: string) => {
    if (!currentDrugData) return false;
    const isDuplicate = currentDrugData.related_drugs?.includes(value);
    if (isDuplicate) {
      setIsRelatedDrugDuplicate(true);
      return true;
    }
    setIsRelatedDrugDuplicate(false);
    return false;
  };

  useEffect(() => {
    if (drugConfig?.medications) {
      setDrugOptions(
        drugConfig.medications.map((drug: MedicationItem) => ({
          label: drug.display_name,
          value: drug.name,
        })),
      );
    }
  }, [drugConfig]);

  useEffect(() => {
    if (!selectedDrug?.name) return;
    const fetchIcdInstructions = async () => {
      try {
        const result = await fetchIcdInstructionsrespnse(
          organization,
          selectedDrug.name,
        );
        if (result.icd_instructions) {
          setIcdInstructions(result.icd_instructions);
          setIcdInstructionsResponse(result);

          if (result.related_drugs.length > 0 || selectedDrug) {
            setCurrentDrugData((prev) =>
              prev
                ? {
                    ...prev,
                    related_drugs: result.related_drugs,
                  }
                : selectedDrug,
            );
          }
        }
      } catch (error) {}
    };
    fetchIcdInstructions();
  }, [selectedDrug?.name, organization]);

  const checkIcdInstructionDuplicate = (
    value: string,
    currentIndex: number,
  ) => {
    if (!currentDrugData) return false;

    const isDuplicateInExisting = icdInstructions?.includes(value) || false;
    const isDuplicateInFields = icdInstructionFields.some(
      (field, index) =>
        index !== currentIndex &&
        field.trim() === value.trim() &&
        value.trim() !== "",
    );
    return isDuplicateInExisting || isDuplicateInFields;
  };

  const hasDuplicates = () => {
    return isRelatedDrugDuplicate || duplicateIcdFields.length > 0;
  };

  const handleRelatedDrugKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && relatedDrugText.trim()) {
      e.preventDefault();
      if (!checkRelatedDrugDuplicate(relatedDrugText)) {
        setCurrentDrugData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            related_drugs: [...(prev.related_drugs || []), relatedDrugText],
          };
        });
        setRelatedDrugText("");
        setIsRelatedDrugDuplicate(false);
        setHasChanges(true);
        setIsAddRelatedDrug(false);
      }
    }
  };

  const handleIcdInstructionKeyPress = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (e.key === "Enter" && icdInstructionFields[index].trim()) {
      e.preventDefault();
      if (!checkIcdInstructionDuplicate(icdInstructionFields[index], index)) {
        setIcdInstructions((prev) => [
          ...(prev || []),
          icdInstructionFields[index],
        ]);
        const newFields = [...icdInstructionFields];
        newFields.splice(index, 1);
        setIcdInstructionFields(newFields);
        setHasChanges(true);
        const hasDuplicates = newFields.some(
          (field, idx) =>
            field.trim() !== "" &&
            newFields.some(
              (otherField, otherIdx) =>
                idx !== otherIdx && field.trim() === otherField.trim(),
            ),
        );
        setHasDuplicateIcdInstructions(hasDuplicates);
      }
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      if (!selectedDrug?.name) return;

      let updatedRelatedDrugs = [...(currentDrugData?.related_drugs || [])];
      if (
        relatedDrugText.trim() &&
        !checkRelatedDrugDuplicate(relatedDrugText)
      ) {
        updatedRelatedDrugs.push(relatedDrugText.trim());
      }

      const newInstructions = icdInstructionFields
        .map((field) => field.trim())
        .filter((field) => field && !(icdInstructions || []).includes(field));

      // Apply edited instructions
      const editedInstructions = (icdInstructions || []).map((instruction) =>
        editedIcdInstructions[instruction] !== undefined
          ? editedIcdInstructions[instruction]
          : instruction,
      );

      const updatedInstructions = [...editedInstructions, ...newInstructions];

      const timestamp = moment().toDate().toISOString();
      const icdInstructionsChanged =
        JSON.stringify(updatedInstructions) !==
        JSON.stringify(icdInstructionsResponse?.icd_instructions || []);

      const relatedDrugsChanged =
        JSON.stringify(updatedRelatedDrugs) !==
        JSON.stringify(icdInstructionsResponse?.related_drugs || []);

      const data = {
        icd_instructions: updatedInstructions,
        related_drugs: updatedRelatedDrugs,
        updated_by: user?.email || "",
        icd_instructions_updated_at: icdInstructionsChanged
          ? timestamp
          : icdInstructionsResponse?.icd_instructions_updated_at || "",
      };

      if (Object.keys(data).length > 0 || relatedDrugsChanged) {
        await FirestoreService.updateDocument(
          FirestoreDocumentReference.updateDrugConfig(
            organization,
            selectedDrug.name,
          ),
          "v1",
          data,
        );

        if (relatedDrugsChanged) {
          const updatedMedications = (drugConfig?.medications || []).map(
            (med) => {
              if (med.name === selectedDrug.name) {
                return {
                  ...med,
                  related_drugs: updatedRelatedDrugs,
                };
              }
              return med;
            },
          );

          await FirestoreService.updateDocument(
            FirestoreCollectionReference.addNewDrug(organization),
            "medication_list",
            {
              medications: updatedMedications,
              total_count: updatedMedications.length,
              last_sync: moment().toDate().toISOString(),
            },
          );
        }

        dispatch(fetchDrugConfigfromFirebase(organization));

        // Clear edited instructions after successful save
        setEditedIcdInstructions({});
        setHasChanges(false);

        if (icdInstructionsChanged) {
          controlToastState("icd-instructions-updated-successfully");
        } else if (relatedDrugsChanged) {
          controlToastState("related-drugs-added-successfully");
        } else {
          controlToastState("drug-config-updated-successfully");
        }
      }
    } catch (error) {
      controlToastState("drug-config-update-failure");
    } finally {
      setIsLoading(false);
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const handleAddNewDrug = async () => {
    if (!newDrugName.trim()) return;
    try {
      setIsLoading(true);
      if (
        drugConfig?.medications?.some(
          (d) => d.name === newDrugName.trim().toLowerCase(),
        )
      ) {
        setDuplicateDrug(true);
        controlToastState("drug-name-already-exists");
        return;
      }

      const newDrug = {
        name: newDrugName.trim().toLowerCase(),
        display_name: capitalizeFirstLetter(newDrugName.trim()),
        environment: "prod",
        instructions_count: 0,
        last_updated: moment().toDate().toISOString(),
        source: "manual",
        related_drugs: [],
        icd_instructions: [],
      };

      const updatedMedications = [
        ...(drugConfig?.medications || []),
        newDrug,
      ].sort((a, b) => a.display_name.localeCompare(b.display_name));

      await FirestoreService.updateDocument(
        FirestoreCollectionReference.addNewDrug(organization),
        "medication_list",
        {
          medications: updatedMedications,
          total_count: updatedMedications.length,
          last_sync: moment().toDate().toISOString(),
        },
      );

      const icdInstructionsData = {
        environment: "",
        related_drugs: [],
        icd_instructions: [],
        icd_instructions_updated_at: "",
        id: "v1",
        source: "",
        updated_by: user?.email || "",
      };

      await FirestoreService.addDocumentWithId(
        FirestoreCollectionReference.getIcdInstructions(
          organization,
          newDrug.name,
        ),
        {
          ...icdInstructionsData,
          id: "v1",
        },
      );

      controlToastState("drug-name-added-successfully");
      dispatch(fetchDrugConfigfromFirebase(organization));
      setNewDrugName("");
      setDuplicateDrug(false);
    } catch (error) {
      controlToastState("drug-name-add-failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetermineIcdCode = async () => {
    if (!selectedDrug?.name || !identifier.trim()) {
      controlToastState("please-fill-all-fields");
      return;
    }

    try {
      setIsApiLoading(true);
      const payload = {
        medicine_name: selectedDrug?.name.trim(),
        identifier: identifier.trim(),
        org_id: organization,
      };

      const response = await determineIcdCode(payload);
      setApiResponse(response);
      controlToastState("icd-code-determination-success");
    } catch (error) {
      controlToastState("icd-code-determination-failure");
      setApiResponse(null);
    } finally {
      setIsApiLoading(false);
    }
  };

  return (
    <div className="send-to-plan-config__layout flex h-full flex-col gap-2 overflow-hidden px-4">
      {loading ? (
        <div className="send-to-plan-config__loading h-full">
          <LoaderMessage message="Loading Drugs configuration..." />
        </div>
      ) : (
        <>
          <Select
            id="organization"
            options={[
              { label: "NYCBS", value: OrganizationType.NYCBS_DRUG_CONFIG },
              { label: "Astera", value: OrganizationType.ASTERA },
            ]}
            label="Organization"
            placeholder="Select Organization"
            onOptionChange={(option) => {
              setOrganization(option.value);
            }}
            defaultValue={organization}
          />
          <div className="send-to-plan-config__header flex w-full justify-between gap-2 border-b border-primaryGray-16 pb-2 shadow-sm">
            <div className="send-to-plan--input-container flex w-1/2 justify-center gap-2">
              <Select
                id="drug-name"
                options={drugOptions}
                label="Drug Name"
                placeholder="Select Drug Name"
                onOptionChange={handleDrugSelect}
                defaultValue={selectedDrug?.name || ""}
              />
            </div>
            <div className="send-to-plan--input-container mb-2 flex w-1/2 justify-center gap-2">
              <TextInput
                id="drug-name"
                label="Add New Drug"
                placeholder="Enter New Drug Name"
                onChange={(e) => {
                  setNewDrugName(e.value);
                }}
                error={duplicateDrug ? "Drug name already exists" : ""}
                defaultValue={""}
              />
              <div className="mt-6 flex items-center">
                <Button
                  disabled={isLoading}
                  buttonType={"primary"}
                  size={"medium"}
                  children={isLoading ? "Adding..." : "Add"}
                  onClick={handleAddNewDrug}
                />
              </div>
            </div>
          </div>
          <div className="send-to-plan body flex flex-1 gap-4 overflow-y-auto">
            <div className="send-to-plan__left flex flex-1 flex-col gap-4 overflow-hidden">
              <div className="send-to-plan__left-top flex flex-1 flex-col gap-2 overflow-hidden">
                <div className="send-to-plan__left-header flex items-center justify-between border-b border-primaryGray-16 px-2 pb-2">
                  <div className="text-h12 font-semibold">Related Drugs</div>
                  <div
                    className="add-button flex items-center gap-1 text-tiny font-semibold text-tertiaryBlue-4 hover:cursor-pointer hover:text-tertiaryBlue-5"
                    onClick={() => {
                      setIsAddRelatedDrug(!isAddRelatedDrug);
                    }}
                  >
                    <AddMore />
                    Add Field
                  </div>
                </div>
                {isAddRelatedDrug && (
                  <div onKeyDown={handleRelatedDrugKeyPress} className="px-2">
                    <TextInput
                      id="related-drug"
                      label="Related Drug"
                      placeholder="Enter Related Drug"
                      onChange={(e) => {
                        setRelatedDrugText(e.value);
                        checkRelatedDrugDuplicate(e.value);
                        setHasChanges(true);
                      }}
                      error={
                        isRelatedDrugDuplicate
                          ? "Duplicate entry not allowed"
                          : ""
                      }
                    />
                  </div>
                )}
                <div className="send-to-plan__left-body flex flex-1 flex-col gap-2 overflow-auto px-2">
                  {currentDrugData?.related_drugs?.map((drug, index) => (
                    <CardWithDeleteIcon
                      key={`related-drug-${index}-${drug}`}
                      text={drug || "N/A"}
                      onDelete={() => {
                        setCurrentDrugData((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            related_drugs: prev.related_drugs?.filter(
                              (d) => d !== drug,
                            ),
                          };
                        });
                        setHasChanges(true);
                      }}
                      exitDirection="left"
                    />
                  ))}
                  {!currentDrugData?.related_drugs?.length && (
                    <div className="p-2 text-gray-500">
                      No related drugs found.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="send-to-plan__middle flex flex-1 flex-col gap-4 overflow-hidden border-primaryGray-16">
              <div className="send-to-plan__middle-header flex items-center justify-between border-b border-primaryGray-16 px-2 pb-2">
                <div className="text-h12 font-semibold">ICD Instructions</div>
                <div
                  className="add-button flex items-center justify-center gap-1 text-tiny font-semibold text-tertiaryBlue-4 hover:cursor-pointer hover:text-tertiaryBlue-5"
                  onClick={() => {
                    setIcdInstructionFields([
                      ...icdInstructionFields,
                      "",
                      "",
                      "",
                      "",
                    ]);
                    setShowAllFields(true);
                  }}
                >
                  <AddMore />
                  Add More Fields
                </div>
              </div>
              <div className="send-to-plan__middle-body flex flex-1 flex-col gap-2 overflow-auto px-2">
                {icdInstructions?.map((instruction, index) => (
                  <EditableDeleteCard
                    key={`icd-instruction-${index}-${instruction}`}
                    text={
                      editedIcdInstructions[instruction] !== undefined
                        ? editedIcdInstructions[instruction]
                        : instruction || "N/A"
                    }
                    onDelete={() => {
                      setIcdInstructions(
                        (prev) => prev?.filter((i) => i !== instruction) || [],
                      );
                      setHasChanges(true);
                    }}
                    onTextChange={(newText) =>
                      handleIcdInstructionTextChange(instruction, newText)
                    }
                    exitDirection="right"
                  />
                ))}
                {selectedDrug && (
                  <div className="flex flex-col gap-2">
                    {icdInstructionFields.map((field, index) => (
                      <div
                        key={`icd-description-${index}`}
                        className={`flex w-full gap-2 ${!showAllFields && index >= 4 ? "hidden" : ""}`}
                        onKeyDown={(e) =>
                          handleIcdInstructionKeyPress(e, index)
                        }
                      >
                        <div className="w-full">
                          <TextInput
                            id={`icd-description-${index}`}
                            label={`ICD Instruction ${index + 1}`}
                            placeholder="Enter ICD Instructions"
                            defaultValue={field}
                            onChange={(e) => {
                              const newFields = [...icdInstructionFields];
                              newFields[index] = e.value;
                              setIcdInstructionFields(newFields);
                              setHasChanges(true);
                              const hasDuplicates = newFields.some(
                                (field, idx) =>
                                  field.trim() !== "" &&
                                  newFields.some(
                                    (otherField, otherIdx) =>
                                      idx !== otherIdx &&
                                      field.trim() === otherField.trim(),
                                  ),
                              );
                              setHasDuplicateIcdInstructions(hasDuplicates);
                            }}
                            error={
                              checkIcdInstructionDuplicate(field, index)
                                ? "Duplicate entry not allowed"
                                : ""
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="send-to-plan__right flex flex-1 flex-col gap-4 overflow-hidden border-primaryGray-16">
              <div className="send-to-plan__left-bottom border-prim flex flex-col gap-2 overflow-auto border-t border-primaryGray-16 pt-2">
                <div className="send-to-plan__left-bottom-header flex items-center justify-between px-2">
                  <div className="text-h12 font-semibold">
                    ICD Code Determination
                  </div>
                </div>
                <div className="send-to-plan__left-bottom-body flex flex-col gap-2 px-1">
                  <TextInput
                    id="medicine-name"
                    label="Medicine Name"
                    placeholder="Enter Medicine Name"
                    defaultValue={selectedDrug?.name || ""}
                    onChange={(e) => setSelectedDrug(e.value)}
                  />
                  <TextInput
                    id="identifier"
                    label="Identifier"
                    placeholder="Enter Identifier"
                    defaultValue={identifier}
                    onChange={(e) => setIdentifier(e.value)}
                  />
                  <div className="send-to-plan__footer-right mt-2 flex w-full justify-end">
                    <Button
                      disabled={!identifier.trim() || isApiLoading}
                      buttonType={"primary"}
                      size={"small"}
                      children={
                        isApiLoading
                          ? "Determining ICD Code..."
                          : "Determine ICD Code"
                      }
                      onClick={handleDetermineIcdCode}
                    />
                  </div>
                </div>
                {apiResponse && (
                  <div className="send-to-plan__response p-1">
                    <div className="mb-1 text-tiny font-semibold">
                      Diagnosis:
                    </div>
                    <pre className="w-full overflow-y-auto rounded border bg-gray-100 p-1 text-sm">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="send-to-plan__footer flex items-center justify-between gap-4 border-t border-primaryGray-16 pt-2">
            <div className="end-to-plan__footer last-update-details flex flex-row gap-4 text-tiny">
              {icdInstructionsResponse?.icd_instructions_updated_at && (
                <div className="mt-1">
                  Last ICD Instructions Update:{" "}
                  <span className="font-semibold">
                    {moment(
                      icdInstructionsResponse.icd_instructions_updated_at,
                    ).format("DD MMM YYYY HH:mm")}
                  </span>{" "}
                  by{" "}
                  <span className="font-semibold">
                    {icdInstructionsResponse.updated_by || "N/A"}
                  </span>
                </div>
              )}
            </div>
            <Button
              disabled={
                (!hasChanges &&
                  Object.keys(editedIcdInstructions).length === 0) ||
                hasDuplicates() ||
                isLoading ||
                hasDuplicateIcdInstructions ||
                (relatedDrugText.trim() !== "" && isRelatedDrugDuplicate)
              }
              children={isLoading ? "Saving Changes..." : "Save Changes"}
              onClick={handleSaveChanges}
              buttonType={"primary"}
              size={"medium"}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DrugsConfiguration;
