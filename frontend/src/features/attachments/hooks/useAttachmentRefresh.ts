"use client";

import { getAttachments } from "src/features/attachments/api/getAttachments";
import { Attachment } from "src/types/attachmentTypes";

import { useCallback } from "react";
import { FileInputRef } from "@trussworks/react-uswds";

interface AttachmentRefreshHookProps {
  applicationId: string;
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  fileInputRef: React.RefObject<FileInputRef | null>;
}

export const useAttachmentRefresh = ({
  applicationId,
  setAttachments,
  fileInputRef,
}: AttachmentRefreshHookProps) => {
  return useCallback(async () => {
    try {
      const data = await getAttachments({
        applicationId,
      });
      setAttachments(data);
    } catch (e) {
      console.error("Failed to fetch attachments", e);
    } finally {
      fileInputRef.current?.clearFiles?.();
    }
  }, [applicationId, setAttachments, fileInputRef]);
};
