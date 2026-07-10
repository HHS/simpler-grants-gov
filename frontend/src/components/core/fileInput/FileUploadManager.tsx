import { useFileUpload } from "src/hooks/useFileUpload";
import { PostUploadAction } from "src/types/fileUploadTypes";

import { useEffect } from "react";

import { FileInputStatusDisplay } from "./FileInputStatusDisplay";

type FileUploadManagerProps = {
  onCancel: () => void;
  onDismiss: () => void;
  onUploadSuccess: (postUploadResult: unknown) => void;
  onStart?: () => void;
  onComplete?: () => void;
  onUploadError: (e: Error) => void;
  postUploadAction: PostUploadAction;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
  fileToUpload: File;
};

export const FileUploadManager = ({
  fileToUpload,
  postUploadActionProgressMessage,
  postUploadActionSuccessMessage,
  postUploadActionErrorMessage,
  onCancel,
  onDismiss,
  onStart,
  onUploadSuccess,
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
    dismissError,
  } = useFileUpload({
    onStart,
    onSuccess: onUploadSuccess,
    onError: onUploadError,
    onComplete: onComplete,
    postUploadAction,
  });

  // eslint-disable-next-line
  useEffect(() => uploadFile(fileToUpload), []);
  return (
    <FileInputStatusDisplay
      fileName={fileName || ""}
      onCancel={() => {
        void handleCancel(); // cancel upload
        onCancel(); // update parent state
      }}
      onDismiss={() => {
        dismissError(); // dismiss in hook
        onDismiss(); // update parent state
      }}
      error={!!uploadError}
      status={currentStatus}
      postUploadActionProgressMessage={postUploadActionProgressMessage}
      postUploadActionSuccessMessage={postUploadActionSuccessMessage}
      postUploadActionErrorMessage={postUploadActionErrorMessage}
    />
  );
};
