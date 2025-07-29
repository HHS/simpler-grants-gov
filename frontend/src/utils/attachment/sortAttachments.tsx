import { AttachmentSortKey } from "src/types/attachment/attachmentSortKeyType";
import { Attachment } from "src/types/attachmentTypes";
import { SortDirection } from "src/types/sortDirectionType";

/**
 * Attachments Sort
 */

export function sortAttachments(
  attachments: Attachment[],
  sortBy: AttachmentSortKey,
  sortDirection: SortDirection,
): Attachment[] {
  return [...attachments].sort((a, b) => {
    const aValue =
      sortBy === "updated_at" ? new Date(a[sortBy]).getTime() : a[sortBy];
    const bValue =
      sortBy === "updated_at" ? new Date(b[sortBy]).getTime() : b[sortBy];

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}
