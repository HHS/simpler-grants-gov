"use client";

import { deleteUploadActionsInitialState } from "src/constants/attachment/deleteUploadActionsInitialState";

import { startTransition, useActionState } from "react";

import {
  deleteAttachmentAction,
  DeleteAttachmentActionState,
} from "src/components/application/attachments/actions";

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
