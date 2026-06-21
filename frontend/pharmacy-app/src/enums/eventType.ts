export enum EventType {
  RPA_ACTION = "rpa_name",
  API_CALL = "api_name",
  USER_ACTION = "screen_name",
  SYSTEM_ACTION = "system_name",
  RPA_ACTIONS_DETAILS = "rpa_action",
  API_CALL_DETAILS = "api_call",
  FRONTEND_EVENT_DETAILS = "frontend_event",
  FHIR_API_CALL = "fhir_api_call",
  AI_AGENT = "ai_agent",
}

export const EventTypeTextForUI = {
  [EventType.RPA_ACTION]: "LLM RPA Agent",
  [EventType.API_CALL]: "API",
  [EventType.USER_ACTION]: "User",
  [EventType.SYSTEM_ACTION]: "System",
  [EventType.RPA_ACTIONS_DETAILS]: "LLM RPA Agent",
  [EventType.API_CALL_DETAILS]: "AI Agent",
  [EventType.FRONTEND_EVENT_DETAILS]: "User",
  [EventType.FHIR_API_CALL]: "FHIR API",
  [EventType.AI_AGENT]: "AI Agent",
};

export const EventBadgeBgColorForUI = {
  [EventType.RPA_ACTION]: "#F6E5FF",
  [EventType.API_CALL]: "#EAF2FF",
  [EventType.USER_ACTION]: "#E6F3F0",
  [EventType.SYSTEM_ACTION]: "#F5F5F5",
  [EventType.RPA_ACTIONS_DETAILS]: "#F6E5FF",
  [EventType.API_CALL_DETAILS]: "#EAF2FF",
  [EventType.FRONTEND_EVENT_DETAILS]: "#E6F3F0",
  [EventType.FHIR_API_CALL]: "#FFFCD6",
  [EventType.AI_AGENT]: "#EAF2FF",
};

export const EventBadgeTextColorForUI = {
  [EventType.RPA_ACTION]: "#4B00CC",
  [EventType.API_CALL]: "#0056D6",
  [EventType.USER_ACTION]: "#005D49",
  [EventType.SYSTEM_ACTION]: "#000000",
  [EventType.RPA_ACTIONS_DETAILS]: "#4B00CC",
  [EventType.API_CALL_DETAILS]: "#0056D6",
  [EventType.FRONTEND_EVENT_DETAILS]: "#005D49",
  [EventType.FHIR_API_CALL]: "#665D00",
  [EventType.AI_AGENT]: "#0056D6",
};
