"use client";

import { AttachmentSortKey } from "src/types/attachment/attachmentSortKeyType";
import { Attachment, AttachmentCardItem } from "src/types/attachmentTypes";
import { SortDirection } from "src/types/sortDirectionType";
import { sortAttachments } from "src/utils/attachment/sortAttachments";
import { formatDateTime } from "src/utils/dateUtil";
import { formatFileSize } from "src/utils/fileUtils/formatFileSizeUtil";
import { useTranslations } from "use-intl";

import { RefObject, useMemo, useState } from "react";
import { Link, ModalRef, Table } from "@trussworks/react-uswds";

import { PopoverMenu } from "src/components/PopoverMenu";
import { AttachmentsCardTableHeaders } from "./AttachmentsCardTableHeaders";
import { AttachmentsCardTableRowDeleting } from "./AttachmentsCardTableRowDeleting";
import { AttachmentsCardTableRowEmpty } from "./AttachmentsCardTableRowEmpty";
import { AttachmentsCardTableRowUploading } from "./AttachmentsCardTableRowUploading";
import { DeleteAttachmentButton } from "./DeleteAttachmentButton";

interface Props {
  attachments: Attachment[];
  attachmentIdsToDelete: Set<string>;
  deleteAttachmentModalRef: RefObject<ModalRef | null>;
  handleCancelUpload: (uploadId: string) => void;
  isDeleting: boolean;
  markAttachmentForDeletion: (
    application_attachment_id: string,
    attachmentToDeleteName: string,
  ) => void;
  uploads: AttachmentCardItem[];
}

export const AttachmentsCardTable = ({
  attachments,
  attachmentIdsToDelete,
  deleteAttachmentModalRef,
  handleCancelUpload,
  isDeleting,
  markAttachmentForDeletion,
  uploads,
}: Props) => {
  const t = useTranslations("Application.attachments");

  /**
   * Local state
   */

  const [sortBy, setSortBy] = useState<AttachmentSortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedAttachments = useMemo(() => {
    const sorted = sortAttachments(attachments, sortBy, sortDirection);
    return sorted.filter(
      (file) => !attachmentIdsToDelete.has(file.application_attachment_id),
    );
  }, [attachments, sortBy, sortDirection, attachmentIdsToDelete]);

  /**
   * Attachment Sorting
   */
  const handleAttachmentSort = (column: AttachmentSortKey) => {
    if (column === sortBy) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

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

        {sortedAttachments.length ? (
          sortedAttachments.map((file) => (
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
                    markAttachmentForDeletion={markAttachmentForDeletion}
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
