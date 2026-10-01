import { UploadFileMetadata } from "src/types/fileUploadTypes";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";

// OpportunityAttachment has no updated_at (only created_at) and no download_path
// (deferred to V2), unlike the apply-form Attachment type this mirrors.
const toFileMetadata = (
  attachment: OpportunityAttachment,
): UploadFileMetadata => ({
  id: attachment.opportunity_attachment_id,
  fileName: attachment.file_name,
  fileSize: attachment.file_size,
  mimeType: attachment.mime_type,
  updatedAt: attachment.created_at,
});

export const mapOpportunityAttachmentsToFileMetadata = (
  attachments: OpportunityAttachment[],
): UploadFileMetadata[] =>
  attachments.map((attachment) => toFileMetadata(attachment));
