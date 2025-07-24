"use client";

import { useTranslations } from "use-intl";

import {
  SortDirection,
  SortKey,
} from "src/components/application/attachments/attachmentUtils";
import { TableHeader } from "src/components/TableHeader";

interface Props {
  handleAttachmentSort: (column: SortKey) => void;
  sortBy: SortKey;
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
        <TableHeader<SortKey>
          isSortable
          sortKey="file_name"
          value={t("attachedDocument")}
          currentSortKey={sortBy}
          currentSortDirection={sortDirection}
          onSort={handleAttachmentSort}
        />
        <TableHeader value={t("action")} />
        <TableHeader<SortKey>
          isSortable
          sortKey="file_size_bytes"
          value={t("fileSize")}
          currentSortKey={sortBy}
          currentSortDirection={sortDirection}
          onSort={handleAttachmentSort}
        />
        <TableHeader<SortKey>
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
