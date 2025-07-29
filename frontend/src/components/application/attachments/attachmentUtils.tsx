import { AttachmentSortKey } from "src/types/attachment/attachmentSortKeyType";
import { Attachment, AttachmentCardItem } from "src/types/attachmentTypes";
import { SortDirection } from "src/types/sortDirectionType";
import { v4 as uuidv4 } from "uuid";

/**
 * Attachments Temp
 */

export const createTempAttachment = (
  file: File,
  controller: AbortController,
): { tempId: string; tempAttachment: AttachmentCardItem } => {
  const tempId = uuidv4();
  const tempAttachment: AttachmentCardItem = {
    id: tempId,
    file,
    application_attachment_id: tempId,
    file_name: file.name,
    file_size_bytes: file.size,
    updated_at: new Date().toISOString(),
    status: "uploading",
    cancelToken: controller,
  } as AttachmentCardItem;

  return { tempId, tempAttachment };
};

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
