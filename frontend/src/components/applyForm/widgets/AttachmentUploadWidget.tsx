"use client";

import { useApplicationAttachments } from "src/hooks/ApplicationAttachments";
import { useApplicationId } from "src/hooks/useApplicationId";
import { useAttachmentDelete } from "src/hooks/useAttachmentDelete";
import { useAttachmentUpload } from "src/hooks/useAttachmentUpload";

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  ErrorMessage,
  FileInput,
  FileInputRef,
  ModalRef,
} from "@trussworks/react-uswds";

import { DeleteAttachmentModal } from "src/components/application/attachments/DeleteAttachmentModal";
import { UswdsWidgetProps } from "src/components/applyForm/types";

const AttachmentUploadWidget = (props: UswdsWidgetProps) => {
  const {
    error,
    id,
    value,
    onChange,
    required,
    schema,
    rawErrors = [],
    disabled,
  } = props;

  const attachments = useApplicationAttachments();
  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);
  const applicationId = useApplicationId();

  const { uploadAttachment } = useAttachmentUpload();
  const [attachmentId, setAttachmentId] = useState<string | null>(
    typeof value === "string" ? value : null,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [showFile, setShowFile] = useState<boolean>(false);
  const [deletePendingName, setDeletePendingName] = useState<string | null>(
    null,
  );

  const { deleteState, deletePending, deleteAttachment } =
    useAttachmentDelete();

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

    deleteAttachment(applicationId, attachmentId);
  };

  useEffect(() => {
    if (deleteState?.success) {
      setShowFile(false);
      setFileName(null);
      setAttachmentId(null);
      onChange?.(undefined);
      deleteModalRef.current?.toggleModal();
    }
  }, [deleteState, onChange]);

  useEffect(() => {
    const newAttachmentId = typeof value === "string" ? value : null;
    setAttachmentId(newAttachmentId);

    const uploadedAttachment = attachments?.find(
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

    const uploadedId = await uploadAttachment(applicationId, file);
    if (uploadedId) {
      setAttachmentId(uploadedId);
      setFileName(file.name);
      setShowFile(true);
      onChange?.(uploadedId);
    }

    fileInputRef.current?.clearFiles();
  };

  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `${id}-error` : undefined;
  const isPreviouslyUploaded = fileName === "(Previously uploaded file)";

  return (
    <React.Fragment key={`${id}-key`}>
      <input type="hidden" name={id} value={attachmentId ?? ""} />

      {error && (
        <ErrorMessage id={`error-for-${id}`}>
          {String(rawErrors[0])}
        </ErrorMessage>
      )}

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

      <DeleteAttachmentModal
        deletePending={deletePending}
        handleDeleteAttachment={handleDeleteConfirmed}
        modalId="delete-attachment-modal"
        modalRef={deleteModalRef}
        pendingDeleteName={deletePendingName ?? ""}
      />
    </React.Fragment>
  );
};

export default AttachmentUploadWidget;
