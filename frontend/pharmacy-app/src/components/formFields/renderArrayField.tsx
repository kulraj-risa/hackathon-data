import { ArrayField, FormField } from "../../data-model/pharmaPaFormModel";
import { AddMore } from "../../svg/add-more";
import { Delete } from "../../svg/delete";
import RenderFields from "./renderFields";

interface ArrayFieldProps {
  field: ArrayField;
  data?: any;
  originalData?: any;
  onAddMore?: (key: string) => void;
  onDelete?: (path: string, parentKey: string) => void;
  shouldEmitLogEvent?: boolean;
}

interface ArrayFieldItemProps {
  field: FormField[];
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}

const RenderSingleArrayField = (props: ArrayFieldItemProps) => {
  const { field, data, originalData, shouldEmitLogEvent } = props;

  // First, group by rowIndex
  const groupedFields = (field ?? []).reduce<Record<number, FormField[]>>(
    (acc, fieldItem) => {
      if (!fieldItem || typeof fieldItem !== "object") return acc;
      // Preserve the exact rowIndex, don't default to 0
      const rowIndex = fieldItem.rowIndex;
      if (typeof rowIndex === "number") {
        if (!acc[rowIndex]) {
          acc[rowIndex] = [];
        }
        acc[rowIndex].push(fieldItem);
      }
      return acc;
    },
    {},
  );

  // Sort fields by order within each row
  Object.keys(groupedFields).forEach((rowIndex) => {
    groupedFields[rowIndex].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  return (
    <div className="render-form-array container flex flex-col gap-2">
      {Object.keys(groupedFields)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((rowIndex) => (
          <div key={rowIndex} className="single-row__container mb-2 flex gap-2">
            {groupedFields[rowIndex].map((fieldItem) => (
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
    </div>
  );
};

const RenderNestedArrayField = (props: {
  fields: FormField[][];
  data?: any;
  originalData?: any;
  shouldEmitLogEvent?: boolean;
}) => {
  const { fields, data, originalData, shouldEmitLogEvent } = props;

  return (
    <div className="render-form-array container flex flex-col gap-2">
      {fields.map((arrayItem, arrayIndex) => (
        <div
          key={arrayIndex}
          className="array-item flex flex-col gap-2 rounded border border-primaryGray-14 p-2"
        >
          <RenderSingleArrayField
            field={arrayItem}
            data={data}
            originalData={originalData}
            shouldEmitLogEvent={shouldEmitLogEvent}
          />
        </div>
      ))}
    </div>
  );
};

const RenderArrayField = (props: ArrayFieldProps) => {
  const { field, data, originalData, shouldEmitLogEvent } = props;

  const onAddMoreClick = () => {
    props.onAddMore?.(field.parentKey ?? field.key);
  };

  return (
    <>
      <div className="form-array-field container flex flex-col gap-2">
        <fieldset className="group__container s flex w-full flex-col gap-4 border p-4">
          <legend className="group__legend rounded bg-primaryGray-16 px-2 py-1 text-tiny font-bold text-primaryGray-1">
            {field?.label}
          </legend>

          {field.fields.map((fieldItem, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-md border border-primaryGray-14 p-2 shadow-md"
            >
              {Array.isArray(fieldItem[0]) ? (
                <RenderNestedArrayField
                  fields={fieldItem as FormField[][]}
                  data={data}
                  originalData={originalData}
                  shouldEmitLogEvent={shouldEmitLogEvent}
                />
              ) : (
                <RenderSingleArrayField
                  field={fieldItem as FormField[]}
                  data={data}
                  originalData={originalData}
                  shouldEmitLogEvent={shouldEmitLogEvent}
                />
              )}
              <div
                className="delete-icon ml-auto flex w-fit cursor-pointer justify-center rounded-full bg-primaryGray-16 p-2"
                onClick={() => {
                  props.onDelete?.(
                    `${field.parentKey ?? field.key}[${index}]`,
                    field.parentKey ?? field.key,
                  );
                }}
              >
                <Delete />
              </div>
            </div>
          ))}
          <div
            className="add-more-field ml-auto flex cursor-pointer flex-row items-center gap-2 text-tiny font-bold text-tertiaryBlue-4 hover:text-tertiaryBlue-3"
            onClick={onAddMoreClick}
          >
            <AddMore />
            Add more
          </div>
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
      </div>
    </>
  );
};

export default RenderArrayField;
