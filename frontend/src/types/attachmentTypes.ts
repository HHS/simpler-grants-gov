import { APIResponse } from "src/types/apiResponseTypes";

export type UploadStatus = "uploading" | "cancelled" | "completed" | "failed";

export type AttachmentUploadResponse = {
  application_attachment_id?: string;
};

export interface Attachment {
  application_attachment_id: string;
  download_path: string;
  created_at: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  updated_at: string;
  status?: UploadStatus;
  cancelToken?: AbortController;
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
