/**
 * Utility function to log events to Datadog RUM
 * This is a separate module to avoid TypeScript import issues
 */

export const logToDatadogRum = async (
  eventName: string,
  eventData: Record<string, any>,
): Promise<void> => {
  try {
    // Dynamic import to avoid TypeScript compilation issues
    const { datadogRum } = await import("@datadog/browser-rum");

    datadogRum.addAction(eventName, {
      ...eventData,
      timestamp: new Date().toISOString(),
      source: "provider-dashboard",
    });
  } catch (error) {
    console.error("Error logging event to Datadog RUM:", error);
    // Don't throw - we want this to be non-blocking
  }
};
