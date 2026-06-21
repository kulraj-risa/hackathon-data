import { getViewerDocumentTitleByDocType } from "../constants/statusToDocMap/statusToDocMap";
import { MedicalPaOrder } from "../data-model/medicalPaOrdersModel";

export const generateDataForDocWithSideNavModalFromSingleMedicalPaOrder = (
  orderData: MedicalPaOrder,
) => {
  const allJCodesData = orderData?.auth_on_file?.auth_entries
    ?.map((authEntry) => authEntry.j_codes)
    .filter((jCode) => jCode && jCode?.length > 0)
    .flat();

  return allJCodesData?.map((jCode) => {
    const docs = jCode?.documents?.map((doc, index) => {
      return {
        title: getViewerDocumentTitleByDocType(doc?.doc_type ?? ""),
        type: doc?.doc_type,
        path: doc?.doc_path,
        id: jCode?.id ?? "",
        showPrevious: index > 0,
        showNext: index < (jCode?.documents?.length ?? 0) - 1,
      };
    });
    return {
      description: (jCode?.j_code ?? "") + " - " + (jCode?.description ?? ""),
      id: jCode?.id,
      documents: docs,
    };
  });
};
