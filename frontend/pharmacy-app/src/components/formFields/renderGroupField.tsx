import { FormField, GroupField } from "../../data-model/pharmaPaFormModel";
import RenderFields from "./renderFields";

interface GroupFieldProps {
  field: GroupField;
  fieldDetails?: Record<string, any>;
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}

const RenderGroupField = (props: GroupFieldProps) => {
  const { field, data, originalData, shouldEmitLogEvent } = props;

  // Safely build groupedFields
  const groupedFields = (field?.fields ?? []).reduce<
    Record<number, FormField[]>
  >((acc, fieldItem) => {
    if (!fieldItem || typeof fieldItem !== "object") return acc;

    const rowIndex = fieldItem.rowIndex ?? 0;
    if (!acc[rowIndex]) {
      acc[rowIndex] = [];
    }
    acc[rowIndex].push(fieldItem);
    return acc;
  }, {});

  return (
    <>
      <fieldset className="group__container w-full border p-4">
        <legend className="group__legend rounded bg-primaryGray-16 px-2 py-1 text-tiny font-bold text-primaryGray-1">
          {field?.label}
        </legend>

        {Object.keys(groupedFields).map((rowIndex) => (
          <div key={rowIndex} className="single-row__container mb-2 flex gap-2">
            {groupedFields[parseInt(rowIndex, 10)]
              .filter(
                (f): f is FormField =>
                  f != null && typeof f === "object" && "key" in f,
              )
              .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
              .map((fieldItem) => (
                <RenderFields
                  key={fieldItem.key}
                  field={fieldItem}
                  data={data}
                  originalData={originalData}
                  shouldEmitLogEvent={shouldEmitLogEvent}
                />
              ))}
          </div>
        ))}
      </fieldset>

      {(field?.additionalInfoHeader || field?.additionalInfoContent) && (
        <div className="section-additonal-info flex w-full flex-col gap-2 bg-secondaryYellow-11 p-3">
          <div className="section-additonal-info__header text-tiny font-bold">
            {field?.additionalInfoHeader ?? ""}
          </div>
          <div className="section-additonal-info__content text-[0.8125rem] font-normal">
            {field?.additionalInfoContent ?? ""}
          </div>
        </div>
      )}
    </>
  );
};

export default RenderGroupField;
