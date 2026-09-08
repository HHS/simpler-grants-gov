export const fileUploadProcessStatus = [
  "processing", // before receiving any update from backend, time spent reading file data on server
  "starting", // fetching s3 upload metadata
  "uploading", // uploading file to s3
  "starting-scan", // making request for scan status, no status yet received from API
  "pending", // received scan status from API but scan not yet started
  "in_progress", // API supplied status while undergoing virus scan
  "scan-complete", // Synthetic status used for sending back pending file id, same visually as "complete"
  "complete", // API supplied status for complete virus scan
  "post-upload",
  "success",
  "infected", // technically an error state, but it will be returned directly from the API so we need to treat it this way for now
  "too-large", // client side error state for files that exceed specified max file size
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

// shape of the "file_metadata" object nested in the API's file-scan-results stream,
// null until the scan status is "complete"
export type FileResultsMetadata = {
  file_name: string;
  file_size_bytes: number;
  download_path?: string;
};
