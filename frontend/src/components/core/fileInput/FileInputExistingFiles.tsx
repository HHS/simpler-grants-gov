import { UploadFileMetadata } from "src/types/fileUploadTypes";
import { formatDateWithNoPreformattedExpectations } from "src/utils/dateUtil";
import { formatFileSize } from "src/utils/fileUtils/formatFileSizeUtil";

import { useTranslations } from "next-intl";
import { Button, Grid } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/core/USWDSIcon";

export const FileInputExistingFiles = ({
  existingFiles,
  onDelete,
  disabled = false,
  filesWithDeleteError = [] as string[],
}: {
  existingFiles?: UploadFileMetadata[];
  onDelete: (fileToDelete: UploadFileMetadata) => void;
  disabled?: boolean;
  filesWithDeleteError?: string[];
}) => {
  const t = useTranslations("FileInput.existingFiles");
  if (existingFiles && existingFiles.length) {
    const existingFilesList = existingFiles.map((existingFile, index) => {
      const fileSizeDisplay = existingFile.fileSize
        ? `${formatFileSize(existingFile.fileSize)} | `
        : "";
      const hasError = filesWithDeleteError.findIndex(
        (fileWithDeleteError) => fileWithDeleteError === existingFile.id,
      );
      // a file can be listed before its server metadata is available, so the timestamp is
      // omitted rather than rendered as "Invalid Date"
      const updatedAtDate = existingFile.updatedAt
        ? new Date(existingFile.updatedAt)
        : undefined;
      const timestampDisplay =
        updatedAtDate && !Number.isNaN(updatedAtDate.valueOf())
          ? `${t("savedOn")} ${formatDateWithNoPreformattedExpectations(updatedAtDate)}`
          : "";
      return (
        <div
          key={`${existingFile.id}-${index}`}
          className="bg-base-lightest padding-2 margin-top-2"
        >
          {hasError > -1 ? (
            <Grid
              row
              className="text-error-dark text-bold margin-bottom-2 margin-left-1"
            >
              {t("deleteError")}
            </Grid>
          ) : null}
          <Grid gap row>
            <Grid col={"auto"}>
              <USWDSIcon
                name="file_present"
                className="usa-icon--size-6 text-middle text-primary-dark"
              />
            </Grid>
            <Grid col={"fill"}>
              <div className="text-bold">{existingFile.fileName}</div>
              <div>
                {fileSizeDisplay}
                {timestampDisplay}
              </div>
            </Grid>
            <Grid col={"auto"} className="display-flex">
              <Button
                type="button"
                unstyled
                disabled={disabled}
                onClick={() => {
                  void onDelete(existingFile);
                }}
              >
                <USWDSIcon
                  className="usa-icon margin-right-05 margin-left-neg-05 usa-icon--size-3"
                  name="delete"
                />
                {t("delete")}
              </Button>
            </Grid>
          </Grid>
        </div>
      );
    });
    return (
      <div data-testid="file-input-existing-files" className="margin-x-3">
        {existingFilesList}
      </div>
    );
  }
};
