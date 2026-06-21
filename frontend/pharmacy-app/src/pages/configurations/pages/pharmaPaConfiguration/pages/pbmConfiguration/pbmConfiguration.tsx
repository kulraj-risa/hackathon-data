import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "risa-oasis-ui_v2";
import RenderSectionHeader from "../../../../../../components/formFields/renderSectionHeader";
import { LoaderMessage } from "../../../../../../components/loaderMessage/loaderMessage";
import ParsedInsuranceCard from "../../../../../../components/modals/parsedInsuranceCard/parsedInsuranceCard";
import PbmConfigModal from "../../../../../../components/modals/pbmConfigModal/pbmConfigModal";
import {
  SchemaField,
  StepType,
  Workflow,
} from "../../../../../../data-model/pbmConfig";
import { fetchParsedInsurance } from "../../../../../../redux/slice/parsedInsuranceSlice";
import { fetchPbmConfiguration } from "../../../../../../redux/slice/pbmConfigurationSlice";
import { AppDispatch, RootState } from "../../../../../../redux/store/store";
import { getNestedValue } from "../../../../../../utils/getNestedValue";
import { renderSchemaField } from "../../components/schemaRenderer";
import { handleSaveChanges } from "./utils/handlers";

const PbmConfiguration = () => {
  const { data, isLoading, error } = useSelector(
    (state: RootState) => state.pbmConfigurations,
  );
  const [schemaCopies, setSchemaCopies] = useState<{ [key: string]: number }>(
    {},
  );
  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const [initialData, setInitialData] = useState<Record<string, any>>({});
  const [resetField, setResetField] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPbmModalOpen, setIsPbmModalOpen] = useState(false);
  const [isParsedInsuranceCardOpen, setIsParsedInsuranceCardOpen] =
    useState(false);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchPbmConfiguration());
    dispatch(fetchParsedInsurance());
  }, []);

  useEffect(() => {
    if (data?.workflow && !isLoading) {
      const initialData: Record<string, any> = {};
      const workflow = data.workflow as Workflow;
      const steps = workflow?.steps;
      steps?.forEach((step) => {
        if (step.type) {
          initialData[step.type] = step.config;
        }
      });

      setInitialData(initialData);
      const newSchemaCopies: { [key: string]: number } = {};
      const processSchema = (schema: any, parentPath?: string) => {
        if (schema.items) {
          const path = parentPath || "";
          const length = getNestedValue(initialData, path)?.length || 0;
          newSchemaCopies[path] = length;

          Object.entries(schema.items).forEach(([key, value]) => {
            processSchema(value, `${path}.${key}`);
          });
        }
      };

      if (data.schema?.step_types) {
        Object.entries(data.schema.step_types).forEach(([key, stepType]) => {
          const typedStepType = stepType as StepType;
          if (typedStepType.config_schema) {
            Object.entries(typedStepType.config_schema).forEach(
              ([schemaKey, schemaValue]) => {
                processSchema(schemaValue, `${key}.${schemaKey}`);
              },
            );
          }
        });
      }

      setSchemaCopies(newSchemaCopies);
    }
  }, [data, isLoading]);

  const getStepsTypeOrderedByPriority = useMemo(() => {
    if (data?.workflow?.steps) {
      return [...data.workflow.steps].sort(
        (a: any, b: any) => a.priority - b.priority,
      );
    }
    return [];
  }, [data]);

  const updateSchemaCopies = (path: string, copies: number) => {
    setSchemaCopies((prev) => ({
      ...prev,
      [path]: copies,
    }));
  };

  const renderStepTypes = () => {
    if (!data?.schema?.step_types) return null;

    return getStepsTypeOrderedByPriority?.map((step) => {
      const stepType = data.schema.step_types[step.type];
      const typedStepType = stepType as StepType;
      return (
        <div key={step.type} className="step-type-section mb-4">
          <RenderSectionHeader
            sectionTitle={typedStepType.title}
            sectionKey={step.type}
            id={typedStepType.title}
          />
          {typedStepType.config_schema && (
            <div className="config-schema-content flex flex-col gap-2">
              {Object.entries(typedStepType.config_schema).map(
                ([schemaKey, schemaValue]) =>
                  renderSchemaField(
                    schemaKey,
                    schemaValue as SchemaField,
                    step.type,
                    undefined,
                    initialData,
                    setInitialData,
                    schemaCopies,
                    updateSchemaCopies,
                    resetField,
                    setResetField,
                  ),
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="pbm-configuration-page flex h-full flex-col gap-2">
      {isLoading ? (
        <>
          <div className="pbm-configuration-page__content flex-1 overflow-auto">
            <LoaderMessage message="Loading PBM configuration..." />
          </div>
        </>
      ) : (
        <>
          <div className="pbm-configuration-page__content flex flex-1 flex-col gap-2 overflow-hidden">
            <div className="pbm-configuration-page actions flex flex-row justify-end gap-2 border-b border-primaryGray-16 py-1">
              {" "}
              <div className="flex justify-end py-1">
                <Button
                  buttonType="secondary"
                  size="small"
                  disabled={isSaving}
                  onClick={() => {
                    setIsParsedInsuranceCardOpen(true);
                  }}
                >
                  View Parsed Insurance Cards
                </Button>
              </div>
              <div className="flex justify-end py-1">
                <Button
                  buttonType="secondary"
                  size="small"
                  disabled={isSaving}
                  onClick={() => {
                    setIsPbmModalOpen(true);
                  }}
                >
                  View Steps
                </Button>
              </div>
            </div>
            <div className="pbm-configuration-page__configuration flex-1 overflow-auto">
              {renderStepTypes()}
            </div>
          </div>
          <div className="pbm-configuration__footer flex items-center justify-between gap-2 border-t border-primaryGray-16 pt-2">
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
              onClick={() =>
                handleSaveChanges(
                  data,
                  initialData,
                  user,
                  setIsSaving,
                  dispatch,
                )
              }
              buttonType={"primary"}
              size={"medium"}
            />
          </div>
          {isPbmModalOpen && (
            <PbmConfigModal
              isOpen={isPbmModalOpen}
              onClose={() => setIsPbmModalOpen(false)}
            />
          )}
          {isParsedInsuranceCardOpen && (
            <ParsedInsuranceCard
              isOpen={isParsedInsuranceCardOpen}
              onClose={() => setIsParsedInsuranceCardOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PbmConfiguration;
