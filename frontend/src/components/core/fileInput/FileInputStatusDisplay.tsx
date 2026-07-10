import clsx from "clsx";
import {
  FileUploadProcessStatus,
  FileUploadStatus,
} from "src/types/fileUploadTypes";

import { useTranslations } from "next-intl";
import { Button, Grid } from "@trussworks/react-uswds";

import Spinner from "src/components/core/Spinner";
import { USWDSIcon } from "src/components/core/USWDSIcon";

// maps upload statuses to the error message to show if error occurs while in those statuses
const errorStatuses = new Map([
  ["queued", "pre-upload-error"],
  ["uploading", "upload-error"],
  ["infected", "infected"],
  ["pending", "scan-error"],
  ["starting-scan", "scan-error"],
  ["complete", "file-id-error"], // assuming that any error in this state is due to a missing file id
  ["post-upload", "post-upload-error"],
]);

// if there's an error show the error icon
// if upload is in progress, show a spinner
// otherwise show nothing
const StatusIcon = ({
  error,
  status,
}: {
  status?: FileUploadProcessStatus;
  error: boolean;
}) => {
  if (error) {
    return (
      <USWDSIcon
        name="error"
        className="usa-icon--size-6 text-middle text-error-dark"
      />
    );
  }
  if (!status) {
    return null;
  }

  if (status === "success") {
    return (
      <USWDSIcon
        name="file_present"
        className="usa-icon--size-6 text-middle text-primary-dark"
      />
    );
  }

  return (
    <div className="display-flex">
      <Spinner />
    </div>
  );
};

const ActionButton = ({
  error,
  status,
  onDismiss,
  onCancel,
}: {
  error: boolean;
  status: FileUploadProcessStatus;
  onCancel: () => void;
  onDismiss: () => void;
}) => {
  const t = useTranslations("FileInput.statusDisplay");
  if (error) {
    return (
      <Button
        type="button"
        unstyled
        onClick={() => {
          void onDismiss();
        }}
        className="text-error-dark"
      >
        <USWDSIcon
          className="usa-icon margin-right-05 margin-left-neg-05"
          name="close"
        />
        {t("dismiss")}
      </Button>
    );
  }
  if (!status || status === "success") {
    return null;
  }

  return (
    <Button
      type="button"
      unstyled
      onClick={() => {
        void onCancel();
      }}
      className="text-error-dark"
    >
      <USWDSIcon
        className="usa-icon margin-right-05 margin-left-neg-05"
        name="close"
      />
      {t("cancel")}
    </Button>
  );
};

export const FileInputStatusDisplay = ({
  fileName,
  status,
  error,
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
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
}) => {
  const t = useTranslations("FileInput.statusDisplay");

  if (!status) {
    return;
  }

  // this relies on some magic strings, it's not great!
  // refactor this to be more flexible in terms of tracking progress
  const messagesMap: { [key in FileUploadStatus]: string } = {
    queued: t("queued"),
    uploading: t("uploading"),
    "starting-scan": t("startingScan"),
    pending: t("scanning"),
    infected: t("infected"),
    complete: t("scanComplete"),
    "scan-complete": t("scanComplete"),
    "post-upload": postUploadActionProgressMessage,
    success: postUploadActionSuccessMessage || t("success"),
    error: t("error"),
    "upload-error": t("uploadError"),
    "scan-error": t("scanError"),
    "file-id-error": t("missingFileId"),
    "pre-upload-error": t("preUploadError"),
    "post-upload-error": postUploadActionErrorMessage || t("postUploadError"),
  };

  const adjustedStatus = error
    ? (errorStatuses.get(status) as FileUploadStatus) || "error"
    : status;
  const statusMessageForDisplay = messagesMap[adjustedStatus];
  return (
    <div className="margin-x-3">
      <Grid
        row
        gap
        data-testid="file-upload-status-display"
        className={clsx({
          "bg-base-lightest": status === "success",
          "bg-secondary-lightest": !error && status !== "success",
          "bg-error-lighter": !!error,
          "border-left-1": !!error,
          "border-error-dark": !!error,
          "padding-2": true,
          "margin-top-2": true,
        })}
      >
        <Grid col={"auto"} className="display-flex flex-align-center">
          <StatusIcon error={error} status={status} />
        </Grid>
        <Grid col={"fill"}>
          <div className="text-bold">{fileName}</div>
          <div>{statusMessageForDisplay}</div>
        </Grid>
        <Grid col={"auto"} className="display-flex">
          <ActionButton
            onDismiss={onDismiss}
            onCancel={onCancel}
            error={error}
            status={status}
          />
        </Grid>
      </Grid>
    </div>
  );
};
