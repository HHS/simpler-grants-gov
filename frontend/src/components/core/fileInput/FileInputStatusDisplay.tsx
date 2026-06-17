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
  // need to figure out how to disintguish between scan failure and scan error.
  // this will likely depend on the implementation of handling scan failures on the backend
  // Next API will return a specific error and we can return that error status before dealing with this map
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
    return <USWDSIcon name="error" />;
  }
  if (!status || status === "success") {
    return null;
  }

  return <Spinner />;
};

const ActionButton = ({ error, status, onDismiss, onCancel }) => {
  const t = useTranslations("FileInput.statusDisplay");
  if (error) {
    return (
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

  const messagesMap: { [key in FileUploadStatus]: string } = {
    queued: t("queued"),
    uploading: t("uploading"),
    "starting-scan": t("startingScan"),
    pending: t("scanning"),
    complete: t("scanComplete"),
    "scan-complete": t("scanComplete"),
    "post-upload": postUploadActionProgressMessage,
    success: postUploadActionSuccessMessage || t("success"),
    error: t("error"),
    "scan-fail": t("scanFail"),
    "upload-error": t("uploadError"),
    "scan-error": t("scanError"),
    "post-upload-error": postUploadActionErrorMessage || t("postUploadError"),
  };

  const adjustedStatus = error
    ? (errorStatuses.get(status) as FileUploadStatus) || "error"
    : status;
  const statusMessageForDisplay = messagesMap[adjustedStatus];

  console.log("** display value", statusMessageForDisplay);
  return (
    <GridContainer data-testid="file-upload-status-display">
      <Grid col={2}>
        <StatusIcon error={error} status={status} />
      </Grid>
      <Grid>
        <div className="text-bold">{fileName}</div>
        <div>{statusMessageForDisplay}</div>
      </Grid>
      <Grid col={3}>
        <ActionButton
          onDismiss={onDismiss}
          onCancel={onCancel}
          error={error}
          status={status}
        />
      </Grid>
    </GridContainer>
  );
};
