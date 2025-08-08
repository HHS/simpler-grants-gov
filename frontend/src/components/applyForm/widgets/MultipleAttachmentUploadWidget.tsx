"use client";

import { useApplicationId } from "src/hooks/useApplicationId";
import { useAttachmentDelete } from "src/hooks/useAttachmentDelete";
import { useAttachmentUpload } from "src/hooks/useAttachmentUpload";

import React, { useEffect, useRef, useState } from "react";
import {
  ErrorMessage,
  FileInput,
  FileInputRef,
  FormGroup,
  ModalRef,
} from "@trussworks/react-uswds";

import { DeleteAttachmentModal } from "src/components/application/attachments/DeleteAttachmentModal";
import {
  SchemaWithLabelOption,
  UploadedFile,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import { isValidationWarning } from "src/components/applyForm/utils";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";
import { MultipleAttachmentUploadList } from "./MultiAttachmentUploadList";

const MultipleAttachmentUploadWidget = ({
  id,
  value: initialValue,
  required,
  rawErrors = [],
  schema,
  onChange,
  attachments,
}: UswdsWidgetProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);
  const applicationId = useApplicationId();
  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `error-for-${id}` : `${id}-hint`;
  const { description, title, options } = schema as SchemaWithLabelOption;
  const { uploadAttachment } = useAttachmentUpload();
  const { deleteState, deletePending, deleteAttachment } =
    useAttachmentDelete();

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const uploadedFilesRef = useRef<UploadedFile[]>([]);
  const [fileToDeleteIndex, setFileToDeleteIndex] = useState<number | null>(
    null,
  );
  const [deletePendingName, setDeletePendingName] = useState<string | null>(
    null,
  );
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) return;

    let parsedValue: string[] = [];

    if (Array.isArray(initialValue)) {
      parsedValue = initialValue as string[];
    } else if (typeof initialValue === "string") {
      try {
        // casting doesn’t fully satisfy the linter because it treats schema as possibly any underneath
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(initialValue);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          parsedValue = parsed;
        }
      } catch {
        console.warn("Invalid JSON string for initialValue:", initialValue);
      }
    }

    if (parsedValue.length > 0) {
      const hydrated = parsedValue.map((uuid) => {
        const match = attachments?.find(
          (a) => a.application_attachment_id === uuid,
        );
        return {
          id: uuid,
          name: match?.file_name || "(Previously uploaded file)",
        };
      });

      setUploadedFiles(hydrated);
      uploadedFilesRef.current = hydrated;
      hasHydratedRef.current = true;
    }
  }, [initialValue, attachments]);

  useEffect(() => {
    if (deleteState?.success && fileToDeleteIndex !== null) {
      const updated = uploadedFiles.filter((_, i) => i !== fileToDeleteIndex);
      setUploadedFiles(updated);
      uploadedFilesRef.current = updated;
      onChange?.(updated.map((f) => f.id));
      setFileToDeleteIndex(null);
      setDeletePendingName(null);
      deleteModalRef.current?.toggleModal();
    }
  }, [deleteState, fileToDeleteIndex, uploadedFiles, onChange]);

  const handleFileChange = async (files: FileList | null): Promise<void> => {
    if (!files || !applicationId) return;

    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      const attachmentId = await uploadAttachment(applicationId, file);
      if (attachmentId) {
        newFiles.push({ id: attachmentId, name: file.name });
      }
    }

    const combined = [...uploadedFilesRef.current, ...newFiles];
    setUploadedFiles(combined);
    uploadedFilesRef.current = combined;
    onChange?.(combined.map((f) => f.id));

    fileInputRef.current?.clearFiles();
  };

  const handleRemove = (index: number): void => {
    const file = uploadedFiles[index];
    const isPreviouslyUploaded = file.name === "(Previously uploaded file)";
    if (isPreviouslyUploaded || !applicationId) {
      const updated = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(updated);
      uploadedFilesRef.current = updated;
      onChange?.(updated.map((f) => f.id));
    } else {
      setFileToDeleteIndex(index);
      setDeletePendingName(file.name);
      deleteModalRef.current?.toggleModal();
    }
  };

  const confirmDelete = (): void => {
    if (fileToDeleteIndex === null || !applicationId) return;
    const file = uploadedFiles[fileToDeleteIndex];
    deleteAttachment(applicationId, file.id);
  };

  return (
    <FormGroup key={`form-group__multi-file-upload--${id}`} error={hasError}>
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description as string}
        labelType={labelType}
      />

      {hasError && (
        <ErrorMessage id={`error-for-${id}`}>
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : isValidationWarning(rawErrors[0])
              ? rawErrors[0].message
              : "Invalid input"}
        </ErrorMessage>
      )}

      <FileInput
        id={id}
        name={id}
        ref={fileInputRef}
        type="file"
        multiple
        className="usa-file-input__input"
        onChange={(e) => {
          handleFileChange(e.currentTarget.files).catch((error) =>
            console.error(error),
          );
        }}
        aria-describedby={describedBy}
      />

      <input
        type="hidden"
        name={id}
        value={JSON.stringify(uploadedFiles.map((f) => f.id))}
      />

      {uploadedFiles.length > 0 && (
        <MultipleAttachmentUploadList
          attachments={attachments}
          uploadedFiles={uploadedFiles}
          handleRemove={(index) => handleRemove(index)}
        />
      )}

      <DeleteAttachmentModal
        deletePending={deletePending}
        handleDeleteAttachment={confirmDelete}
        modalId="multi-attachment-delete-modal"
        modalRef={deleteModalRef}
        pendingDeleteName={deletePendingName ?? ""}
      />
    </FormGroup>
  );
};

export default MultipleAttachmentUploadWidget;
