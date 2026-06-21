import PDFMerger from "pdf-merger-js/browser";
import { logDataToConsole, logError } from "../../../utils/customLogger";

export const mergePdfs = async (files: File[]) => {
  try {
    const merger = new PDFMerger();

    for (const file of files) {
      await merger.add(file);
    }

    //   await merger.setMetadata({
    //     producer: "pdf-merger-js based script",
    //   });

    const mergedPdf = await merger.saveAsBlob();
    const url = URL.createObjectURL(mergedPdf);
    logDataToConsole("Merged PDF URL: ", url);
    return { mergedPdf, url };
  } catch (error) {
    logError(error as Error);
    throw new Error("Failed to merge PDFs. Please try again.");
  }
};
