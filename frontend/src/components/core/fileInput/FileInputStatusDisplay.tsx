import {
  FileUploadProcessStatus,
  FileUploadStatus,
} from "src/types/fileUploadTypes";

import { useTranslations } from "next-intl";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

import Spinner from "src/components/core/Spinner";
import { USWDSIcon } from "src/components/core/USWDSIcon";

const errorStatuses = new Map([
  ["uploading", "upload-error"],
  ["scanning", "scan-error"],
  ["post-upload", "post-upload-error"],
]);

const scanFailureErrorPatterns = [
  /scan[\s-]?fail(ed)?/i,
  /infected/i,
  /malware/i,
  /virus/i,
];

const getErrorStatus = ({
  status,
  errorMessage,
}: {
  status: FileUploadProcessStatus;
  errorMessage?: string;
}): FileUploadStatus => {
  const scanFailed =
    status === "scanning" &&
    scanFailureErrorPatterns.some((pattern) =>
      pattern.test((errorMessage || "").toLowerCase()),
    );

  if (scanFailed) {
    return "scan-fail";
  }

  return (errorStatuses.get(status) as FileUploadStatus) || "error";
};

export const FileInputStatusDisplay = ({
  fileName,
  status,
  error,
  errorMessage,
  postUploadActionProgressMessage,
  postUploadActionSuccessMessage,
  postUploadActionErrorMessage,
  onCancel,
  onDismiss,
}: {
  fileName: string;
  onCancel: () => void;
  onDismiss: () => void;
  status?: FileUploadProcessStatus;
  error: boolean;
  errorMessage?: string;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
}) => {
  const t = useTranslations("FileUpload.statusDisplay");

  if (!status) {
    return;
  }

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

  const adjustedStatus = error
    ? getErrorStatus({ status, errorMessage })
    : status;
  const statusMessageForDisplay = messagesMap[adjustedStatus];

  const ActionButton = error ? (
    <Button
      type="button"
      unstyled
      onClick={() => {
        void onDismiss();
      }}
    >
      <USWDSIcon
        className="usa-icon margin-right-05 margin-left-neg-05"
        name="error"
      />
      {t("dismiss")}
    </Button>
  ) : (
    <Button
      type="button"
      unstyled
      onClick={() => {
        void onCancel();
      }}
    >
      <USWDSIcon
        className="usa-icon margin-right-05 margin-left-neg-05"
        name="close"
      />
      {t("cancel")}
    </Button>
  );
  const IconDisplay = error ? <USWDSIcon name="error" /> : <Spinner />;
  return (
    <GridContainer data-testid="file-upload-status-display">
      <Grid col={2}>{IconDisplay}</Grid>
      <Grid>
        <div className="text-bold">{fileName}</div>
        <div>{statusMessageForDisplay}</div>
      </Grid>
      <Grid col={3}>{ActionButton}</Grid>
    </GridContainer>
  );
};
