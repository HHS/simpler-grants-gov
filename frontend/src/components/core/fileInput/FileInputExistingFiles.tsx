import { UploadFileMetadata } from "src/types/fileUploadTypes";
import { formatDateWithNoPreformattedExpectations } from "src/utils/dateUtil";
import { formatFileSize } from "src/utils/fileUtils/formatFileSizeUtil";

import { useTranslations } from "next-intl";
import { Button, Grid } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/core/USWDSIcon";

export const FileInputExistingFiles = ({
  existingFiles,
  onDelete,
  filesWithDeleteError = [] as string[],
}: {
  existingFiles?: UploadFileMetadata[];
  onDelete: (fileToDelete: UploadFileMetadata) => void;
  filesWithDeleteError?: string[];
}) => {
  const t = useTranslations("FileInput.existingFiles");
  if (existingFiles && existingFiles.length) {
    const existingFilesList = existingFiles.map((existingFile) => {
      const fileSizeDisplay = existingFile.fileSize
        ? `${formatFileSize(existingFile.fileSize)} | `
        : "";
      const hasError = filesWithDeleteError.findIndex(
        (fileWithDeleteError) => fileWithDeleteError === existingFile.id,
      );
      // depending on how this comes back from the API we may want do something different in terms of date formatting
      const timestampDisplay = `${t("savedOn")} ${formatDateWithNoPreformattedExpectations(new Date(existingFile.updatedAt))}`;
      return (
        <Grid
          key={existingFile.id}
          gap
          row
          className="bg-base-lightest padding-2 margin-top-2"
        >
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
          {hasError > -1 ? <div>{t("deleteError")}</div> : null}
        </Grid>
      );
    });
    return (
      <div data-testid="file-input-existing-files" className="margin-x-3">
        {existingFilesList}
      </div>
    );
  }
};
