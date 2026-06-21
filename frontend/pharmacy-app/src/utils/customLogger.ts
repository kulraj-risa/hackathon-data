export const logDataToConsole = (
  message = "",
  valueToLog: any = "",
  loggerType: "info" | "warn" | "error" | "log" = "log",
) => {
  if (process.env.REACT_APP_ENV === "development") {
    console[loggerType](message, valueToLog);
  }
};

export const logError = (error: Error, additionalInfo: any = "") => {
  if (process.env.REACT_APP_ENV === "development") {
    console.error(
      "Error:",
      error.message,
      "\nStack Trace:",
      error.stack,
      "\nAdditional Info:",
      additionalInfo,
    );
  }
};
