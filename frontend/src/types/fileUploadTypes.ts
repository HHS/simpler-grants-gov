export const fileUploadProcessStatus = [
  "queued",
  "uploading",
  "starting-scan",
  "pending", // API supplied status while undergoing virus scan
  "scan-complete", // Synthetic status used for sending back pending file id, same visually as "complete"
  "complete", // API supplied status for complete virus scan
  "post-upload",
  "success",
  "infected", // technically an error state, but it will be returned directly from the API so we need to treat it this way for now
] as const;

export type FileUploadProcessStatus = (typeof fileUploadProcessStatus)[number];

export type FileUploadErrorStatus =
  | "error"
  | "upload-error"
  | "pre-upload-error"
  | "file-id-error"
  | "scan-error"
  | "post-upload-error";

export type FileUploadStatus = FileUploadErrorStatus | FileUploadProcessStatus;
// maybe we can dynamically type this later
export type PostUploadAction = (
  fileId: string,
  signal: AbortSignal,
) => Promise<unknown>;
export type UploadFileMetadata = {
  id: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  downloadUrl?: string;
  updatedAt: string;
};

export type FileUploadStatusUpdate = {
  status?: FileUploadStatus;
  error?: string;
  pendingFileId?: string;
};
