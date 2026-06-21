import { FormDataModel } from "../../../data-model/pharmaPaFormModel";

export const getAllFormSections = (form: FormDataModel) => {
  const { fields } = form;

  if (fields.length === 0) {
    return [];
  }

  const sections = fields.filter((field) => field.type === "section");

  const sideBarSections = sections.map((section, index) => {
    return {
      id: `section-${section.key}`,
      mainText: section.label,
      isActive: false,
    };
  });

  const attachmentSection = {
    id: `section-attachments`,
    mainText: "Attachments",
    isActive: false,
  };

  return [...sideBarSections, attachmentSection];
};
