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
export type PostUploadAction = (fileId: string) => Promise<boolean | undefined>;
export type UploadFileMetadata = {
  id: string;
  fileName: string;
  size?: number;
  mimeType?: string;
  downloadUrl?: string;
};
