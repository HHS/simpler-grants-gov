import { Attachment } from "src/types/attachmentTypes";

interface UploadResponse {
  data: Attachment[];
}

interface UploadAttachmentProps {
  applicationId: string;
  file: File;
  token?: string;
  signal?: AbortSignal;
}

export async function uploadAttachment({
  applicationId,
  file,
  token,
  signal,
}: UploadAttachmentProps): Promise<Attachment[]> {
  const formData = new FormData();
  formData.append("file_attachment", file);

  const res = await fetch(`/api/applications/${applicationId}/attachments`, {
    method: "POST",
    body: formData,
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error(`Failed to delete attachment: HTTP ${res.status}`);
  }

  const json = (await res.json()) as UploadResponse;

  return json.data;
}
