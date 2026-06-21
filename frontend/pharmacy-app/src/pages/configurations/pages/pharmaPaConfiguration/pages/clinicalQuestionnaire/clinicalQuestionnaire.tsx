import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState, Select, TextInput } from "risa-oasis-ui_v2";
import { LoaderMessage } from "../../../../../../components/loaderMessage/loaderMessage";
import { MedicationItem } from "../../../../../../data-model/drugConfigModel";
import { DrugConfigOrg } from "../../../../../../enums/drugConfigOrg";
import { OrganizationType } from "../../../../../../enums/organizationTypes";
import { fetchDrugConfigfromFirebase } from "../../../../../../redux/slice/drugConfigSlice";
import { AppDispatch, RootState } from "../../../../../../redux/store/store";
import { AddMore } from "../../../../../../svg/add-more";

import { FirestoreService } from "../../../../../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../../../../../api/firebase/references";
import { determineClinicalQuestionnaire } from "../../../../../../api/postCall/clinicalQuestion";
import EditableDeleteCard from "../../components/editableDeleteCard";
import {
  ClinicalQuestionnaireRulesResponse,
  fetchClininaclQuestionnaireRules,
} from "../drugConfig/utils/drugConfigService";

const ClinicalQuestionnaire = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: drugConfig, loading } = useSelector(
    (state: RootState) => state.drugConfig,
  );

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );
  const [drugOptions, setDrugOptions] = useState<any[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<MedicationItem | null>(null);
  const [clinicalQuestionnaire, setClinicalQuestionnaire] = useState<any[]>([]);
  const [clinicalQuestionnaireResponse, setClinicalQuestionnaireResponse] =
    useState<ClinicalQuestionnaireRulesResponse | null>(null);
  const [clinicalQuestionnaireFields, setClinicalQuestionnaireFields] =
    useState<string[]>(["", "", "", ""]);
  const [showAllFields, setShowAllFields] = useState(true);
  const [duplicateIcdFields, setDuplicateIcdFields] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [
    hasDuplicateClinicalQuestionnaire,
    setHasDuplicateClinicalQuestionnaire,
  ] = useState(false);

  const [organization, setOrganization] = useState<string>(DrugConfigOrg.NYCBS);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [editedClinicalQuestionnaire, setEditedClinicalQuestionnaire] =
    useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(fetchDrugConfigfromFirebase(organization));
  }, [dispatch, organization]);

  useEffect(() => {
    setSelectedDrug(drugConfig?.medications?.[0] || null);
  }, [drugConfig]);

  const handleDrugSelect = (option: { value: string }) => {
    const drug = drugConfig?.medications?.find((d) => d.name === option.value);
    setSelectedDrug(drug || null);
    setDuplicateIcdFields([]);
    setClinicalQuestionnaireFields(["", "", "", ""]);
    setClinicalQuestionnaire([]);
    setHasChanges(false);
    setEditedClinicalQuestionnaire({});
  };

  const handleClinicalQuestionnaireTextChange = (
    originalText: string,
    newText: string,
  ) => {
    setEditedClinicalQuestionnaire((prev) => ({
      ...prev,
      [originalText]: newText,
    }));
    setHasChanges(true);
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
    const fetchClinicalQuestionnaireRules = async () => {
      try {
        const result = await fetchClininaclQuestionnaireRules(
          organization,
          selectedDrug.name,
        );
        if (result.clinical_questionnaire_rules) {
          setClinicalQuestionnaire(result.clinical_questionnaire_rules);
          setClinicalQuestionnaireResponse(result);
        }
      } catch (error) {
        console.error("Error fetching Clinical Questionnaire Rules:", error);
        // Consider adding toast notification for user
      }
    };
    fetchClinicalQuestionnaireRules();
  }, [selectedDrug?.name, organization]);

  const checkClinicalQuestionnaireDuplicate = (
    value: string,
    currentIndex: number,
  ) => {
    if (!clinicalQuestionnaire) return false;

    const isDuplicateInExisting =
      clinicalQuestionnaire?.includes(value) || false;
    const isDuplicateInFields = clinicalQuestionnaireFields.some(
      (field, index) =>
        index !== currentIndex &&
        field.trim() === value.trim() &&
        value.trim() !== "",
    );
    return isDuplicateInExisting || isDuplicateInFields;
  };

  const hasDuplicates = () => {
    return duplicateIcdFields.length > 0 || hasDuplicateClinicalQuestionnaire;
  };

  const handleClinicalQuestionnaireKeyPress = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (e.key === "Enter" && clinicalQuestionnaireFields[index].trim()) {
      e.preventDefault();
      if (
        !checkClinicalQuestionnaireDuplicate(
          clinicalQuestionnaireFields[index],
          index,
        )
      ) {
        setClinicalQuestionnaire((prev) => [
          ...(prev || []),
          clinicalQuestionnaireFields[index],
        ]);
        const newFields = [...clinicalQuestionnaireFields];
        newFields.splice(index, 1);
        setClinicalQuestionnaireFields(newFields);
        setHasChanges(true);
        const hasDuplicates = newFields.some(
          (field, idx) =>
            field.trim() !== "" &&
            newFields.some(
              (otherField, otherIdx) =>
                idx !== otherIdx && field.trim() === otherField.trim(),
            ),
        );
        setHasDuplicateClinicalQuestionnaire(hasDuplicates);
      }
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      if (!selectedDrug?.name) return;

      const newClinicalQuestionnaire = clinicalQuestionnaireFields
        .map((field) => field.trim())
        .filter(
          (field) => field && !(clinicalQuestionnaire || []).includes(field),
        );

      // Apply edited clinical questionnaire
      const editedClinicalQuestionnaireItems = (
        clinicalQuestionnaire || []
      ).map((question) =>
        editedClinicalQuestionnaire[question] !== undefined
          ? editedClinicalQuestionnaire[question]
          : question,
      );

      const updatedClinicalQuestionnaire = [
        ...editedClinicalQuestionnaireItems,
        ...newClinicalQuestionnaire,
      ];

      const timestamp = moment().toDate().toISOString();
      const clinicalQuestionnaireChanged =
        JSON.stringify(updatedClinicalQuestionnaire) !==
        JSON.stringify(
          clinicalQuestionnaireResponse?.clinical_questionnaire_rules || [],
        );

      const data = {
        clinical_questionnaire_rules: updatedClinicalQuestionnaire,
        updated_by: user?.email || "",
        clinical_questionnaire_rules_updated_at: clinicalQuestionnaireChanged
          ? timestamp
          : clinicalQuestionnaireResponse?.clinical_questionnaire_rules_updated_at ||
            "",
      };

      if (Object.keys(data).length > 0) {
        await FirestoreService.updateDocument(
          FirestoreDocumentReference.ClinicalQuestionnaireRulesUpdate(
            organization,
            selectedDrug.name,
          ),
          "v1",
          data,
        );

        dispatch(fetchDrugConfigfromFirebase(organization));

        // Clear edited clinical questionnaire after successful save
        setEditedClinicalQuestionnaire({});
        setHasChanges(false);
      }
    } catch (error) {
      controlToastState("drug-config-update-failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetermineClinicalQuestionnaire = async () => {
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

      const response = await determineClinicalQuestionnaire(payload);
      setApiResponse(response);
      controlToastState("clinical-questionnaire-determination-success");
    } catch (error) {
      console.error("Error determining Clinical Questionnaire:", error);
      controlToastState("clinical-questionnaire-determination-failure");
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
            <div className="send-to-plan--input-container flex w-full justify-center gap-2">
              <Select
                id="drug-name"
                options={drugOptions}
                label="Drug Name"
                placeholder="Select Drug Name"
                onOptionChange={handleDrugSelect}
                defaultValue={selectedDrug?.name || ""}
              />
            </div>
          </div>
          <div className="send-to-plan body flex flex-1 gap-4 overflow-y-auto">
            <div className="send-to-plan__right flex flex-1 flex-col gap-4 overflow-hidden border-primaryGray-16">
              <div className="send-to-plan__right-header flex items-center justify-between border-b border-primaryGray-16 px-2 pb-2">
                <div className="text-h12 font-semibold">
                  Clinical Questionnaire
                </div>
                <div
                  className="add-button flex items-center justify-center gap-1 text-tiny font-semibold text-tertiaryBlue-4 hover:cursor-pointer hover:text-tertiaryBlue-5"
                  onClick={() => {
                    setClinicalQuestionnaireFields([
                      ...clinicalQuestionnaireFields,
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
              <div className="send-to-plan__right-body flex flex-1 flex-col gap-2 overflow-auto px-2">
                {clinicalQuestionnaire?.map((question, index) => (
                  <EditableDeleteCard
                    key={`clinical-questionnaire-${index}-${question}`}
                    text={
                      editedClinicalQuestionnaire[question] !== undefined
                        ? editedClinicalQuestionnaire[question]
                        : question || "N/A"
                    }
                    onDelete={() => {
                      setClinicalQuestionnaire(
                        (prev) => prev?.filter((i) => i !== question) || [],
                      );
                      setHasChanges(true);
                    }}
                    onTextChange={(newText) =>
                      handleClinicalQuestionnaireTextChange(question, newText)
                    }
                    exitDirection="right"
                  />
                ))}
                {selectedDrug && (
                  <div className="flex flex-col gap-2">
                    {clinicalQuestionnaireFields.map((field, index) => (
                      <div
                        key={`clinical-questionnaire-${index}`}
                        className={`flex w-full gap-2 ${!showAllFields && index >= 4 ? "hidden" : ""}`}
                        onKeyDown={(e) =>
                          handleClinicalQuestionnaireKeyPress(e, index)
                        }
                      >
                        <div className="w-full">
                          <TextInput
                            id={`clinical-questionnaire-${index}`}
                            label={`Clinical Questionnaire ${index + 1}`}
                            placeholder="Enter Clinical Questionnaire"
                            error={
                              checkClinicalQuestionnaireDuplicate(field, index)
                                ? "Duplicate entry not allowed"
                                : ""
                            }
                            defaultValue={field}
                            onChange={(e) => {
                              const newFields = [
                                ...clinicalQuestionnaireFields,
                              ];
                              newFields[index] = e.value;
                              setClinicalQuestionnaireFields(newFields);
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
                              setHasDuplicateClinicalQuestionnaire(
                                hasDuplicates,
                              );
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="send-to-plan__left flex flex-1 flex-col gap-4 overflow-hidden border-primaryGray-16">
              <div className="send-to-plan__left-bottom border-prim flex flex-col gap-2 overflow-auto border-t border-primaryGray-16 pt-2">
                <div className="send-to-plan__left-bottom-header flex items-center justify-between px-2">
                  <div className="text-h12 font-semibold">
                    Clinical Questionnaire Determination
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
                          ? "Determining Clinical Questionnaire..."
                          : "Determine Clinical Questionnaire"
                      }
                      onClick={handleDetermineClinicalQuestionnaire}
                    />
                  </div>
                </div>
                {apiResponse && (
                  <div className="send-to-plan__response p-1">
                    <div className="mb-1 text-tiny font-semibold">
                      Clinical Questionnaire:
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
              {clinicalQuestionnaireResponse?.clinical_questionnaire_rules_updated_at &&
                clinicalQuestionnaireResponse.clinical_questionnaire_rules_updated_at.trim() !==
                  "" &&
                moment(
                  clinicalQuestionnaireResponse.clinical_questionnaire_rules_updated_at,
                ).isValid() && (
                  <div className="mt-1">
                    Last Clinical Questionnaire Update:{" "}
                    <span className="font-semibold">
                      {moment(
                        clinicalQuestionnaireResponse.clinical_questionnaire_rules_updated_at,
                      ).format("DD MMM YYYY HH:mm")}
                    </span>{" "}
                    by{" "}
                    <span className="font-semibold">
                      {clinicalQuestionnaireResponse?.updated_by || "N/A"}
                    </span>
                  </div>
                )}
            </div>
            <Button
              disabled={
                (!hasChanges &&
                  Object.keys(editedClinicalQuestionnaire).length === 0) ||
                hasDuplicates() ||
                isLoading ||
                hasDuplicateClinicalQuestionnaire
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

export default ClinicalQuestionnaire;
