"use client";

import { Attachment } from "src/types/attachmentTypes";

import { useTranslations } from "next-intl";
import { FileInput, Grid, GridContainer, Table } from "@trussworks/react-uswds";

interface AttachmentsCardProps {
  attachments: Attachment[];
}

export const AttachmentsCard = ({ attachments }: AttachmentsCardProps) => {
  const t = useTranslations("Application.attachments");

  const FileListTable = () => {
    return (
      <tbody>
        {attachments.map((file) => {
          return (
            <tr>
              <td>{file.file_name}</td>
              <td>-</td>
              <td>{file.file_size_bytes}</td>
              <td>{file.updated_at}</td>
              <td>-</td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  const EmptyTable = () => {
    return (
      <tbody>
        <tr>
          <td>{t("emptyTable")}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
      </tbody>
    );
  };

  return (
    <GridContainer
      data-testid="opportunity-card"
      className="padding-x-2"
    >
      <h3 className="margin-top-2">{t("attachments")}</h3>
      <Grid row gap>
        <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
          {t("attachmentsInstructions")}
        </Grid>
        <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
          <FileInput
            name="application-file-attachments"
            id="attachments-upload"
          />
        </Grid>
      </Grid>

      <Grid row>
        <Table className="width-full overflow-wrap">
          <thead>
            <tr>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("attachedDocument")}
              </th>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("action")}
              </th>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("fileSize")}
              </th>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("uploadDate")}
              </th>
              <th scope="col" className="bg-base-lightest padding-y-205">
                {t("uploadBy")}
              </th>
            </tr>
          </thead>
          {attachments.length ? <FileListTable /> : <EmptyTable />}
        </Table>
      </Grid>
    </GridContainer>
  );
};
