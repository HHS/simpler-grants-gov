import { AttachmentCardItem } from "src/types/attachmentTypes";
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
