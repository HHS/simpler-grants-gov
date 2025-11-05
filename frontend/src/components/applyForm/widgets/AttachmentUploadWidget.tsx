"use client";

import { useApplicationAttachments } from "src/hooks/ApplicationAttachments";
import { useApplicationId } from "src/hooks/useApplicationId";
import { useAttachmentDelete } from "src/hooks/useAttachmentDelete";
import { useAttachmentUpload } from "src/hooks/useAttachmentUpload";

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  FileInput,
  FileInputRef,
  FormGroup,
  ModalRef,
} from "@trussworks/react-uswds";

import { DeleteAttachmentModal } from "src/components/application/attachments/DeleteAttachmentModal";
import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

const AttachmentUploadWidget = (props: UswdsWidgetProps) => {
  const {
    id,
    value,
    onChange,
    required,
    schema,
    rawErrors = [],
    disabled,
    options,
    readOnly,
  } = props;
  const { contentMediaType, title, description } = schema;

  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  const { attachments, setAttachmentsChanged } = useApplicationAttachments();
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
      setAttachmentsChanged(true);
    }
  }, [deleteState, onChange, setAttachmentsChanged]);

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
  }, [value, attachments, setAttachmentsChanged]);

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

  const error = rawErrors.length ? true : undefined;
  const describedby = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

  const isPreviouslyUploaded = fileName === "(Previously uploaded file)";

  return (
    <FormGroup key={`form-group__multi-file-upload--${id}`} error={error}>
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description as string}
        labelType={labelType}
      />
      <input type="hidden" name={id} value={attachmentId ?? ""} />
      {error && (
        <FieldErrors fieldName={id} rawErrors={rawErrors as string[]} />
      )}
      {!showFile && (
        <FileInput
          id={id}
          name={id}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          ref={fileInputRef}
          onChange={(e) => {
            handleChange(e).catch((error) => console.error(error));
          }}
          accept={contentMediaType}
          aria-describedby={describedby}
          aria-invalid={error}
        />
      )}

      {showFile && (
        <div className="margin-top-1 display-flex flex-align-center">
          <span>{fileName}</span>
          <Button
            type="button"
            unstyled
            disabled={disabled}
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
    </FormGroup>
  );
};

export default AttachmentUploadWidget;
