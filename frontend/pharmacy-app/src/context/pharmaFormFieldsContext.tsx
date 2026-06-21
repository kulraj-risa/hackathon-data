import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface PharmaFormFieldsContextType {
  formFieldsData:
    | Record<
        string,
        {
          isRequired: boolean;
          filledValue: any;
          regexMatcher: any;
          type: string;
          isFieldDirty: boolean;
        }
      >
    | {};
  setFormFieldsData: (
    data:
      | Record<
          string,
          {
            isRequired: boolean;
            filledValue: any;
            regexMatcher: any;
            type: string;
            isFieldDirty: boolean;
          }
        >
      | ((prevState: Record<string, any>) => Record<string, any>),
  ) => void;

  resetFormFieldsData: () => void;
  removeFormFieldDataWithKey: (key: string) => void;
  isAllFieldsValidationFree: boolean;
  isFormDirty: boolean;
  setFormDirty: (isDirty: boolean) => void;
  shouldRefetchData: boolean;
  setShouldRefetchData: (shouldRefetchData: boolean) => void;
}

const PharmaFormFieldsContext = createContext<
  PharmaFormFieldsContextType | undefined
>(undefined);

export const PharmaFormFieldsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [pharmaFormFieldsData, setPharmaFormFieldsData] = useState<
    Record<
      string,
      {
        isRequired: boolean;
        filledValue: any;
        regexMatcher: any;
        type: string;
        isFieldDirty: boolean;
      }
    >
  >({});

  const [isAllFieldsValidationFree, setIsAllFieldsValidationFree] =
    useState<boolean>(true);
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
  const [shouldRefetchData, setShouldRefetchData] = useState<boolean>(false);
  const resetFormFieldsData = () => {
    setPharmaFormFieldsData({});
    setIsFormDirty(false);
  };

  const removeFormFieldDataWithKey = (key: string) => {
    const newFormFieldsData = { ...pharmaFormFieldsData };
    delete newFormFieldsData[key];
    setPharmaFormFieldsData(newFormFieldsData);
  };

  const checkIfAllRequiredFieldsFilled = Object.values(pharmaFormFieldsData)
    .filter((field) => field.isRequired)
    .every((field) => field.filledValue);

  const checkIfAllRegexMatch = Object.values(pharmaFormFieldsData)
    .filter((field) => field.regexMatcher)
    .every((field) => {
      if (field.regexMatcher && field.filledValue) {
        const regex = new RegExp(field.regexMatcher);
        return regex.test(field.filledValue);
      }
      return true;
    });

  const checkIfFormIsDirty = Object.values(pharmaFormFieldsData).some(
    (field) => field.isFieldDirty,
  );

  useEffect(() => {
    setIsAllFieldsValidationFree(
      checkIfAllRequiredFieldsFilled && checkIfAllRegexMatch,
    );
  }, [
    pharmaFormFieldsData,
    checkIfAllRequiredFieldsFilled,
    checkIfAllRegexMatch,
  ]);

  useEffect(() => {
    setIsFormDirty(checkIfFormIsDirty);
  }, [checkIfFormIsDirty, pharmaFormFieldsData]);

  return (
    <PharmaFormFieldsContext.Provider
      value={{
        formFieldsData: pharmaFormFieldsData,
        setFormFieldsData: setPharmaFormFieldsData,
        resetFormFieldsData,
        isAllFieldsValidationFree,
        removeFormFieldDataWithKey,
        isFormDirty,
        setFormDirty: setIsFormDirty,
        shouldRefetchData,
        setShouldRefetchData,
      }}
    >
      {children}
    </PharmaFormFieldsContext.Provider>
  );
};

export const usePharmaFormFields = (): PharmaFormFieldsContextType => {
  const context = useContext(PharmaFormFieldsContext);
  if (!context) {
    throw new Error(
      "usePharmaFormFields must be used within a FormFieldsProvider",
    );
  }
  return context;
};
