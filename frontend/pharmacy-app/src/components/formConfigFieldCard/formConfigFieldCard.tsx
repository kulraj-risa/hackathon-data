import { useState } from "react";
import { FormField } from "../../data-model/pharmaPaFormModel";
import { Delete } from "../../svg/delete";
import EditIcon from "../../svg/editIcon";
import ConfigCardContent from "../configCardContent/configCardContent";

interface FormConfigFieldCardProps {
  order?: number;
  rowIndex?: number;
  onEditClick?: (
    parentKey?: string,
    field?: FormField,
    renderIndex?: number,
  ) => void;
  onDeleteClick?: (
    parentKey?: string,
    field?: FormField,
    renderIndex?: number,
  ) => void;
  children?: React.ReactNode;
  isAccordion?: boolean;
  formField?: FormField;
  parentKey?: string;
  renderIndex?: number;
}

const FormConfigFieldCard = ({
  onEditClick,
  onDeleteClick,
  children,
  isAccordion,
  formField,
  parentKey,
  renderIndex,
}: FormConfigFieldCardProps) => {
  const [isShowMoreOpen, setIsShowMoreOpen] = useState(false);

  const handleShowMoreClick = () => {
    setIsShowMoreOpen(!isShowMoreOpen);
  };

  return (
    <div className="w-full overflow-hidden rounded-md bg-white shadow-md">
      <div className="flex w-full flex-row items-center justify-between rounded-md border border-primaryGray-14 p-3">
        <div className="flex w-[50%] flex-row items-center justify-between">
          <ConfigCardContent
            title="Field Type"
            description={formField?.type ?? ""}
            width="w-[15%]"
          />
          <ConfigCardContent
            title="Label"
            description={formField?.label ?? ""}
            width="w-[35%]"
          />
          <ConfigCardContent
            title="Key"
            description={formField?.key ?? ""}
            width="w-[45%]"
          />
        </div>
        <div className="flex w-[20%] flex-row items-center justify-between">
          <ConfigCardContent
            title="Is Required"
            description={formField?.isRequired ? "Yes" : "No"}
          />
          <ConfigCardContent
            title="Row Index"
            description={formField?.rowIndex?.toString() ?? ""}
          />
          <ConfigCardContent
            title="Order"
            description={formField?.order?.toString() ?? ""}
          />
        </div>
        <div className="flex w-[10%] flex-row items-center justify-end gap-3">
          {isAccordion && (
            <div
              className="cursor-pointer text-xs transition-colors hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                handleShowMoreClick();
              }}
            >
              {isShowMoreOpen ? "show less" : "show more"}
            </div>
          )}
          <div
            className="cursor-pointer transition-opacity hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick?.(parentKey, formField, renderIndex);
            }}
          >
            <EditIcon />
          </div>
          <div
            className="cursor-pointer transition-opacity hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick?.(parentKey, formField, renderIndex);
            }}
          >
            <Delete />
          </div>
        </div>
      </div>

      {isShowMoreOpen && children && (
        <div className="rounded-md border border-primaryGray-14 bg-primaryGray-16">
          <div className="p-4">{children}</div>
        </div>
      )}
    </div>
  );
};

export default FormConfigFieldCard;
