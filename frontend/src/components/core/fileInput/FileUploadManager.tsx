import { upload } from "@testing-library/user-event/dist/cjs/utility/upload.js";
import { useFileUpload } from "src/hooks/useFileUpload";
import { PostUploadAction } from "src/types/fileUploadTypes";

import { useEffect } from "react";

import { FileInputStatusDisplay } from "./FileInputStatusDisplay";

type FileUploadManagerProps = {
  onCancel: (uploadId: string) => void;
  onDismiss: (uploadId: string) => void;
  onUploadComplete: (postUploadResult: unknown) => void;
  onStart: () => void;
  onComplete: () => void;
  onUploadError: (e: Error) => void;
  postUploadAction: PostUploadAction;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
  fileToUpload: File;
  uploadId: string;
};

export const FileUploadManager = ({
  fileToUpload,
  uploadId, // may not need this, could close over in callbacks
  onCancel,
  onDismiss,
  postUploadActionProgressMessage,
  postUploadActionSuccessMessage,
  postUploadActionErrorMessage,
  onStart,
  onUploadComplete,
  onComplete,
  onUploadError,
  postUploadAction,
}: FileUploadManagerProps) => {
  const {
    uploadError,
    currentStatus,
    fileName,
    uploadFile,
    handleCancel,
    handleDismiss,
  } = useFileUpload({
    onStart,
    onSuccess: onUploadComplete,
    onError: onUploadError,
    onComplete: onComplete,
    postUploadAction,
  });

  // eslint-disable-next-line
  useEffect(() => uploadFile(fileToUpload), []);
  console.log("~~~ currentStatus", uploadError);
  return (
    <FileInputStatusDisplay
      fileName={fileName || ""}
      onCancel={() => {
        void handleCancel(); // cancel upload
        onCancel(uploadId); // update parent state
      }}
      onDismiss={() => {
        handleDismiss(); // dismiss in hook
        onDismiss(uploadId); // update parent state
      }}
      error={!!uploadError}
      status={currentStatus}
      postUploadActionProgressMessage={postUploadActionProgressMessage}
      postUploadActionSuccessMessage={postUploadActionSuccessMessage}
      postUploadActionErrorMessage={postUploadActionErrorMessage}
    />
  );
};
