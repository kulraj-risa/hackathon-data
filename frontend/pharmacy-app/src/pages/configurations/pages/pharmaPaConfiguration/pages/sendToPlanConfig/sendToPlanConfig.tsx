import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, controlToastState, TextInput } from "risa-oasis-ui_v2";
import { FirestoreService } from "../../../../../../api/firebase/firestoreService";
import { FirestoreCollectionReference } from "../../../../../../api/firebase/references";
import { LoaderMessage } from "../../../../../../components/loaderMessage/loaderMessage";
import { LocalStorageKeys } from "../../../../../../enums/localStorageKeys";
import { getSendToPlanConfig } from "../../../../../../redux/slice/configurations/nycbsSentToPlanSlice";
import { AppDispatch, RootState } from "../../../../../../redux/store/store";
import { logDataToConsole } from "../../../../../../utils/customLogger";
import { getItemFromLocalStorage } from "../../../../../../utils/localStorageHelper";
import CardWithDeleteIcon from "../../components/cardWithDeleteIcon";

const SendToPlanConfig = () => {
  const [medicationNames, setMedicationNames] = useState<string[]>([]);
  const [insuranceProviders, setInsuranceProviders] = useState<string[]>([]);
  const [insuranceCardEffectiveYears, setInsuranceCardEffectiveYears] =
    useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading, error } = useSelector(
    (state: RootState) => state.nycbsSentToPlanConfig,
  );
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const organization = getItemFromLocalStorage(
    LocalStorageKeys.HEALTHCARE_FACILITY_ID,
  );

  const [textInput, setTextInput] = useState<{
    medicationName: string;
    insuranceProvider: string;
    insuranceCardEffectiveYear: string;
  }>({
    medicationName: "",
    insuranceProvider: "",
    insuranceCardEffectiveYear: "",
  });

  useEffect(() => {
    dispatch(getSendToPlanConfig(organization) as any);
  }, []);

  useEffect(() => {
    if (data && !isLoading) {
      setMedicationNames(data.medication_names || []);
      setInsuranceProviders(data.insurance_providers || []);
      setInsuranceCardEffectiveYears(data.insurance_card_effective_year || []);
    } else {
      setMedicationNames([]);
      setInsuranceProviders([]);
      setInsuranceCardEffectiveYears([]);
    }
  }, [data, isLoading]);

  const handleAddNew = () => {
    if (textInput.medicationName.trim().length > 0) {
      setMedicationNames([...medicationNames, textInput.medicationName]);
    }
    if (textInput.insuranceProvider.trim().length > 0) {
      setInsuranceProviders([
        ...insuranceProviders,
        textInput.insuranceProvider,
      ]);
    }

    if (textInput.insuranceCardEffectiveYear.trim().length > 0) {
      setInsuranceCardEffectiveYears([
        ...insuranceCardEffectiveYears,
        textInput.insuranceCardEffectiveYear,
      ]);
    }
    setTextInput({
      medicationName: "",
      insuranceProvider: "",
      // planName: "",
      insuranceCardEffectiveYear: "",
    });
  };

  const checkIfButtonShouldBeDisabled = () => {
    return (
      textInput.medicationName.trim().length === 0 &&
      textInput.insuranceProvider.trim().length === 0 &&
      //textInput.planName.trim().length === 0 &&
      textInput.insuranceCardEffectiveYear.trim().length === 0
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const body = {
      insurance_providers: insuranceProviders,
      medication_names: medicationNames,
      // plan_name: planNames,
      insurance_card_effective_year: insuranceCardEffectiveYears,
      updated_by: user?.email || "N/A",
      updated_at: moment().toDate().toISOString(),
    };

    try {
      await FirestoreService.updateDocument(
        FirestoreCollectionReference.sendToPlanConfigAdd(organization),
        "v1",
        {
          insurance_providers: insuranceProviders,
          medication_names: medicationNames,
          //plan_name: planNames,
          insurance_card_effective_year: insuranceCardEffectiveYears,
          updated_by: user?.email || "N/A",
          updated_at: moment().toDate().toISOString(),
        },
      );
      controlToastState("sent-to-plan-configuration-update-success");
      dispatch(getSendToPlanConfig(organization) as any);
    } catch (error) {
      logDataToConsole(error as string);
      controlToastState("sent-to-plan-configuration-update-failure");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="send-to-plan-config__layout flex h-full flex-col gap-2 overflow-hidden p-2">
      {isLoading ? (
        <>
          <div className="send-to-plan-config__loading h-full">
            <LoaderMessage message="Loading Sent to Plan configuration..." />
          </div>
        </>
      ) : (
        <>
          <div className="send-to-plan-config__header mb-2 flex items-end justify-between gap-2 border-b border-primaryGray-16 pb-2 shadow-sm">
            <div className="send-to-plan--input-container flex flex-1 gap-2">
              <TextInput
                id={"medication-name"}
                label={"Medication Name"}
                placeholder="Enter Medication Name for Sent To Plan"
                defaultValue={textInput.medicationName}
                onChange={(e) =>
                  setTextInput({
                    ...textInput,
                    medicationName: e.value,
                  })
                }
              />
              <TextInput
                id={"insurance-provider"}
                label={"Insurance Provider"}
                placeholder="Enter Insurance Provider Name for Sent To Plan"
                defaultValue={textInput.insuranceProvider}
                onChange={(e) =>
                  setTextInput({
                    ...textInput,
                    insuranceProvider: e.value,
                  })
                }
              />

              <TextInput
                id={"care-effictive-year"}
                label={"Insurance Card Effective Year"}
                placeholder="Enter Insurance Card Effective Year for Sent To Plan"
                defaultValue={textInput.insuranceCardEffectiveYear}
                onChange={(e) =>
                  setTextInput({
                    ...textInput,
                    insuranceCardEffectiveYear: e.value,
                  })
                }
              />
            </div>
            <Button
              disabled={checkIfButtonShouldBeDisabled()}
              children={"Add New"}
              onClick={handleAddNew}
              buttonType={"primary"}
              size={"medium"}
            />
          </div>
          <div className="send-to-plan body flex flex-1 gap-3 overflow-hidden">
            <div className="send-to-plan__left flex h-full flex-1 flex-col gap-2 overflow-hidden">
              <div className="send-to-plan__left-header border-b border-primaryGray-16 pb-2 text-h12 font-semibold">
                Medication Name
              </div>
              <div className="send-to-plan__left-body flex flex-1 flex-col gap-2 overflow-auto">
                {medicationNames.map((medication, index) => (
                  <CardWithDeleteIcon
                    key={`medication-${index}-${medication}`}
                    text={medication}
                    onDelete={() => {
                      setMedicationNames(
                        medicationNames.filter((_, i) => i !== index),
                      );
                    }}
                    exitDirection="left"
                  />
                ))}
              </div>
            </div>
            <div className="send-to-plan__right flex h-full flex-1 flex-col gap-2 overflow-hidden">
              <div className="send-to-plan__right-header border-b border-primaryGray-16 pb-2 text-h12 font-semibold">
                Insurance Providers
              </div>
              <div className="send-to-plan__right-body flex flex-1 flex-col gap-2 overflow-auto">
                {insuranceProviders.map((insurance, index) => (
                  <CardWithDeleteIcon
                    key={`insurance-${index}-${insurance}`}
                    text={insurance}
                    onDelete={() => {
                      setInsuranceProviders(
                        insuranceProviders.filter((_, i) => i !== index),
                      );
                    }}
                    exitDirection="left"
                  />
                ))}
              </div>
            </div>

            <div className="send-to-plan__left flex h-full flex-1 flex-col gap-2 overflow-hidden">
              <div className="send-to-plan__left-header border-b border-primaryGray-16 pb-2 text-h12 font-semibold">
                Insurance Card Effective Year
              </div>
              <div className="send-to-plan__left-body flex flex-1 flex-col gap-2 overflow-auto">
                {insuranceCardEffectiveYears.map(
                  (insuranceCardEffectiveYear, index) => (
                    <CardWithDeleteIcon
                      key={`insurance-card-effective-year-${index}-${insuranceCardEffectiveYear}`}
                      text={insuranceCardEffectiveYear}
                      onDelete={() => {
                        setInsuranceCardEffectiveYears(
                          insuranceCardEffectiveYears.filter(
                            (_, i) => i !== index,
                          ),
                        );
                      }}
                      exitDirection="right"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="send-to-plan__footer flex items-center justify-between gap-2 border-t border-primaryGray-16 pt-2">
            <div className="end-to-plan__footer last-update-details text-tiny">
              Updated at :{" "}
              <span className="font-semibold">
                {data?.updated_at
                  ? moment(data.updated_at).format("DD MMM YYYY HH:mm")
                  : "N/A"}
              </span>{" "}
              by{" "}
              <span className="font-semibold">{data?.updated_by || "N/A"}</span>
            </div>
            <Button
              disabled={isSaving}
              children={isSaving ? "Saving..." : "Save Changes"}
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

export default SendToPlanConfig;
