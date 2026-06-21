import { DocumentsStoreedInLocalStorage } from "../data-model/docsStorageInLocalStorage";
import { LocalStorageKeys } from "../enums/localStorageKeys";
import { getItemFromLocalStorage } from "./localStorageHelper";

export const determineIfDocumentRpaShouldRun = (orderId: string) => {
  const allDocumentsForJCodesOfOrder = getItemFromLocalStorage(
    `${LocalStorageKeys.JCode_Docs}_${orderId}`,
  ) as Record<string, DocumentsStoreedInLocalStorage[]>;

  if (allDocumentsForJCodesOfOrder) {
    const checkIfEveryDocTypeIsNotEmpty = Object.values(
      allDocumentsForJCodesOfOrder,
    ).some((doc) => doc.length > 0);

    if (checkIfEveryDocTypeIsNotEmpty === false) {
      return false;
    }

    return true;
  }
  return false;
};

export const checkIfEveryDocTypeIsUploaded = (orderId: string) => {
  const allDocumentsForJCodesOfOrder = getItemFromLocalStorage(
    `${LocalStorageKeys.JCode_Docs}_${orderId}`,
  ) as Record<string, DocumentsStoreedInLocalStorage[]>;

  if (!allDocumentsForJCodesOfOrder) {
    return false;
  }

  return Object.values(allDocumentsForJCodesOfOrder).every(
    (doc) => doc.length === 0 || doc.every((d) => d.docPath !== ""),
  );
};
