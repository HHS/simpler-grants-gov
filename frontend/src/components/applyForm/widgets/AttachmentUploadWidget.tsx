"use client";

import { deleteUploadActionsInitialState } from "src/constants/attachment/deleteUploadActionsInitialState";
import { AttachmentUploadResponse } from "src/types/attachmentTypes";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Button,
  FileInput,
  FileInputRef,
  ModalRef,
} from "@trussworks/react-uswds";

import {
  deleteAttachmentAction,
  DeleteAttachmentActionState,
} from "src/components/application/attachments/actions";
import { DeleteAttachmentModal } from "src/components/application/attachments/DeleteAttachmentModal";
import { useAttachments } from "src/components/applyForm/AttachmentContext";
import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import { getApplicationIdFromUrl } from "src/components/applyForm/utils";

export default function AttachmentUploadWidget(props: UswdsWidgetProps) {
  const {
    id,
    value,
    onChange,
    required,
    schema,
    rawErrors = [],
    disabled,
  } = props;

  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);
  const applicationId = getApplicationIdFromUrl();
  const attachments = useAttachments();

  const [attachmentId, setAttachmentId] = useState<string | null>(
    typeof value === "string" ? value : null,
  );

  const [fileName, setFileName] = useState<string | null>(null);
  const [showFile, setShowFile] = useState<boolean>(false);
  const [deletePendingName, setDeletePendingName] = useState<string | null>(
    null,
  );

  const [deleteState, deleteActionFormAction, deletePending] = useActionState(
    deleteAttachmentAction,
    deleteUploadActionsInitialState satisfies DeleteAttachmentActionState,
  );

  const handleDeleteClick = () => {
    if (isPreviouslyUploaded) {
      setShowFile(false);
      setFileName(null);
      setAttachmentId(null);
      onChange?.(undefined);
    } else {
      setDeletePendingName(fileName ?? "this file");
      deleteModalRef.current?.toggleModal();
    }
  };

  const handleDeleteConfirmed = () => {
    if (!applicationId || !attachmentId) return;

    startTransition(() => {
      deleteActionFormAction({
        applicationId,
        applicationAttachmentId: attachmentId,
      });
    });
  };

  useEffect(() => {
    if (deleteState?.success) {
      setShowFile(false);
      setFileName(null);
      setAttachmentId(null);
      onChange?.(undefined);
    }
  }, [deleteState, onChange]);

  useEffect(() => {
    const newAttachmentId = typeof value === "string" ? value : null;
    setAttachmentId(newAttachmentId);

    const uploadedAttachment = attachments.find(
      (a) => a.application_attachment_id === newAttachmentId,
    );

    setFileName(
      uploadedAttachment?.file_name ??
        (newAttachmentId ? "(Previously uploaded file)" : null),
    );

    setShowFile(!!newAttachmentId);
  }, [value, attachments]);

  const handleChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || !applicationId) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/applications/${applicationId}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = (await res.json()) as AttachmentUploadResponse;
      const uploadedId = data.application_attachment_id;
      if (typeof uploadedId === "string") {
        setAttachmentId(uploadedId);
        setFileName(file.name);
        setShowFile(true);
        onChange?.(uploadedId);
      } else {
        console.error("Upload response missing a valid attachment ID");
      }
    } else {
      console.error("Upload failed");
    }

    fileInputRef.current?.clearFiles();
  };

  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `${id}-error` : undefined;
  const isPreviouslyUploaded = fileName === "(Previously uploaded file)";

  const isValidationWarning = (e: unknown): e is FormValidationWarning => {
    return typeof e === "object" && e !== null && "message" in e;
  };

  return (
    <>
      <input type="hidden" name={id} value={attachmentId ?? ""} />
      {!showFile && (
        <FileInput
          id={id}
          name={id}
          required={required}
          disabled={disabled}
          ref={fileInputRef}
          onChange={(e) => {
            handleChange(e).catch((error) => console.error(error));
          }}
          accept={schema.contentMediaType}
          aria-describedby={describedBy}
          aria-invalid={hasError}
        />
      )}

      {showFile && (
        <div className="margin-top-1 display-flex flex-align-center">
          <span>{fileName}</span>
          <Button
            type="button"
            unstyled
            onClick={handleDeleteClick}
            className="margin-left-1"
          >
            {isPreviouslyUploaded ? "Remove" : "Delete"}
          </Button>
        </div>
      )}

      {hasError && (
        <span id={`${id}-error`} className="usa-error-message">
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : isValidationWarning(rawErrors[0])
              ? rawErrors[0].message
              : "Invalid input"}
        </span>
      )}

      <DeleteAttachmentModal
        deletePending={deletePending}
        handleDeleteAttachment={handleDeleteConfirmed}
        modalId="delete-attachment-modal"
        modalRef={deleteModalRef}
        pendingDeleteName={deletePendingName ?? ""}
      />
    </>
  );
}
