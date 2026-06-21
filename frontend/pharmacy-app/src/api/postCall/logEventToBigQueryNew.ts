import { LogEventModel } from "../../data-model/logEventModel";
import { API_ENDPOINTS } from "../../enums/apiUrls";
import { logToDatadogRum } from "../../utils/logToDatadogRum";

import { getBearerToken } from "./bearerToken";

export const logEventToBigQuery = async (
  event: LogEventModel,
): Promise<any> => {
  const token = await getBearerToken();
  const cleanedEventNameWithoutBrackets = event?.event_name?.split("(")[0];

  logToDatadogRum(cleanedEventNameWithoutBrackets || "unknown_event", {
    event_name: cleanedEventNameWithoutBrackets,
    patient_id: event.patient_id,
    order_id: event.order_id,
    org_id: event.org_id,
    user_id: event.user_id,
    user_email: event.user_email,
    event_date: new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }),
    ...event.additional_data,
  });

  try {
    const response = await fetch(API_ENDPOINTS.LOG_EVENT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Log event to big query failed with status ${response.status}: ${errorData.message || response.statusText}`,
      );
    }

    const result = await response.json();

    return result;
  } catch (error) {
    logToDatadogRum(cleanedEventNameWithoutBrackets || "unknown_event", {
      event_name: cleanedEventNameWithoutBrackets,
      patient_id: event.patient_id,
      order_id: event.order_id,
      org_id: event.org_id,
      user_id: event.user_id,
      user_email: event.user_email,
      event_date: new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      }),
      ...event.additional_data,
      bigquery_success: false,
      bigquery_error: error instanceof Error ? error.message : String(error),
    });
    console.error("Error logging event to big query", error);
  }
};
