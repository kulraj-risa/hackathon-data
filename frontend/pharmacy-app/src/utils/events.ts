import { logEvent, setUserId, setUserProperties } from "@firebase/analytics";
import { firebaseAnalytics } from "../api/firebase/firestoreService";

export enum EventName {
  LOGIN = "login",
  SIGN_UP = "sign_up",
  LOGOUT = "logout",
  ORDER_CLICK = "order_click",
  BUTTON_CLICK = "button_click",
  TAB_CLICK = "tab_click",
  SIDE_NAV_CLICK = "side_nav_click",
  TOP_NAV_CLICK = "top_nav_click",
  ERROR_OCCURRED = "error_occurred",
  PATIENT_CLICK = "patient_click",
}

export enum ParamName {
  USER_ID = "user_id",
  USER_EMAIL = "user_email",
  ORDER_ID = "order_id",
  IS_ADMIN = "is_admin",
  TAB_LABEL = "tab_label",
  SIDE_NAV_LABEL = "side_nav_label",
  TOP_NAV_LABEL = "top_nav_label",
  BUTTON_NAME = "button_name",
  ERROR_MESSAGE = "error_message",
  RESET_PASSWORD = "reset_password",
  SIGN_UP = "sign_up",
  LOGIN = "login",
  PATIENT_ID = "patient_id",
  SETTINGS = "settings",
  PROFILE = "profile",
  LOGOUT = "logout",
}

export function logEventWithParams(
  eventName: string,
  parameters?: { [key: string]: any },
) {
  if (!firebaseAnalytics) {
    console.warn(
      "Firebase Analytics not available, skipping event:",
      eventName,
    );
    return;
  }
  logEvent(firebaseAnalytics, eventName, parameters);
}

export function setUserProperty(parameters: { [key: string]: any }) {
  if (!firebaseAnalytics) {
    console.warn("Firebase Analytics not available, skipping user properties");
    return;
  }
  setUserProperties(firebaseAnalytics, parameters);
}

export function initializeAnalyticsWithUserId(userId: string) {
  if (!firebaseAnalytics) {
    console.warn("Firebase Analytics not available, skipping user ID setup");
    return;
  }
  setUserId(firebaseAnalytics, userId);
}

export function logOrderClickedEvent(orderId: string) {
  logEventWithParams(EventName.ORDER_CLICK, {
    [ParamName.ORDER_ID]: orderId,
  });
}

export function logButtonClickEvent(buttonName: string) {
  logEventWithParams(EventName.BUTTON_CLICK, {
    [ParamName.BUTTON_NAME]: buttonName,
  });
}

export function logTabClickEvent(tabLabel: string) {
  logEventWithParams(EventName.TAB_CLICK, {
    [ParamName.TAB_LABEL]: tabLabel,
  });
}

export function logSideNavClickEvent(sideNavLabel: string) {
  logEventWithParams(EventName.SIDE_NAV_CLICK, {
    [ParamName.SIDE_NAV_LABEL]: sideNavLabel,
  });
}

export function logSignUpEvent(userId: string, userEmail: string) {
  logEventWithParams(EventName.SIGN_UP, {
    [ParamName.USER_ID]: userId,
    [ParamName.USER_EMAIL]: userEmail,
  });
}

export function logLoginEvent(userId: string, userEmail: string) {
  logEventWithParams(EventName.LOGIN, {
    [ParamName.USER_ID]: userId,
    [ParamName.USER_EMAIL]: userEmail,
  });
}

export function logLogoutEvent() {
  logEventWithParams(EventName.LOGOUT, {});
}

export function logErrorEvent(errorMessage: string) {
  logEventWithParams(EventName.ERROR_OCCURRED, {
    [ParamName.ERROR_MESSAGE]: errorMessage,
  });
}

export function logPatientClickEvent(patientId: string) {
  logEventWithParams(EventName.PATIENT_CLICK, {
    [ParamName.PATIENT_ID]: patientId,
  });
}
