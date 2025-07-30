"use client";

import { AttachmentSortKey } from "src/types/attachment/attachmentSortKeyType";
import { SortDirection } from "src/types/sortDirectionType";
import { useTranslations } from "use-intl";

import { TableHeader } from "src/components/TableHeader";

interface Props {
  handleAttachmentSort: (column: AttachmentSortKey) => void;
  sortBy: AttachmentSortKey;
  sortDirection: SortDirection;
}

export const AttachmentsCardTableHeaders = ({
  handleAttachmentSort,
  sortBy,
  sortDirection,
}: Props) => {
  const t = useTranslations("Application.attachments");

  return (
    <thead>
      <tr>
        <TableHeader
          isSortable
          sortKey="file_name"
          value={t("attachedDocument")}
          currentSortKey={sortBy}
          currentSortDirection={sortDirection}
          onSort={handleAttachmentSort}
        />
        <TableHeader value={t("action")} />
        <TableHeader
          isSortable
          sortKey="file_size_bytes"
          value={t("fileSize")}
          currentSortKey={sortBy}
          currentSortDirection={sortDirection}
          onSort={handleAttachmentSort}
        />
        <TableHeader
          isSortable
          sortKey="updated_at"
          value={t("uploadDate")}
          currentSortKey={sortBy}
          currentSortDirection={sortDirection}
          onSort={handleAttachmentSort}
        />
      </tr>
    </thead>
  );
};
