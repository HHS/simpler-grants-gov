"use client";

import {
  useAttachmentsList,
  useDeletingIds,
  useFileInputRef,
  useUploadAttachment,
} from "src/context/application/AttachmentsContext";
import { Attachment } from "src/types/attachmentTypes";
import { formatFileSize } from "src/utils/formatFileSizeUtil";

import { useTranslations } from "next-intl";
import { DragEvent, FormEvent, useMemo, useRef, useState } from "react";
import {
  Button,
  FileInput,
  Grid,
  GridContainer,
  Link,
  ModalRef,
  Table,
} from "@trussworks/react-uswds";

import { AttachmentDeleteButton } from "src/components/application/attachments/AttachmentDeleteButton";
import { AttachmentDeleteModal } from "src/components/application/attachments/AttachmentDeleteModal";
import { FormattedDate } from "src/components/application/attachments/FormattedDate";
import { NoAttachmentsEmptyTableRow } from "src/components/application/attachments/NoAttachmentsEmptyTableRow";
import { PopoverMenu } from "src/components/PopoverMenu";
import Spinner from "src/components/Spinner";
import { USWDSIcon } from "src/components/USWDSIcon";

type SortKey = "file_name" | "file_size_bytes" | "updated_at";

const AttachmentsCard = () => {
  const [sortBy, setSortBy] = useState<SortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const uploadAttachment = useUploadAttachment();
  const attachments = useAttachmentsList();
  const fileInputRef = useFileInputRef();

  const deletingIds = useDeletingIds();

  const t = useTranslations("Application.attachments");

  const modalRef = useRef<ModalRef>(null);

  const sortedAttachments = useMemo(() => {
    return [...attachments].sort((a, b) => {
      const aTyped = a;
      const bTyped = b;
      const aVal = aTyped[sortBy];
      const bVal = bTyped[sortBy];

      const aComparable =
        sortBy === "updated_at" ? new Date(aVal as string).getTime() : aVal;
      const bComparable =
        sortBy === "updated_at" ? new Date(bVal as string).getTime() : bVal;

      if (aComparable < bComparable) return sortDirection === "asc" ? -1 : 1;
      if (aComparable > bComparable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [attachments, sortBy, sortDirection]);

  const handleUpload = async (file: File) => await uploadAttachment(file);

  const handleAttachmentUpload = async (e: FormEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;
    await handleUpload(files[0]);
  };

  const handleAttachmentDrop = async (event: DragEvent) => {
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    await handleUpload(files[0]);
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
      <GridContainer data-testid="opportunity-card" className="padding-x-2">
        <h3 className="margin-top-3">{t("attachments")}</h3>
        <Grid row gap>
          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            {t("attachmentsInstructions")}
          </Grid>
          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            <FileInput
              id="application-attachment-upload"
              name="application-attachment-upload"
              onChange={(e) => handleAttachmentUpload(e) as unknown as void}
              onDrop={(e) => handleAttachmentDrop(e) as unknown as void}
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
                <TableHeader value="action" />
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
                      {/*
                       * file is in the process of loading
                       */}

                      {file.status === "uploading" && (
                        <Button
                          className=" usa-button--unstyled"
                          type="button"
                          onClick={() => handleCancelUpload(file)}
                        >
                          <USWDSIcon name="close" /> {t("cancelUpload")}
                        </Button>
                      )}

                      {/*
                       * file is in the process of deleting
                       */}
                      {deletingIds.has(file.application_attachment_id) &&
                        t("deleting")}

                      {/*
                       * we do not want to see the dropdown if the file is in the
                       * process of uploading or downloading
                       */}

                      {file.status !== "uploading" &&
                        !deletingIds.has(file.application_attachment_id) && (
                          <>
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
                          </>
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
