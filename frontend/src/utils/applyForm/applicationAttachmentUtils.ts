import { Attachment } from "src/types/attachmentTypes";
import { UploadFileMetadata } from "src/types/fileUploadTypes";

export const ApplicationAttachmentStatus = {
  uploading: "Uploading...",
  error:
    "Processing failed due to a system error. Try uploading your file again.",
  success: "Success: File scan complete.  “Save” this form to attach the file.",
};

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
