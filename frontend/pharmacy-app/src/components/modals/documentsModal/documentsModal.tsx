import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { controlToastState, Modal } from "risa-oasis-ui_v2";
import { MedicalPaOrder } from "../../../data-model/medicalPaOrdersModel";
import { cancelUploadTask } from "../../../redux/slice/fileUploadSliceNew";
import { AppDispatch, RootState } from "../../../redux/store/store";
import { AddMore } from "../../../svg/add-more";
import NewFileUploaderCard from "../../newFileUploader/newFileUploader";

interface DocumentsModalProps {
  onClose: () => void;
  documentsName: string[];
  documentsList: File[];
  id: string;
  newDocumentNames: (url: string[]) => void;
  newFiles: (files: File[]) => void;
  patientId?: string;
  orderId?: string;
  orderData?: MedicalPaOrder;
}

const DocumentsModal = (props: DocumentsModalProps) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { progress, downloadURL } = useSelector(
    (state: RootState) => state.fileUploading,
  );
  const dispatch = useDispatch<AppDispatch>();

  const { user } = useSelector(
    (state: RootState) => state.firebaseAuthentication,
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    const duplicateFiles = newFiles.filter((newFile) =>
      uploadedFiles.some((existingFile) => existingFile.name === newFile.name),
    );

    if (duplicateFiles.length > 0) {
      controlToastState("duplicate-file-upload");
      return;
    }

    const uniqueFiles = newFiles.filter(
      (newFile) =>
        !uploadedFiles.some(
          (existingFile) => existingFile.name === newFile.name,
        ),
    );

    setFileNames((prev) => [...prev, ...uniqueFiles.map((file) => file.name)]);
    setUploadedFiles((prev) => [...prev, ...uniqueFiles]);
  };

  const handleOnSave = async () => {
    props.newDocumentNames(fileNames);
    props.newFiles(uploadedFiles);

    props.onClose();
  };

  const handleClose = () => {
    dispatch(cancelUploadTask());
    props.onClose();
  };

  const handleFileDelete = (index: number) => {
    setUploadedFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });

    setFileNames((prevFileNames) => {
      const newFileNames = [...prevFileNames];
      newFileNames.splice(index, 1);
      return newFileNames;
    });
  };

  useEffect(() => {
    setFileNames(
      props.documentsName.length > 0
        ? props.documentsName
        : ["Clinical attachments"],
    );
    setUploadedFiles(props.documentsList);
  }, []);

  return (
    <Modal
      dialogId={"documents-modal"}
      onSave={handleOnSave}
      title={"Attachments"}
      saveButtonText={"Save"}
      cancelText={"Cancel"}
      onClose={handleClose}
      heightPercentage={70}
    >
      <div className="documents-modal--container flex flex-col gap-3">
        {fileNames.map((docName, index) => (
          <NewFileUploaderCard
            key={`${docName}-${index}`}
            fileName={docName}
            progress={progress}
            isUploading={isUploading}
            handleDelete={() => handleFileDelete(index)}
          />
        ))}
        <div
          className="documents-modal--add-more mt-2 flex items-center gap-1 hover:cursor-pointer"
          onClick={handleClick}
        >
          <AddMore />
          <div className="documents-modal--add-more--text text-h12 font-semibold text-tertiaryBlue-4">
            Add More
          </div>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf"
          />
        </div>
      </div>
    </Modal>
  );
};

export default DocumentsModal;
