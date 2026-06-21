import { useEffect, useState } from "react";
import { usePharmaFormFields } from "../../context/pharmaFormFieldsContext";
import { FormDataModel, FormField } from "../../data-model/pharmaPaFormModel";
import { extractFieldMappings } from "../../pages/pharmaPaForm/utils/getFormFieldsInfo";
import RenderFields from "../formFields/renderFields";
import RenderSectionHeader from "../formFields/renderSectionHeader";

interface ConfigDemoFormProps {
  formConfig?: FormDataModel;
}

const ConfigFormViewer = (props: ConfigDemoFormProps) => {
  const [formConfig, setFormConfig] = useState<FormDataModel | null>(null);
  const { formFieldsData, setFormFieldsData } = usePharmaFormFields();

  useEffect(() => {
    setFormConfig(props.formConfig ?? null);
  }, [props.formConfig]);

  useEffect(() => {
    if (formConfig) {
      const fieldMappings = extractFieldMappings(formConfig?.fields ?? []);
      console.log(fieldMappings);

      const updatedFormFieldsData = Object.entries(fieldMappings).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            ...value,
            filledValue: "",
          },
        }),
        formFieldsData,
      );

      setFormFieldsData(updatedFormFieldsData);
    }
  }, [formConfig]);

  const renderEachSectionOfTheForm = (
    section?: FormField,
    onClick?: (sectionKey: string) => void,
  ) => {
    if (section?.type !== "section" || !("fields" in section)) {
      return null;
    }

    const groupedFields = section.fields.reduce<Record<number, FormField[]>>(
      (acc, field) => {
        const rowIndex = field?.rowIndex ?? 0;
        if (!acc[rowIndex]) {
          acc[rowIndex] = [];
        }
        acc[rowIndex].push(field);
        return acc;
      },
      {},
    );

    return (
      <div
        key={section?.key}
        id={`${section?.key}`}
        className="single-section__container mb-6"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(section?.key);
        }}
      >
        <RenderSectionHeader
          sectionTitle={section?.label}
          sectionKey={`${section?.key}`}
          id={`${section?.key}`}
        />
        <div>
          {Object.keys(groupedFields).map((rowIndex) => (
            <div
              key={rowIndex}
              className="single-row__container mb-2 flex gap-2"
            >
              {groupedFields[rowIndex]
                .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
                .map(
                  (field) =>
                    field?.type && (
                      <RenderFields field={field} key={field?.key ?? ""} />
                    ),
                )}
            </div>
          ))}
        </div>
        {(section?.additionalInfoHeader || section?.additionalInfoContent) && (
          <div className="section-additonal-info flex w-full flex-col gap-2 bg-secondaryYellow-11 p-3">
            <div className="section-additonal-info__header text-tiny font-bold">
              {section?.additionalInfoHeader ?? ""}
            </div>
            <div className="section-additonal-info__content text-[0.8125rem] font-normal">
              {section.additionalInfoContent ?? ""}
            </div>
          </div>
        )}
      </div>
    );
  };
  return (
    <>
      {formConfig &&
        Object.keys(formConfig).length > 0 &&
        typeof formConfig.fields === "object" && (
          <div className="pharma-form__container">
            {formConfig?.fields
              .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
              .map((section) => renderEachSectionOfTheForm(section, () => {}))}
          </div>
        )}
    </>
  );
};

export default ConfigFormViewer;
