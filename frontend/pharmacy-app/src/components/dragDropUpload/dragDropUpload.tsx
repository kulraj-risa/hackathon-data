import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UploadedFileBanner } from "risa-oasis-ui_v2";
import {
  resetUploadState,
  uploadFileToFirebaseStorage,
} from "../../redux/slice/fileUploadSliceNew";
import { AppDispatch, RootState } from "../../redux/store/store";
import { DocUploadIcon } from "../../svg/doc-upload-icon";

interface DragDropUploadProps {
  id: string;
  subText?: string;
  multipleFilesAllowed?: boolean;
  fileListLength?: (length: number) => void;
  downloadedURL?: (url: string[]) => void;
  onSuccessfullyUploaded?: boolean;
  onUploadSuccess?: () => void;
  filePath?: string;
  allowedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  onDeleteFile?: (fileName: string) => void;
}

function DragDropUpload(props: DragDropUploadProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fileList, setFileList] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [currentUploadingFileIndex, setCurrentUploadingFileIndex] = useState<
    number | null
  >(null);
  const [downloadedURL, setDownloadedURL] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const {
    progress,
    downloadURL,
    error: uploadError,
  } = useSelector((state: RootState) => state.fileUploading);

  const validateFileSize = (file: File): boolean => {
    if (!props.maxFileSize) return true;
    return file.size <= props.maxFileSize;
  };

  const validateFileType = (file: File): boolean => {
    if (!props.allowedFileTypes || props.allowedFileTypes.length === 0)
      return true;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    return props.allowedFileTypes.some((type) => {
      return type.includes("/")
        ? file.type === type
        : `.${fileExtension}` === type ||
            fileExtension === type.replace(".", "");
    });
  };

  const onFileDrop = (files: FileList) => {
    if (files.length === 0) return;

    const newFiles = Array.from(files);

    // Validate file sizes
    const oversizedFiles = newFiles.filter((file) => !validateFileSize(file));
    if (oversizedFiles.length > 0) {
      const maxSizeMB = (props.maxFileSize || 0) / (1024 * 1024);
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }

    // Validate file types
    const invalidTypeFiles = newFiles.filter((file) => !validateFileType(file));
    if (invalidTypeFiles.length > 0) {
      setError(
        `File type not allowed. Supported formats: ${props.allowedFileTypes?.join(", ")}`,
      );
      return;
    }

    setError(null);
    const newProgress = newFiles.map(() => 0);
    const newDownloadedURL = newFiles.map(() => "");

    if (props.multipleFilesAllowed) {
      setFileList((prevFiles) => [...prevFiles, ...newFiles]);
      setUploadProgress((prevProgress) => [...prevProgress, ...newProgress]);
      setDownloadedURL((prevDownloadedURL) => [
        ...prevDownloadedURL,
        ...newDownloadedURL,
      ]);
      setIsUploading(false);
    } else {
      setFileList(newFiles);
      setUploadProgress(newProgress);
      setDownloadedURL(newDownloadedURL);
      setIsUploading(false);
    }
  };

  // Handles file selection from input
  const onFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files) {
      onFileDrop(event.target.files);
    }
  };

  // Deletes a file from the list
  const deleteFile = (indexToDelete: number) => {
    if (props.multipleFilesAllowed) {
      setUploadProgress((prevProgress) => {
        const updatedProgress = [...prevProgress];
        updatedProgress.splice(indexToDelete, 1);
        return updatedProgress;
      });

      setFileList((prevFiles) => {
        const updatedFiles = [...prevFiles];
        const fileToDelete = updatedFiles[indexToDelete];
        const fileNameToDelete = fileToDelete.name;
        updatedFiles.splice(indexToDelete, 1);
        props.onDeleteFile && props.onDeleteFile(fileNameToDelete);
        return updatedFiles;
      });

      setDownloadedURL((prevDownloadedURL) => {
        const updatedDownloadedURL = [...prevDownloadedURL];
        updatedDownloadedURL.splice(indexToDelete, 1);
        return updatedDownloadedURL;
      });
    } else {
      if (fileList.length > 0) {
        const fileToDelete = fileList[0];
        const fileNameToDelete = fileToDelete.name;
        props.onDeleteFile && props.onDeleteFile(fileNameToDelete);
      }
      setUploadProgress([]);
      setFileList([]);
      setDownloadedURL([]);
    }
  };

  // Prevents default behavior during drag and drop events
  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) =>
    event.preventDefault();
  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) =>
    event.preventDefault();
  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onFileDrop(event.dataTransfer.files);
  };

  useEffect(() => {
    // Initiates file upload
    if (!isUploading && fileList.length > 0) {
      const index = uploadProgress.findIndex((progress) => progress === 0);
      if (index !== -1) {
        setCurrentUploadingFileIndex(index);
        setIsUploading(true);
      }
    }
  }, [fileList, isUploading, progress]);

  useEffect(() => {
    if (props.filePath && currentUploadingFileIndex !== null && isUploading) {
      const file = fileList[currentUploadingFileIndex];
      dispatch(uploadFileToFirebaseStorage(file, props.filePath));
    }
  }, [currentUploadingFileIndex, isUploading]);

  useEffect(() => {
    // Updates upload progress and downloaded URLs
    if (currentUploadingFileIndex !== null) {
      if (progress !== undefined) {
        setUploadProgress((prevProgress) => {
          const updatedProgress = [...prevProgress];
          updatedProgress[currentUploadingFileIndex] = progress;
          return updatedProgress;
        });
      } else if (uploadError) {
        setUploadProgress((prevProgress) => {
          const updatedProgress = [...prevProgress];
          updatedProgress[currentUploadingFileIndex] = 0;
          return updatedProgress;
        });
      }

      if (downloadURL) {
        setDownloadedURL((prevDownloadedURL) => {
          const updatedDownloadedURL = [...prevDownloadedURL];
          updatedDownloadedURL[currentUploadingFileIndex] = downloadURL;
          return updatedDownloadedURL;
        });
        setIsUploading(false);
      }
    }
  }, [progress, uploadError, currentUploadingFileIndex, downloadURL]);

  useEffect(() => {
    // Calls props' callbacks for file list length and downloaded URLs
    if (areAllFilesUploaded()) {
      props.fileListLength && props.fileListLength(fileList.length);
      props.onUploadSuccess && props.onUploadSuccess();
    } else {
      props.fileListLength && props.fileListLength(0);
    }
    props.downloadedURL && props.downloadedURL(downloadedURL);
  }, [uploadProgress, fileList, downloadedURL]);

  useEffect(() => {
    // Resets component state on successful upload
    if (props.onSuccessfullyUploaded) {
      setDownloadedURL([]);
      setUploadProgress([]);
      setFileList([]);
      setIsUploading(false);
      setCurrentUploadingFileIndex(null);
    }
  }, [props.onSuccessfullyUploaded]);

  useEffect(() => {
    return () => {
      dispatch(resetUploadState());
      setFileList([]);
      setUploadProgress([]);
      setDownloadedURL([]);
      setIsUploading(false);
      setCurrentUploadingFileIndex(null);
    };
  }, []);

  // Checks if all files are uploaded
  function areAllFilesUploaded(): boolean {
    return (
      uploadProgress.every((progress) => progress === 100) &&
      downloadedURL.every((url) => url !== "")
    );
  }

  return (
    <>
      {/* Drag and drop container */}
      <div
        className="drag-drop-container"
        ref={wrapperRef}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* File upload input */}
        {props.multipleFilesAllowed || fileList.length === 0 ? (
          <div className="drop-file-input">
            <DocUploadIcon />
            <div className="main-text">
              Drag and drop or <span>click here</span> to upload
            </div>
            <div className="sub-text">
              {props?.subText ||
                `Supported file format ${props?.allowedFileTypes?.join(
                  ", ",
                )} not exceeding ${props.maxFileSize ? props.maxFileSize / (1024 * 1024) : 100}MB`}
            </div>
            {error && (
              <div className="error-message text-small text-tertiaryRed-4">
                {error}
              </div>
            )}
            <input
              type="file"
              name={props.id}
              id={props.id}
              multiple={props.multipleFilesAllowed}
              onChange={onFileUpload}
              accept={props?.allowedFileTypes?.join(",")}
            />
          </div>
        ) : null}
      </div>

      <div className="uploaded-file-container">
        {fileList.map((file, index) => (
          <div key={index}>
            <UploadedFileBanner
              fileName={file.name}
              deleteUploadedFile={() => deleteFile(index)}
              currentProgress={uploadProgress[index]}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default DragDropUpload;
