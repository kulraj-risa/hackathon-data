import { Button, TextInput } from "risa-oasis-ui_v2";
import { Delete } from "../../svg/delete";

interface SingleOptionInputBoxProps {
  id: string;
  value: string;
  label: string;
  onValueChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onRemove: () => void;
}

const SingleOptionInputBox = ({
  value,
  label,
  onValueChange,
  onLabelChange,
  onRemove,
}: SingleOptionInputBoxProps) => {
  return (
    <>
      <div className="single-option-input-box--container flex items-center gap-2">
        <div className="flex-1">
          <TextInput
            label=""
            id="label"
            placeholder="Enter Label"
            onChange={({ value }) => onLabelChange(value)}
            hideLabel={true}
            defaultValue={label}
          />
        </div>
        <div className="flex-1">
          <TextInput
            label=""
            id="value"
            placeholder="Enter Value"
            onChange={({ value }) => onValueChange(value)}
            hideLabel={true}
            defaultValue={value}
          />
        </div>
        <Button
          onClick={onRemove}
          buttonType="tertiary"
          size="small"
          disabled={false}
        >
          <Delete />
        </Button>
      </div>
    </>
  );
};

export default SingleOptionInputBox;
