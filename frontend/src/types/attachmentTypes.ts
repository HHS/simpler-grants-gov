import { APIResponse } from "src/types/apiResponseTypes";

export type UploadStatus = "uploading" | "cancelled" | "completed" | "failed";

export type AttachmentUploadResponse = {
  application_attachment_id?: string;
};

export interface BasicAttachment {
  application_attachment_id: string;
  created_at: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  updated_at: string;
  status?: UploadStatus;
  cancelToken?: AbortController;
}

// note that in most cases the download_path may not actually available but we're typing things as Attachments for now and will deal with that later
export interface Attachment extends BasicAttachment {
  download_path: string;
}

export interface AttachmentCardItem extends Attachment {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
  abortController?: AbortController;
}

export interface AttachmentResponse extends APIResponse {
  data: Pick<
    Attachment,
    | "application_attachment_id"
    | "created_at"
    | "file_name"
    | "file_size_bytes"
    | "mime_type"
    | "updated_at"
    | "download_path"
  >[];
}
