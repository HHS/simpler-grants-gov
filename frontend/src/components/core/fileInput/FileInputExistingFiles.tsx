import { UploadFileMetadata } from "src/types/fileUploadTypes";
import { formatDate } from "src/utils/dateUtil";
import { formatFileSize } from "src/utils/fileUtils/formatFileSizeUtil";

import { useTranslations } from "next-intl";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/core/USWDSIcon";

export const FileInputExistingFiles = ({
  existingFiles,
  onDelete,
}: {
  existingFiles?: UploadFileMetadata[];
  onDelete: (fileId: string) => Promise<unknown>;
}) => {
  const t = useTranslations("FileInput.existingFiles");
  if (existingFiles && existingFiles.length) {
    const existingFilesList = existingFiles.map((existingFile) => {
      const fileSizeDisplay = existingFile.fileSize
        ? `${formatFileSize(existingFile.fileSize)} | `
        : "";
      const timestampDisplay = `${t("savedOn")} ${formatDate(existingFile.updatedAt.toString())}`;
      return (
        <GridContainer key={existingFile.id}>
          <Grid col={2}>
            <USWDSIcon name="file_present" />
          </Grid>
          <Grid>
            <div className="text-bold">{existingFile.fileName}</div>
            <div>
              {fileSizeDisplay}
              {timestampDisplay}
            </div>
          </Grid>
          <Grid col={3}>
            <Button
              type="button"
              unstyled
              onClick={() => {
                void onDelete(existingFile.id);
              }}
            >
              <USWDSIcon
                className="usa-icon margin-right-05 margin-left-neg-05"
                name="delete"
              />
              {t("delete")}
            </Button>
          </Grid>
        </GridContainer>
      );
    });
    return (
      <div data-testid="file-input-existing-files">{existingFilesList}</div>
    );
  }
};
