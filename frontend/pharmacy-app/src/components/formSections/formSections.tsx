import { useEffect, useState } from "react";
import { CmmFormConfigModel } from "../../data-model/cmmFormConfigModel";
import { getAllFormSections } from "./utils/getAllFormSections";

interface SinglePaFormSectionProps {
  id: string;
  mainText: string;
  isActive?: boolean;
}

interface FormSectionProps {
  activeSection?: string;
  matchedKey?: string;
  formConfiguration?: CmmFormConfigModel[];
}
const FormSections = (props: FormSectionProps) => {
  const [sections, setSections] = useState<SinglePaFormSectionProps[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (props.matchedKey && props.formConfiguration) {
      const pickedFormConfig = props?.formConfiguration?.find(
        (form) => form.id === props.matchedKey,
      );

      if (pickedFormConfig?.data) {
        setSections(getAllFormSections(pickedFormConfig?.data));
      }
    }
  }, [props.formConfiguration, props.matchedKey]);

  useEffect(() => {
    if (props.activeSection) {
      setActiveSection(props.activeSection);
    } else if (sections.length > 0) {
      setActiveSection(sections[0].id);
    }
  }, [sections]);

  useEffect(() => {
    if (props.activeSection) {
      setActiveSection(props.activeSection);
    }
  }, [props.activeSection]);

  const handleClickEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { id } = target;
    const formSectionId = id.replace("section-", "");
    document.getElementById(formSectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  };

  return (
    <div onClick={(event) => handleClickEvent(event)}>
      {sections.length > 0 ? (
        sections.map((section) => (
          <SinglePaFormSection
            key={section.id}
            id={section.id}
            mainText={section.mainText}
            isActive={section.id === activeSection}
          />
        ))
      ) : (
        <p>No sections available</p>
      )}
    </div>
  );
};

const SinglePaFormSection = (props: SinglePaFormSectionProps) => {
  return (
    <>
      {props.isActive ? (
        <div
          className="single-form-section__container border-l-4 border-tertiaryBlue-4 bg-white px-2 py-3 text-small font-bold leading-5 text-tertiaryBlue-4"
          id={props.id}
        >
          {props.mainText}
        </div>
      ) : (
        <div
          className="single-form-section__container border-l-4 border-transparent bg-primaryGray-16 px-2 py-3 text-small font-regular leading-5 hover:cursor-pointer hover:font-semiBold hover:text-tertiaryBlue-4"
          id={props.id}
        >
          {props.mainText}
        </div>
      )}
    </>
  );
};

export default FormSections;
