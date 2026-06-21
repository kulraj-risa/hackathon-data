import { logDataToConsole, logError } from "./customLogger";

export const copyTextOnClipboard = (text: string) => async () => {
  try {
    await navigator.clipboard.writeText(text);

    logDataToConsole("Copied to clipboard", text);
  } catch (err) {
    logError(err as Error, "Error while copying to clipboard");
  }
};
