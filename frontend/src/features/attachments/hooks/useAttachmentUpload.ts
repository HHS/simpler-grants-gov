"use client";

import { uploadAttachment as uploadAttachmentAPI } from "src/features/attachments/api/uploadAttachment";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";

import { useCallback, useState } from "react";

interface AttachmentUploadHook {
  isLoading: boolean;
  isAborted: boolean;
  error: Error | null;
  uploadAttachment: (file: File) => AbortController;
}

export const useAttachmentUpload = (): AttachmentUploadHook => {
  const { applicationId, addUploading, updateStatus, remove, refresh } =
    useAttachmentsContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadAttachment = useCallback(
    (file: File): AbortController => {
      setIsLoading(true);
      setIsAborted(false);
      setError(null);

      const controller = new AbortController();
      const tempId = addUploading(file, controller);

      // kick off the async work; we don't await here so uploadAttachment returns immediately
      (async () => {
        try {
          await uploadAttachmentAPI({
            applicationId,
            file,
            signal: controller.signal,
          });
          updateStatus(tempId, "completed");
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            setIsAborted(true);
            remove(tempId);
          } else {
            updateStatus(tempId, "failed");
            setError(err as Error);
          }
        } finally {
          setIsLoading(false);
          // await inside the IIFE, so finally still returns void  ✅
          try {
            await refresh();
          } catch (error) {
            console.error(error as Error);
          }
        }
      })().catch((error) => {
        console.error(error as Error);
        /* swallow to avoid unhandled‑rejection warning */
      });

      return controller; // caller can abort later
    },
    [applicationId, addUploading, updateStatus, remove, refresh],
  );

  return { isLoading, isAborted, error, uploadAttachment };
};
