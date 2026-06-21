import React from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

interface PrescriptionImagesViewerProps {
  imageUrls: string[];
  onImageLoad: () => void;
}

export const PrescriptionImagesViewer: React.FC<
  PrescriptionImagesViewerProps
> = ({ imageUrls, onImageLoad }) => {
  return (
    <div className="prescription-images-viewer relative h-full w-full overflow-y-auto bg-primaryGray-16 p-1">
      <div className="flex flex-col space-y-4 p-2">
        {imageUrls.map((url, index) => (
          <div
            key={index}
            className="relative w-full rounded border border-primaryGray-15"
          >
            <Zoom>
              <img
                src={url}
                alt={`Prescription ${index + 1}`}
                onLoad={onImageLoad}
                className="block w-full"
              />
            </Zoom>
          </div>
        ))}
      </div>
    </div>
  );
};
