import { Attachment } from "src/types/attachmentTypes";
import { UploadFileMetadata } from "src/types/fileUploadTypes";

const toFileMetadata = (attachment: Attachment): UploadFileMetadata => ({
  id: attachment.application_attachment_id,
  fileName: attachment.file_name,
  fileSize: attachment.file_size_bytes,
  mimeType: attachment.mime_type,
  updatedAt: attachment.updated_at,
  downloadUrl: attachment.download_path,
});

export const mapAttachmentsToFileMetadata = (
  attachments: Attachment[],
): UploadFileMetadata[] =>
  attachments.map((attachment) => toFileMetadata(attachment));
