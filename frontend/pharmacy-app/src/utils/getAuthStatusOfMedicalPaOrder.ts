import { AuthStatusOptionModel } from "../data-model/authStatusOptions";
import { BadgeWithIconProps } from "../data-model/badgeWithIconProps";
import { FinalWorklistDataResponse } from "../data-model/finalWorklistModel";
import {
  JCodeDetails,
  MedicalPaOrder,
} from "../data-model/medicalPaOrdersModel";
import {
  getBadgePropsForAuthStatus,
  MedicalPaOrdersAuthStatus,
} from "../enums/medicalPaOrdersAuthStatus";

export const getAuthStatusOfMedicalPaOrder = (
  medicalPaOrder: MedicalPaOrder,
  authStatusOptions: AuthStatusOptionModel[],
): BadgeWithIconProps => {
  const authStatus = medicalPaOrder?.auth_on_file?.auth_status;

  return (
    getBadgePropsForAuthStatus(authStatusOptions, authStatus) ?? {
      id: MedicalPaOrdersAuthStatus.NotAvailable,
      text: "Not Available",
      bgColor: "#F5F5F5",
      textColor: "#0F0F0F",
    }
  );
};

export const getAuthStatusOfFinalWorklist = (
  medicalPaOrder: FinalWorklistDataResponse,
  authStatusOptions: AuthStatusOptionModel[],
): BadgeWithIconProps => {
  const authStatus = medicalPaOrder?.auth_status;
  return (
    getBadgePropsForAuthStatus(authStatusOptions, authStatus) ?? {
      id: MedicalPaOrdersAuthStatus.NotAvailable,
      text: "Not Available",
      bgColor: "#F5F5F5",
      textColor: "#0F0F0F",
    }
  );
};

export const getAuthStatusOfOneJCode = (
  jCode: JCodeDetails,
  authStatusOptions: AuthStatusOptionModel[],
): BadgeWithIconProps => {
  const authStatus = jCode?.auth_status;

  if (!authStatus) {
    return {
      id: MedicalPaOrdersAuthStatus.NotAvailable,
      text: "Not Available",
      bgColor: "#F5F5F5",
      textColor: "#0F0F0F",
    };
  }

  return (
    getBadgePropsForAuthStatus(authStatusOptions, authStatus) ?? {
      id: MedicalPaOrdersAuthStatus.NotAvailable,
      text: "Not Available",
      bgColor: "#F5F5F5",
      textColor: "#0F0F0F",
    }
  );
};

export const getAuthStatusTextOfMedicalPaOrder = (
  medicalPaOrder: MedicalPaOrder,
  authStatusOptions: AuthStatusOptionModel[],
) => {
  return (
    getAuthStatusOfMedicalPaOrder(medicalPaOrder, authStatusOptions)?.text ?? ""
  );
};

export const getAuthStatusForTables = (
  medicalPaOrder: MedicalPaOrder,
  authStatusOptions: AuthStatusOptionModel[],
) => {
  return getAuthStatusOfMedicalPaOrder(medicalPaOrder, authStatusOptions);
};

// some changes
