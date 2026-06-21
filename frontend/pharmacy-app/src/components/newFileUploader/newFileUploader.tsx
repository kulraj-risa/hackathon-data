import { CrossIcon } from "../../svg/cross-icon";
import { Delete } from "../../svg/delete";

interface NewFileUploaderCardProps {
  progress?: number;
  fileName?: string;
  isUploading?: boolean;
  handleDelete: () => void;
}

const NewFileUploaderCard = (props: NewFileUploaderCardProps) => {
  return (
    <div className="upload-file-card--main-container relative h-11 w-full rounded-lg">
      <div
        className="uploader-file-card--container absolute top-2 z-20 flex h-[90%] rounded-bl-lg rounded-br-lg bg-tertiaryBlue-4"
        style={{ width: `${props.progress}%` }}
      ></div>
      <div
        className="upload-file--card--shadow absolute z-[100] flex h-full w-full items-center justify-between gap-3 rounded-lg p-3"
        style={{ backgroundColor: "#F4F5F7" }}
      >
        <div className="uploader-file-card--text flex-1 truncate text-small font-normal">
          {props.fileName ?? ""}
        </div>
        {!props.isUploading ? (
          <>
            {" "}
            <div
              className="uploader-file--card--actions flex gap-2"
              onClick={props.handleDelete}
            >
              <Delete />
            </div>
          </>
        ) : (
          <>
            <div className="uploader-file--card--actions flex items-center gap-2">
              <CrossIcon fillColor="#CC0300" />
              <div className="uploading--text text-h12 font-semiBold italic text-primaryGray-5">
                Uploading
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewFileUploaderCard;
