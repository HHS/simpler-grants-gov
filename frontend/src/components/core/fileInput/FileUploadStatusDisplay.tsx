import {
  FileUploadProcessStatus,
  FileUploadStatus,
} from "src/types/fileUploadTypes";

import { useTranslations } from "next-intl";

const errorStatuses = new Map([
  ["uploading", "upload-error"],
  ["scanning", "scan-error"],
  ["post-upload", "post-upload-error"],
  // need to figure out how to disintguish between scan failure and scan error.
  // this will likely depend on the implementation of handling scan failures on the backend
  // Next API will return a specific error and we can return that error status before dealing with this map
]);

export const FileUploadStatusDisplay = ({
  status,
  error,
  postUploadActionProgressMessage,
  postUploadActionSuccessMessage,
  postUploadActionErrorMessage,
}: {
  status: FileUploadProcessStatus;
  error: boolean;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
}) => {
  const t = useTranslations("FileUpload.statusMessages");
  const messagesMap: { [key in FileUploadStatus]: string } = {
    queued: t("queued"),
    uploading: t("uploading"),
    scanning: t("scanning"),
    "post-upload": postUploadActionProgressMessage,
    complete: postUploadActionSuccessMessage || t("success"),
    error: t("error"),
    "scan-fail": t("scanFail"),
    "upload-error": t("uploadError"),
    "scan-error": t("scanError"),
    "post-upload-error": postUploadActionErrorMessage || t("postUploadError"),
  };

  if (status) {
    // const adjustedStatus =
    //   status === "error" ? errorStatuses.get(status) || "error" : status;
    const adjustedStatus = error
      ? (errorStatuses.get(status) as FileUploadStatus) || "error"
      : status;
    const statusMessageForDisplay = messagesMap[adjustedStatus];
    return (
      <div data-testid="file-upload-status-display">
        {statusMessageForDisplay}
      </div>
    );
  }
};
