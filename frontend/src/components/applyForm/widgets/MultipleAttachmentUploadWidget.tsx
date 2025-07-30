"use client";

import { uploadFileToApp } from "src/services/attachments/upload";
import { useEffect, useRef, useState } from "react";
import {
  ErrorMessage,
  FileInput,
  FileInputRef,
  FormGroup,
  Label,
  TextInput,
} from "@trussworks/react-uswds";
import { UswdsWidgetProps } from "../types";

function getApplicationIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(
    /\/applications\/application\/([a-f0-9-]+)\/form\//,
  );
  return match?.[1] ?? null;
}

type UploadedFile = {
  id: string;
  name: string;
};

const MultipleAttachmentUploadWidget = ({
  id,
  value: initialValue,
  required,
  rawErrors = [],
  label,
}: UswdsWidgetProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);
  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `error-for-${id}` : `${id}-hint`;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (Array.isArray(initialValue)) {
      setUploadedFiles(
        initialValue.map((uuid) => ({ id: uuid, name: "(Previously uploaded file)" })),
      );
    }
  }, [initialValue]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const applicationId = getApplicationIdFromUrl();
    if (!applicationId) {
      console.error("Could not extract applicationId from URL");
      return;
    }

    for (const file of Array.from(files)) {
      try {
        const attachmentId = await uploadFileToApp(applicationId, file);
        if (attachmentId) {
          setUploadedFiles((prev) => [
            ...prev,
            { id: attachmentId, name: file.name },
          ]);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    fileInputRef.current?.clearFiles();
  };

  const handleRemove = (indexToRemove: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <FormGroup key={`wrapper-for-${id}`} error={hasError}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </Label>

      {hasError && (
        <ErrorMessage id={`error-for-${id}`}>{rawErrors[0]}</ErrorMessage>
      )}

      <FileInput
        id={id}
        name={id}
        ref={fileInputRef}
        type="file"
        multiple
        className="usa-file-input__input"
        onChange={(e) => {
          const files = e.currentTarget.files;
          e.preventDefault();
          void handleFileChange(files);
        }}
        aria-describedby={describedBy}
      />

      <input
        type="hidden"
        name={id}
        value={JSON.stringify(uploadedFiles.map((f) => f.id))}
      />

      {uploadedFiles.length > 0 && (
        <ul className="usa-list usa-list--unstyled mt-2">
          {uploadedFiles.map((file, index) => (
            <li key={`${file.id}-${index}`} className="mb-1 flex items-center justify-between">
              <TextInput
                type="text"
                id={`${id}-file-${index}`}
                name={`${id}-file-${index}`}
                value={file.name}
                disabled
                readOnly
                className="w-full mr-2"
                aria-describedby={describedBy}
              />
              <button
                type="button"
                className="usa-button usa-button--unstyled text-secondary ml-2"
                onClick={() => handleRemove(index)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </FormGroup>
  );
};

export default MultipleAttachmentUploadWidget;
