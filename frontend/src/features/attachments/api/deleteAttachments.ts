interface DeleteAttachmentProps {
  applicationId: string;
  attachmentId: string;
}

export const deleteAttachment = async ({
  applicationId,
  attachmentId,
}: DeleteAttachmentProps): Promise<void> => {
  const res = await fetch(
    `/api/applications/${applicationId}/attachments/${attachmentId}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    throw new Error(`Failed to delete attachment: HTTP ${res.status}`);
  }
};
