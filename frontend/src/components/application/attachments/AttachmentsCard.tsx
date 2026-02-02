"use client";

import { deleteUploadActionsInitialState } from "src/constants/attachment/deleteUploadActionsInitialState";
import { uploadActionsInitialState } from "src/constants/attachment/uploadActionsInitialState";
import { Attachment, AttachmentCardItem } from "src/types/attachmentTypes";
import { createTempAttachment } from "src/utils/attachment/createTempAttachment";

import { useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FileInputRef,
  Grid,
  GridContainer,
  ModalRef,
} from "@trussworks/react-uswds";

import {
  deleteAttachmentAction,
  DeleteAttachmentActionState,
  uploadAttachmentAction,
  UploadAttachmentActionState,
} from "./actions";
import { AttachmentsCardForm } from "./AttachmentsCardForm";
import { AttachmentsCardTable } from "./AttachmentsCardTable";
import { DeleteAttachmentModal } from "./DeleteAttachmentModal";

interface AttachmentsCardProps {
  applicationId: string;
  attachments: Attachment[];
  competitionInstructionsDownloadPath: string;
}

export const AttachmentsCard = ({
  applicationId,
  attachments,
  competitionInstructionsDownloadPath,
}: AttachmentsCardProps) => {
  /**
   * Refs
   */

  const t = useTranslations("Application.attachments");

  const deleteModalRef = useRef<ModalRef | null>(null);
  const fileInputRef = useRef<FileInputRef | null>(null);
  const lastDeletedIdRef = useRef<string | null>(null);

  /**
   * Local state
   */

  const [uploads, setUploads] = useState<AttachmentCardItem[]>([]);
  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState<
    Set<string>
  >(new Set());
  const [attachmentToDeleteName, setAttachmentToDeleteName] = useState<
    string | undefined
  >(undefined);
  const [fileInputErrorText, setFileInputErrorText] = useState<
    string | undefined
  >(undefined);

  /**
   * useActionStates
   */

  const [uploadState, uploadFormAction] = useActionState(
    uploadAttachmentAction,
    uploadActionsInitialState satisfies UploadAttachmentActionState,
  );

  const [deleteState, deleteActionFormAction, deletePending] = useActionState(
    deleteAttachmentAction,
    deleteUploadActionsInitialState satisfies DeleteAttachmentActionState,
  );

  /**
   * Helpers
   */

  const handleCancelUpload = (uploadId: string) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === uploadId ? { ...upload, status: "cancelled" } : upload,
      ),
    );

    const target = uploads.find((u) => u.id === uploadId);
    target?.abortController?.abort();
  };

  const handleDeleteAttachment = () => {
    const applicationAttachmentId = lastDeletedIdRef.current as string;

    setAttachmentIdsToDelete((prev) =>
      new Set(prev).add(applicationAttachmentId),
    );

    startTransition(() => {
      deleteActionFormAction({
        applicationId,
        applicationAttachmentId,
      });
    });
  };

  const handleUploadAttachment = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const abortController = new AbortController();
    const { tempId, tempAttachment } = createTempAttachment(
      file,
      abortController,
    );

    setUploads((prev) => [...prev, tempAttachment]);

    const formData = new FormData();
    formData.append("application_id", applicationId);
    formData.append("file_attachment", file);

    startTransition(() => {
      uploadFormAction({ formData, tempId, abortController });
    });
  };

  const markAttachmentForDeletion = (
    applicationAttachmentId: string,
    attachmentToDeleteName: string,
  ) => {
    lastDeletedIdRef.current = applicationAttachmentId;

    setAttachmentToDeleteName(attachmentToDeleteName);
  };

  /**
   * UseEffects
   */

  // Delete State
  useEffect(() => {
    const lastDeletedId = lastDeletedIdRef.current;

    if (deleteState?.success || deleteState?.error) {
      setAttachmentIdsToDelete((prev) => {
        const updated = new Set(prev);
        if (lastDeletedId) updated.delete(lastDeletedId);

        return updated;
      });
      deleteModalRef.current?.toggleModal();
    }
  }, [deleteState]);

  // Upload State
  useEffect(() => {
    fileInputRef.current?.clearFiles();
    setFileInputErrorText(uploadState?.error);

    if (uploadState?.success) {
      setUploads((prev) =>
        prev.filter((u) => u.id !== uploadState?.uploads.tempId),
      );
    }
  }, [uploadState, fileInputRef]);

  return (
    <>
      <GridContainer data-testid="opportunity-card" className="padding-x-0">
        <h3 className="margin-top-4">{t("attachments")}</h3>
        <Grid row gap>
          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            {t.rich("attachmentsInstructions", {
              instructionsLink: (chunks) => {
                return competitionInstructionsDownloadPath ? (
                  <a href={competitionInstructionsDownloadPath}>{chunks}</a>
                ) : (
                  <span>{chunks}</span>
                );
              },
            })}
          </Grid>
          <Grid tablet={{ col: 6 }} mobile={{ col: 12 }}>
            <AttachmentsCardForm
              applicationId={applicationId}
              errorText={fileInputErrorText}
              handleUploadAttachment={handleUploadAttachment}
              inputRef={fileInputRef}
            />
          </Grid>
        </Grid>
        <Grid row>
          <AttachmentsCardTable
            attachments={attachments}
            attachmentIdsToDelete={attachmentIdsToDelete}
            deleteAttachmentModalRef={deleteModalRef}
            handleCancelUpload={handleCancelUpload}
            markAttachmentForDeletion={markAttachmentForDeletion}
            isDeleting={deletePending}
            uploads={uploads}
          />
        </Grid>
      </GridContainer>
      <DeleteAttachmentModal
        deletePending={deletePending}
        handleDeleteAttachment={handleDeleteAttachment}
        modalId="delete-attachment-modal"
        modalRef={deleteModalRef}
        pendingDeleteName={attachmentToDeleteName}
      />
    </>
  );
};
