export type FileUploadProcessStatus =
  | "queued"
  | "uploading"
  | "scanning"
  | "post-upload"
  | "complete";

export type FileUploadErrorStatus =
  | "error"
  | "upload-error"
  | "scan-error"
  | "scan-fail"
  | "post-upload-error";

export type FileUploadStatus = FileUploadErrorStatus | FileUploadProcessStatus;
// maybe we can dynamically type this later
export type PostUploadAction = (fileId: string) => Promise<unknown>;
export type UploadFileMetadata = {
  id: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  downloadUrl?: string;
  updatedAt: number; // ?? may come back as a string
};
