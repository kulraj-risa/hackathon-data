import { DateInput, Select, TextInput } from "risa-oasis-ui_v2";
import CustomRadioButton from "../../../../../components/customRadioButton/customRadioButton";
import { SchemaField } from "../../../../../data-model/pbmConfig";
import { AddMore } from "../../../../../svg/add-more";
import { Delete } from "../../../../../svg/delete";
import {
  getNestedValue,
  setNestedValue,
} from "../../../../../utils/getNestedValue";
import {
  handleAddMore,
  handleAddMoreInArray,
  handleChange,
  handleCrossClick,
  handleDelete,
} from "../pages/pbmConfiguration/utils/handlers";
import BadgeTextWithCrossIcon from "./badgeTextWithCrossIcon";

export const renderSchemaField = (
  schemaKey: string,
  schemaValue: SchemaField,
  parentKey: string | undefined,
  index: number | undefined,
  initialData: Record<string, any>,
  setInitialData: (data: Record<string, any>) => void,
  schemaCopies: { [key: string]: number },
  updateSchemaCopies: (path: string, copies: number) => void,
  resetField: boolean,
  setResetField: (value: boolean) => void,
) => {
  const path = parentKey ? `${parentKey}.${schemaKey}` : schemaKey;

  if (schemaValue.items) {
    const currentCopies = schemaCopies[path] || 0;

    return (
      <div key={schemaKey} className="schema-item">
        {Array.from({ length: currentCopies }).map((_, copyIndex) => (
          <div
            key={`${schemaKey}-copy-${copyIndex}`}
            className="schema-item mt-4"
          >
            <fieldset className="group__container w-full border p-4">
              <legend className="group__legend rounded bg-primaryGray-16 px-2 py-1 text-tiny font-bold text-primaryGray-1">
                {schemaValue.title}
              </legend>
              <div
                className="flex cursor-pointer justify-end gap-2"
                onClick={() =>
                  handleDelete(
                    path,
                    copyIndex,
                    initialData,
                    setInitialData,
                    schemaCopies,
                    updateSchemaCopies,
                  )
                }
              >
                <Delete height={16} width={16} />
                <div className="text-x-tiny font-semibold text-tertiaryRed-3">
                  Delete Sub Section
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {schemaValue.items &&
                  Object.entries(schemaValue.items).map(
                    ([itemKey, itemValue]) =>
                      renderSchemaField(
                        itemKey,
                        itemValue as SchemaField,
                        `${path}.[${copyIndex}]`,
                        copyIndex + 1,
                        initialData,
                        setInitialData,
                        schemaCopies,
                        updateSchemaCopies,
                        resetField,
                        setResetField,
                      ),
                  )}
              </div>
            </fieldset>
          </div>
        ))}
        <div
          className="add-more-container mt-2 flex cursor-pointer items-center gap-2"
          onClick={() =>
            handleAddMore(
              path ?? schemaKey,
              initialData,
              setInitialData,
              schemaCopies,
              updateSchemaCopies,
            )
          }
        >
          <AddMore />
          <div className="text-tiny font-semibold text-tertiaryBlue-4">
            Add more
          </div>
        </div>
      </div>
    );
  }

  if (
    schemaValue.ui_component === "text" ||
    schemaValue.ui_component === "number"
  ) {
    const defaultValue = getNestedValue(initialData, path);
    return (
      <div key={schemaKey} className="schema-item flex flex-col gap-2">
        <TextInput
          id={schemaKey}
          label={schemaValue.title}
          placeholder={schemaValue.placeholder}
          type={schemaValue.ui_component === "number" ? "number" : "text"}
          defaultValue={schemaValue.type === "array" ? "" : defaultValue}
          onChange={(e) => {
            handleChange(
              e,
              path,
              schemaValue.type,
              schemaValue.ui_component,
              initialData,
              setInitialData,
              setResetField,
            );
          }}
          onKeyDown={(data, event) => {
            if (event.key === "Enter" && schemaValue.type === "array") {
              handleAddMoreInArray(
                data,
                path ?? schemaKey,
                schemaValue.ui_component,
                initialData,
                setInitialData,
                setResetField,
              );
            }
          }}
          resetField={resetField}
        />
        {schemaValue.description && (
          <div className="text-x-tiny italic text-gray-500">
            {schemaValue.description}
          </div>
        )}
        {schemaValue.type === "array" && defaultValue.length > 0 && (
          <div className="badge-text--container mb-2 flex flex-wrap gap-2">
            {defaultValue.map((item, index) => (
              <BadgeTextWithCrossIcon
                key={`${path}-${index}-${item}`}
                text={item}
                onCrossClick={() => {
                  handleCrossClick(path, index, initialData, setInitialData);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (schemaValue.ui_component === "select") {
    const defaultValue = getNestedValue(initialData, path);
    return (
      <div key={schemaKey} className="schema-item">
        <Select
          id={schemaKey}
          label={schemaValue.title}
          options={schemaValue.options || []}
          defaultValue={defaultValue}
          placeholder={`Select ${schemaValue.title}`}
          onOptionChange={(e) => {
            handleChange(
              e,
              path,
              schemaValue.type,
              undefined,
              initialData,
              setInitialData,
              setResetField,
            );
          }}
        />
        {schemaValue.description && (
          <div className="text-x-tiny italic text-gray-500">
            {schemaValue.description}
          </div>
        )}
      </div>
    );
  }

  if (schemaValue.ui_component === "date_picker") {
    const defaultValue = getNestedValue(initialData, path);
    return (
      <div key={schemaKey} className="schema-item flex flex-col gap-2">
        <DateInput
          id={schemaKey}
          label={schemaValue.title}
          format="MM/DD/YYYY"
          defaultValue={defaultValue}
          onChange={(e) => {
            handleChange(
              e,
              path,
              schemaValue.type,
              undefined,
              initialData,
              setInitialData,
              setResetField,
            );
          }}
        />
        {schemaValue.description && (
          <div className="text-x-tiny italic text-gray-500">
            {schemaValue.description}
          </div>
        )}
      </div>
    );
  }

  if (schemaValue.ui_component === "radio") {
    const defaultValue = getNestedValue(initialData, path);

    return (
      <div key={schemaKey} className="schema-item">
        <div className="mb-2 text-xs font-semibold">{schemaValue.title}</div>
        <div className="flex gap-4">
          {schemaValue.options?.map((option) => (
            <CustomRadioButton
              key={option.value}
              name={path}
              value={option.value}
              checked={defaultValue === option.value}
              label={option.label}
              onChange={(e) => {
                const currentData = { ...initialData };
                const newData = setNestedValue(
                  currentData,
                  path,
                  e.target.value,
                );
                setInitialData(newData);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (schemaValue.ui_component === "multi_select") {
    const defaultValue = getNestedValue(initialData, path);
    const selectedOptionsLabel = schemaValue.options
      ?.filter((option) => defaultValue.includes(option.value))
      .map((option) => option.label);
    return (
      <div key={schemaKey} className="schema-item">
        <Select
          id={schemaKey}
          label={schemaValue.title}
          options={schemaValue.options || []}
          placeholder={`Select ${schemaValue.title}`}
          onOptionChange={(e) => {
            handleAddMoreInArray(
              e,
              path,
              undefined,
              initialData,
              setInitialData,
              setResetField,
            );
          }}
        />
        {schemaValue.description && (
          <div className="mb-2 text-x-tiny italic text-gray-500">
            {schemaValue.description}
          </div>
        )}
        <div className="badge-text--container mb-2 flex flex-wrap gap-2">
          {schemaValue.type === "array" &&
            selectedOptionsLabel &&
            selectedOptionsLabel.length > 0 &&
            selectedOptionsLabel?.map((item) => (
              <BadgeTextWithCrossIcon
                key={item}
                text={item ?? ""}
                onCrossClick={() => {}}
              />
            ))}
        </div>
      </div>
    );
  }
};
