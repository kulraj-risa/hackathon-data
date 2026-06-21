import { useEffect, useMemo, useState } from "react";
import { Button, TextInput } from "risa-oasis-ui_v2";
import { SectionField } from "../../../data-model/pharmaPaFormModel";
import { CrossIcon } from "../../../svg/cross-icon";

interface SectionSideModalProps {
  onClose?: () => void;
  type: "add" | "edit";
  onSaveClick?: (data: {
    label: string;
    key: string;
    type: "section";
    order: number;
    fields?: any[];
  }) => void;
  initialData?:
    | {
        label: string;
        type: "section";
        key: string;
        order: number;
        fields?: any[];
      }
    | SectionField;
}

export const SectionSideModal = (props: SectionSideModalProps) => {
  const [section, setSection] = useState<{
    label: string;
    key: string;
    order: number | string;
    type: "section";
    fields?: any[];
  }>({
    label: "",
    type: "section",
    key: "",
    order: 0,
    fields: [],
  });
  const [sectionError, setSectionError] = useState<{
    label: string;
    key: string;
    order: string;
  }>({
    label: "",
    key: "",
    order: "",
  });

  useEffect(() => {
    setSectionError({
      label: section.label === "" ? "This field is required" : "",
      key: section.key === "" ? "This field is required" : "",
      order:
        isNaN(Number(section.order)) || section.order === ""
          ? "This field is required and support only numbers"
          : "",
    });
  }, [section]);

  useEffect(() => {
    if (props.initialData) {
      setSection({
        label: props.initialData.label,
        type: props.initialData.type,
        key: props.initialData.key,
        order: props.initialData.order ?? 0,
        fields: props.initialData.fields,
      });
    }
  }, []);

  const checkIfSubmitButtonToBeEnabled = useMemo(() => {
    return (
      sectionError.label === "" &&
      sectionError.key === "" &&
      sectionError.order === ""
    );
  }, [sectionError]);

  const handleSaveClick = () => {
    if (checkIfSubmitButtonToBeEnabled) {
      props.onSaveClick?.({
        label: section.label,
        key: section.key,
        type: "section",
        order: Number(section.order),
        fields: section.fields || [],
      });
      props.onClose?.();
    }
  };
  return (
    <>
      <div className="add-section-container fixed flex h-full w-full flex-col overflow-hidden">
        <div className="add-section-header border-primaryGray14 flex items-center justify-between gap-4 border-b px-4 py-3 text-large font-bold text-primaryGray-1">
          <div className="add-section-header--text">
            {props.type === "add" ? "Add Section" : "Edit Section"}
          </div>
          <div
            className="add-section-header--icon hover:cursor-pointer"
            onClick={() => props.onClose?.()}
          >
            <CrossIcon />
          </div>
        </div>
        <div className="add-section-body flex flex-1 flex-col gap-3 overflow-hidden p-4">
          <div>
            <TextInput
              id="label"
              label="Section Name"
              required
              defaultValue={section.label}
              onChange={(e) => {
                if (e.value) {
                  setSection((prev) => ({ ...prev, label: e.value }));
                }
              }}
              error={sectionError.label !== "" ? sectionError.label : ""}
            />
          </div>
          <div>
            <TextInput
              id="key"
              label="Section Key"
              required
              defaultValue={section.key}
              onChange={(e) => {
                if (e.value) {
                  setSection((prev) => ({ ...prev, key: e.value }));
                } else {
                  setSectionError((prev) => ({
                    ...prev,
                    key: "This field is required",
                  }));
                }
              }}
              error={sectionError.key !== "" ? sectionError.key : ""}
            />
          </div>
          <div>
            <TextInput
              id="order"
              label="Section Order"
              required
              defaultValue={section.order.toString()}
              onChange={(e) => {
                setSection((prev) => ({
                  ...prev,
                  order: e.value,
                }));
              }}
              error={sectionError.order !== "" ? sectionError.order : ""}
            />
          </div>
        </div>
        <div className="add-section-footer flex items-center justify-between gap-4 border-t border-primaryGray-15 px-4 py-3">
          <div className="flex-1">
            <Button
              disabled={false}
              children={"Cancel"}
              onClick={() => {
                props.onClose?.();
              }}
              buttonType={"secondary"}
              size={"medium"}
            />
          </div>
          <div className="flex-1">
            <Button
              disabled={!checkIfSubmitButtonToBeEnabled}
              children={props.type === "add" ? "Add Section" : "Edit Section"}
              onClick={handleSaveClick}
              buttonType={"primary"}
              size={"medium"}
            />
          </div>
        </div>
      </div>
    </>
  );
};
