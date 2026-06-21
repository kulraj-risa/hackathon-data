import axios from "axios";
import { logDataToConsole, logError } from "../../utils/customLogger";

export const getIcdDescription = async (icdCode: string): Promise<string> => {
  try {
    const response = await axios.get<any[]>(
      `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${icdCode}&count=100`,
    );

    if (!response.data || response.data.length === 0) {
      return "--";
    }

    const [length, icd_code, meta, icd_with_description] = response.data;
    logDataToConsole("icd_with_description", icd_with_description);
    return icd_with_description?.[0]?.[1] ?? "--";
  } catch (error) {
    logError(error as Error);
    return "--";
  }
};

export const getIcdCodes = async (icdCode: string): Promise<[]> => {
  try {
    const response = await axios.get<any[]>(
      `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${icdCode}&count=100`,
    );

    if (!response.data || response.data.length === 0) {
      return [];
    }

    const [length, icd_code, meta, icd_with_description] = response.data;
    const icdCodes = icd_code.map((code) => {
      return {
        label: code,
        value: code,
      };
    });

    return icdCodes ?? [];
  } catch (error) {
    logError(error as Error);
    return [];
  }
};
