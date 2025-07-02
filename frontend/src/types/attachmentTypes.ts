import { APIResponse } from "src/types/apiResponseTypes";

export interface Attachment {
  application_attachment_id: string;
  download_path: string;
  created_at: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  updated_at: string;
  status?: "uploading" | "completed" | "failed";
  cancelToken?: AbortController;
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
  >;
}
