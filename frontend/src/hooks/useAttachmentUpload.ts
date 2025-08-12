"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { AttachmentUploadResponse } from "src/types/attachmentTypes";

export const useAttachmentUpload = () => {
  const { clientFetch } = useClientFetch<AttachmentUploadResponse>(
    "Attachment upload failed",
    { jsonResponse: true, authGatedRequest: true },
  );

  const uploadAttachment = async (
    applicationId: string,
    file: File,
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await clientFetch(
        `/api/applications/${applicationId}/attachments`,
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadedId = response.application_attachment_id;
      if (typeof uploadedId === "string") return uploadedId;

      console.error("Missing application_attachment_id in upload response");
      return null;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  return { uploadAttachment };
};
