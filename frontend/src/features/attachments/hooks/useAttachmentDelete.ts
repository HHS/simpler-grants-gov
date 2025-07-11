"use client";

import { deleteAttachment as deleteAttachmentApi } from "src/features/attachments/api/deleteAttachments";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";

import { useCallback } from "react";

export const useAttachmentDelete = () => {
  const { applicationId, remove, refresh, setDeletingIds } =
    useAttachmentsContext();

  const deleteAttachment = useCallback(
    async (attachmentId: string): Promise<void> => {
      setDeletingIds((prev) => new Set(prev).add(attachmentId));

      try {
        await deleteAttachmentApi({
          applicationId,
          attachmentId,
        });
        remove(attachmentId);
      } catch (error) {
        console.error(error as Error);
      } finally {
        try {
          await refresh();
        } catch (e) {
          console.error("Refresh failed", e);
        } finally {
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(attachmentId);
            return next;
          });
        }
      }
    },
    [applicationId, remove, refresh, setDeletingIds],
  );

  return { deleteAttachment };
};
