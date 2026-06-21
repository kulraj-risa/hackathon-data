import { FirestoreService } from "../../../../api/firebase/firestoreService";
import { FirestoreDocumentReference } from "../../../../api/firebase/references";
import { AuthStatusOptionModel } from "../../../../data-model/authStatusOptions";
import {
  MedicalPaOrder,
  WriteBackTrail,
} from "../../../../data-model/medicalPaOrdersModel";
import { capitalizeWordsSeperatedByUnderScore } from "../../../../utils/stringModifications";
import {
  ImageViewerWithBadgesModalProps,
  ImageViewerWithBadgesProps,
} from "../imageViewerWithBadgesModal";

export const createDataForWriteBackTrail = async (
  orderId: string,
  authStatuses: AuthStatusOptionModel[],
): Promise<{
  tabs: ImageViewerWithBadgesModalProps["tabs"];
}> => {
  if (!orderId || !authStatuses || authStatuses.length === 0) {
    return {
      tabs: [],
    };
  }
  try {
    const response = await FirestoreService.getDocument(
      FirestoreDocumentReference.medicalPaOrders(orderId),
    );
    const data = response as MedicalPaOrder;
    const { currentWriteBackImagesData, previousWriteBackImagesData } =
      generateWriteBackTrail(data, authStatuses);

    const tabsWithData = generateTabsWithDataForWriteBackTrail({
      currentWriteBackImagesData,
      previousWriteBackImagesData,
    });
    return {
      tabs: tabsWithData,
    };
  } catch (error) {
    console.error("Error creating data for write back trail:", error);
    return {
      tabs: [],
    };
  }
};

export const generateTabsWithDataForWriteBackTrail = (data: {
  currentWriteBackImagesData: ImageViewerWithBadgesProps[];
  previousWriteBackImagesData: ImageViewerWithBadgesProps[];
}): ImageViewerWithBadgesModalProps["tabs"] => {
  const tabsWithData: ImageViewerWithBadgesModalProps["tabs"] = [];
  tabsWithData.push({
    id: "current",
    label: "Current Comments",
    imagesWithBadges: data.currentWriteBackImagesData,
  });
  tabsWithData.push({
    id: "previous",
    label: "Previous Comments",
    imagesWithBadges: data.previousWriteBackImagesData,
  });
  return tabsWithData;
};

export const generateWriteBackTrail = (
  data: MedicalPaOrder,
  authStatuses: AuthStatusOptionModel[],
) => {
  const currentWriteBackImagesData: ImageViewerWithBadgesProps[] = [];
  const previousWriteBackImagesData: ImageViewerWithBadgesProps[] = [];
  const busniessOfficeNotesLength = data?.auth_on_file?.reports?.length ?? 0;
  const writeBackTrail =
    data?.auth_on_file?.screenshots?.write_note_trails ?? [];
  const authStatusMap = buildAuthStatusMap(authStatuses);

  if (busniessOfficeNotesLength > 0 && writeBackTrail.length > 0) {
    const currentWriteBackTrails = writeBackTrail.slice(
      -busniessOfficeNotesLength,
    );

    const previousWriteBackTrails = writeBackTrail.slice(
      0,
      writeBackTrail.length - busniessOfficeNotesLength,
    );

    currentWriteBackTrails.forEach((trail) => {
      currentWriteBackImagesData.push(
        generateWriteBackTrailDataForComponent(trail, authStatusMap),
      );
    });
    previousWriteBackTrails.forEach((trail) => {
      previousWriteBackImagesData.push(
        generateWriteBackTrailDataForComponent(trail, authStatusMap),
      );
    });
  }

  return {
    currentWriteBackImagesData,
    previousWriteBackImagesData,
  };
};

const getAuthStatusText = (
  authStatus: string,
  authStatusMap: Map<string, AuthStatusOptionModel>,
) => {
  if (authStatus === "new") return "New";
  return (
    authStatusMap.get(authStatus)?.text ??
    capitalizeWordsSeperatedByUnderScore(authStatus)
  );
};

const getAuthStatusBgColor = (
  authStatus: string,
  authStatusMap: Map<string, AuthStatusOptionModel>,
) => {
  if (authStatus === "new") return "#EAF2FF";
  return authStatusMap.get(authStatus)?.bgColor ?? "#F5F5F5";
};

const getAuthStatusTextColor = (
  authStatus: string,
  authStatusMap: Map<string, AuthStatusOptionModel>,
) => {
  if (authStatus === "new") return "#0056D6";
  return authStatusMap.get(authStatus)?.textColor ?? "#0F0F0F";
};

const generateWriteBackTrailDataForComponent = (
  trail: WriteBackTrail,
  authStatusMap: Map<string, AuthStatusOptionModel>,
) => {
  return {
    imagePath: trail?.screenshot_path ?? "",
    fromBatchDetails: {
      batchText: getAuthStatusText(
        trail?.previous_auth_status ?? "",
        authStatusMap,
      ),
      batchBgColor: getAuthStatusBgColor(
        trail?.previous_auth_status ?? "",
        authStatusMap,
      ),
      batchTextColor: getAuthStatusTextColor(
        trail?.previous_auth_status ?? "",
        authStatusMap,
      ),
      batchId: trail?.report_identifier ?? "",
    },
    currentBatchDetails: {
      batchText: getAuthStatusText(trail?.new_auth_status ?? "", authStatusMap),
      batchBgColor: getAuthStatusBgColor(
        trail?.new_auth_status ?? "",
        authStatusMap,
      ),
      batchTextColor: getAuthStatusTextColor(
        trail?.new_auth_status ?? "",
        authStatusMap,
      ),
      batchId: trail?.report_identifier ?? "",
    },
    status_updated_at: trail?.status_updated_at ?? "",
  };
};

const buildAuthStatusMap = (authStatuses: AuthStatusOptionModel[]) => {
  const map = new Map<string, AuthStatusOptionModel>();
  for (const status of authStatuses) {
    map.set(status.id, status);
  }
  return map;
};
