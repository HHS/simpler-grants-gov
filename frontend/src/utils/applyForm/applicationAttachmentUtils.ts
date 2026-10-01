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

export const parseAttachmentIds = (value: unknown): string[] => {
  const isStringArray = (candidate: unknown): candidate is string[] =>
    Array.isArray(candidate) &&
    candidate.every((item) => typeof item === "string");

  if (isStringArray(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    console.warn(
      "Multiple attachment field received a non-string array value:",
      value,
    );
    return [];
  }

  if (typeof value === "string") {
    if (!value.trim()) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(value);
      if (isStringArray(parsed)) {
        return parsed;
      }
    } catch {
      console.warn(
        "Multiple attachment field received an invalid JSON string value:",
        value,
      );
    }
  }

  return [];
};

/*
  Both the label and the field errors describe the input, so a failing validation on a
  titled field must reference both ids. An untitled field renders no label element at all
  (DynamicFieldLabel returns null), so omitting its id avoids a dangling aria-describedby.
*/
export const buildAttachmentDescribedByIds = ({
  visibleInputId,
  hasTitle,
  hasError,
}: {
  visibleInputId: string;
  hasTitle: boolean;
  hasError: boolean;
}): string[] => {
  const describedByIds: string[] = [];
  if (hasTitle) {
    describedByIds.push(`label-for-${visibleInputId}`);
  }
  if (hasError) {
    describedByIds.push(`error-for-${visibleInputId}`);
  }
  return describedByIds;
};
