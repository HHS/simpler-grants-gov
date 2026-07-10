"use client";

import {
  deleteAttachmentAction,
  DeleteAttachmentActionState,
} from "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/actions";
import { deleteUploadActionsInitialState } from "src/constants/attachment/deleteUploadActionsInitialState";

import { startTransition, useActionState } from "react";

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
