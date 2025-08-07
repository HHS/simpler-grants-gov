"use client";

import { useActionState, startTransition } from "react";
import {
  deleteAttachmentAction,
  DeleteAttachmentActionState,
} from "src/components/application/attachments/actions";
import { deleteUploadActionsInitialState } from "src/constants/attachment/deleteUploadActionsInitialState";

export const useAttachmentDelete = () => {
  const [deleteState, deleteActionFormAction, deletePending] = useActionState(
    deleteAttachmentAction,
    deleteUploadActionsInitialState satisfies DeleteAttachmentActionState,
  );

  const deleteAttachment = (applicationId: string, attachmentId: string) => {
    startTransition(() => {
      deleteActionFormAction({
        applicationId,
        applicationAttachmentId: attachmentId,
      });
    });
  };

  return {
    deleteState,
    deletePending,
    deleteAttachment,
  };
};