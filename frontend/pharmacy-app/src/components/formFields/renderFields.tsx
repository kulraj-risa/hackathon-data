import {
  ArrayField,
  DateField,
  DropdownField,
  FormField,
  GroupField,
  RadioButtonField,
} from "../../data-model/pharmaPaFormModel";
import { FormFieldTypes } from "../../enums/formFieldType";
import RenderArrayField from "./renderArrayField";
import RenderAutoSelectField from "./renderAutoSelectField";
import RenderDateField from "./renderDateField";
import RenderDropdownField from "./renderDropdownField";
import RenderGroupField from "./renderGroupField";
import RenderRadioButtonField from "./renderRadioButtonField";
import RenderTextInputField from "./renderTextInputField";

interface RenderFieldsProps {
  field: FormField;
  fieldDetails?: Record<string, any>;
  data?: any;
  originalData?: any;
  onAddMore?: (key: string) => void;
  onDelete?: (path: string, parentKey: string) => void;
  shouldEmitLogEvent?: boolean;
}

const RenderFields = (props: RenderFieldsProps) => {
  switch (props.field.type) {
    case FormFieldTypes.TEXT:
      return (
        <RenderTextInputField
          field={props.field}
          data={props.data}
          originalData={props.originalData}
          shouldEmitLogEvent={props.shouldEmitLogEvent}
        />
      );
    case FormFieldTypes.DROPDOWN:
      return (
        <RenderDropdownField
          field={props.field as DropdownField}
          data={props.data}
          originalData={props.originalData}
          shouldEmitLogEvent={props.shouldEmitLogEvent}
        />
      );
    case FormFieldTypes.DATE:
      return (
        <RenderDateField
          field={props.field as DateField}
          data={props.data}
          originalData={props.originalData}
          shouldEmitLogEvent={props.shouldEmitLogEvent}
        />
      );
    case FormFieldTypes.GROUP:
      return (
        <RenderGroupField
          field={props.field as GroupField}
          data={props.data}
          originalData={props.originalData}
          shouldEmitLogEvent={props.shouldEmitLogEvent}
        />
      );
    case FormFieldTypes.RADIO:
      return (
        <RenderRadioButtonField
          field={props.field as RadioButtonField}
          data={props.data}
          originalData={props.originalData}
          shouldEmitLogEvent={props.shouldEmitLogEvent}
        />
      );

    case FormFieldTypes.AUTOSELECT:
      return (
        <RenderAutoSelectField
          field={props.field as DropdownField}
          data={props.data}
          originalData={props.originalData}
          shouldEmitLogEvent={props.shouldEmitLogEvent}
        />
      );

    case FormFieldTypes.ARRAY:
      return (
        <>
          <RenderArrayField
            field={props.field as ArrayField}
            data={props.data}
            originalData={props.originalData}
            onAddMore={props.onAddMore}
            onDelete={props.onDelete}
            shouldEmitLogEvent={props.shouldEmitLogEvent}
          />
        </>
      );

    default:
      return null;
  }
};

export default RenderFields;
