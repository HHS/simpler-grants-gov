"use client";

import { AttachmentDeleteButton } from "src/features/attachments/components/AttachmentDeleteButton";
import { AttachmentDeleteModal } from "src/features/attachments/components/AttachmentDeleteModal";
import { FormattedDate } from "src/features/attachments/components/FormattedDate";
import { NoAttachmentsEmptyTableRow } from "src/features/attachments/components/NoAttachmentsEmptyTableRow";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";
import { useAttachmentUpload } from "src/features/attachments/hooks/useAttachmentUpload";
import { Attachment } from "src/types/attachmentTypes";
import { formatFileSize } from "src/utils/formatFileSizeUtil";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import {
  Button,
  FileInput,
  Grid,
  GridContainer,
  Link,
  ModalRef,
  Table,
} from "@trussworks/react-uswds";

import { PopoverMenu } from "src/components/PopoverMenu";
import Spinner from "src/components/Spinner";
import { USWDSIcon } from "src/components/USWDSIcon";

type SortKey = "file_name" | "file_size_bytes" | "updated_at";
type SortDirection = "asc" | "desc";

const AttachmentsCard = () => {
  const [sortBy, setSortBy] = useState<SortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Get upload function and context state
  const { uploadAttachment } = useAttachmentUpload();
  const { attachments, fileInputRef, deletingIds } = useAttachmentsContext();

  const t = useTranslations("Application.attachments");

  const modalRef = useRef<ModalRef>(null);

  const sortedAttachments = useMemo(() => {
    return [...attachments].sort((a, b) => {
      const aComparable =
        sortBy === "updated_at" ? new Date(a[sortBy]).getTime() : a[sortBy];
      const bComparable =
        sortBy === "updated_at" ? new Date(b[sortBy]).getTime() : b[sortBy];

      if (aComparable < bComparable) return sortDirection === "asc" ? -1 : 1;
      if (aComparable > bComparable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [attachments, sortBy, sortDirection]);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    return uploadAttachment(files[0]);
  };

  const handleCancelUpload = (attachment: Attachment) => {
    attachment.cancelToken?.abort();
  };

  const TableHeader = ({
    isSortable = false,
    sortKey,
    value,
  }: {
    isSortable?: boolean;
    sortKey?: SortKey;
    value: string;
  }) => (
    <th
      {...(isSortable ? { "data-sortable": null } : {})}
      scope="col"
      className={`bg-base-lightest padding-y-205 ${isSortable ? "cursor-pointer" : ""}`}
      onClick={() => sortKey && handleSort(sortKey)}
    >
      {value}{" "}
      {sortBy === sortKey ? (sortDirection === "asc" ? "↑" : "↓") : null}
    </th>
  );

  const handleSort = (column: SortKey) => {
    if (column === sortBy) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  return (
    <>
      <GridContainer data-testid="opportunity-card" className="padding-x-0">
        <h3 className="margin-top-4">{t("attachments")}</h3>
        <Grid row gap>
          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            {t("attachmentsInstructions")}
          </Grid>
          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            <FileInput
              id="application-attachment-upload"
              name="application-attachment-upload"
              onChange={(e) => {
                const files = e.currentTarget.files;
                handleUpload(files || null);
              }}
              onDrop={(e) => {
                const files = e.dataTransfer.files;
                handleUpload(files);
              }}
              ref={fileInputRef}
            />
          </Grid>
        </Grid>
        <Grid row>
          <Table className="application-attachments-table width-full overflow-wrap">
            <thead>
              <tr>
                <TableHeader
                  isSortable
                  sortKey="file_name"
                  value={t("attachedDocument")}
                />
                <TableHeader value={t("action")} />
                <TableHeader
                  isSortable
                  sortKey="file_size_bytes"
                  value={t("fileSize")}
                />
                <TableHeader
                  isSortable
                  sortKey="updated_at"
                  value={t("uploadDate")}
                />
              </tr>
            </thead>
            <tbody>
              {sortedAttachments.length ? (
                sortedAttachments.map((file) => (
                  <tr
                    className={
                      file.status === "uploading" ||
                      deletingIds.has(file.application_attachment_id)
                        ? "highlight"
                        : undefined
                    }
                    key={file.application_attachment_id}
                  >
                    <td>
                      {file.status === "uploading" && (
                        <Spinner className="sm" />
                      )}{" "}
                      {file.file_name}
                    </td>
                    <td>
                      {file.status === "uploading" && (
                        <Button
                          className=" usa-button--unstyled"
                          type="button"
                          onClick={() => handleCancelUpload(file)}
                        >
                          <USWDSIcon name="close" /> {t("cancelUpload")}
                        </Button>
                      )}

                      {deletingIds.has(file.application_attachment_id) &&
                        t("deleting")}

                      {file.status !== "uploading" &&
                        !deletingIds.has(file.application_attachment_id) && (
                          <PopoverMenu>
                            {file.download_path && (
                              <Link download href={file.download_path}>
                                {t("download")}
                              </Link>
                            )}
                            <AttachmentDeleteButton
                              file={file}
                              buttonText={t("delete")}
                              modalRef={modalRef}
                            />
                          </PopoverMenu>
                        )}
                    </td>
                    <td>
                      {file.status !== "uploading" &&
                      !deletingIds.has(file.application_attachment_id)
                        ? formatFileSize(file.file_size_bytes)
                        : "--"}
                    </td>
                    <td>
                      {file.status !== "uploading" &&
                      !deletingIds.has(file.application_attachment_id) ? (
                        <FormattedDate date={file.updated_at} />
                      ) : (
                        "--"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <NoAttachmentsEmptyTableRow />
              )}
            </tbody>
          </Table>
        </Grid>
      </GridContainer>
      <AttachmentDeleteModal
        modalId="attachment-delete-modal"
        titleText={t("deleteModal.titleText")}
        descriptionText={t("deleteModal.descriptionText")}
        cancelCtaText={t("deleteModal.cancelDeleteCta")}
        buttonCtaText={t("deleteModal.deleteFileCta")}
        modalRef={modalRef}
      />
    </>
  );
};

export { AttachmentsCard };
