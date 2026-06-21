import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import RotateClockwise from "../../svg/rotateClockwise";
import { logError } from "../../utils/customLogger";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PdfProps {
  file?: File | string;
  height?: number;
  hideRotateButtons?: boolean;
  hideZoomButtons?: boolean;
}

export default function PdfRender({
  file,
  hideRotateButtons,
  hideZoomButtons,
}: PdfProps) {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const rotateClockwise = () => setRotation((prev) => (prev + 90) % 360);
  const rotateCounterClockwise = () =>
    setRotation((prev) => (prev - 90 + 360) % 360);

  return (
    <div className="pdf-render__container flex h-full w-full flex-col overflow-hidden">
      <div className="pdf-render__actions relative">
        <div className="mb-2 flex items-center justify-between gap-2">
          {!hideZoomButtons && (
            <div className="flex h-full items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-sm">
              <button
                onClick={zoomOut}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                -
              </button>
              <span className="min-w-[50px] text-center text-xs font-medium text-gray-700">
                {Math.round((scale - 0.2) * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                +
              </button>
            </div>
          )}

          {!hideRotateButtons && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={rotateCounterClockwise}
                className="flex items-center justify-center rounded-full border border-primaryGray-16 bg-white p-2 text-sm font-medium transition-colors hover:bg-gray-200"
              >
                <RotateClockwise
                  className="-scale-x-100 cursor-pointer"
                  height={14}
                  width={14}
                />
              </button>
              <button
                onClick={rotateClockwise}
                className="flex items-center justify-center rounded-full border border-primaryGray-16 bg-white p-2 text-sm font-medium transition-colors hover:bg-gray-200"
              >
                <RotateClockwise
                  className="cursor-pointer"
                  height={14}
                  width={14}
                />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="pdf-render__document-viewer flex-1 overflow-auto">
        <div className="w-full">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => logError(error, "Error while loading PDF")}
            className="my-react-pdf"
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={index}
                pageNumber={index + 1}
                scale={scale}
                rotate={rotation}
                className="border-primaryGray15 mb-4 border shadow-md"
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
