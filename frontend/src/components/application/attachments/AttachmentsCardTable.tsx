"use client";

import { Attachment, AttachmentCardItem } from "src/types/attachmentTypes";
import { formatDateTime } from "src/utils/dateUtil";
import { formatFileSize } from "src/utils/fileUtils/formatFileSizeUtil";
import { useTranslations } from "use-intl";

import { RefObject } from "react";
import { Link, ModalRef, Table } from "@trussworks/react-uswds";

import {
  SortDirection,
  SortKey,
} from "src/components/application/attachments/attachmentUtils";
import { PopoverMenu } from "src/components/PopoverMenu";
import { AttachmentsCardTableHeaders } from "./AttachmentsCardTableHeaders";
import { AttachmentsCardTableRowDeleting } from "./AttachmentsCardTableRowDeleting";
import { AttachmentsCardTableRowEmpty } from "./AttachmentsCardTableRowEmpty";
import { AttachmentsCardTableRowUploading } from "./AttachmentsCardTableRowUploading";
import { DeleteAttachmentButton } from "./DeleteAttachmentButton";

interface Props {
  attachments: Attachment[];
  deleteAttachmentModalRef: RefObject<ModalRef | null>;
  handleAttachmentSort: (column: SortKey) => void;
  handleCancelUpload: (uploadId: string) => void;
  handleDeleteAttachment: (
    application_attachment_id: string,
    attachmentToDeleteName: string,
  ) => void;
  isDeleting: boolean;
  sortBy: SortKey;
  sortDirection: SortDirection;
  uploads: AttachmentCardItem[];
}

export const AttachmentsCardTable = ({
  attachments,
  deleteAttachmentModalRef,
  handleAttachmentSort,
  handleCancelUpload,
  handleDeleteAttachment,
  isDeleting,
  sortBy,
  sortDirection,
  uploads,
}: Props) => {
  const t = useTranslations("Application.attachments");

  return (
    <Table className="application-attachments-table width-full overflow-wrap">
      <AttachmentsCardTableHeaders
        handleAttachmentSort={handleAttachmentSort}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
      <tbody>
        {isDeleting ? <AttachmentsCardTableRowDeleting /> : null}
        {uploads.map((upload) =>
          upload.status === "uploading" ? (
            <AttachmentsCardTableRowUploading
              key={upload.id}
              attachment={upload}
              onCancel={handleCancelUpload}
            />
          ) : null,
        )}

        {attachments.length ? (
          attachments.map((file) => (
            <tr key={file.application_attachment_id}>
              <td suppressHydrationWarning>{file.file_name}</td>
              <td>
                <PopoverMenu>
                  {file.download_path && (
                    <Link download href={file.download_path}>
                      {t("download")}
                    </Link>
                  )}

                  <DeleteAttachmentButton
                    file={file}
                    buttonText={t("delete")}
                    handleDeleteAttachment={handleDeleteAttachment}
                    modalRef={deleteAttachmentModalRef}
                  />
                </PopoverMenu>
              </td>
              <td>{formatFileSize(file.file_size_bytes)}</td>
              <td>{formatDateTime(file.updated_at)}</td>
            </tr>
          ))
        ) : (
          <AttachmentsCardTableRowEmpty />
        )}
      </tbody>
    </Table>
  );
};
