"use client";

import {
  FormGroup,
  FileInput,
  FileInputRef,
  Label,
  ErrorMessage,
  TextInput,
} from "@trussworks/react-uswds";
import { useEffect, useRef, useState } from "react";
import { UswdsWidgetProps } from "../types";
import { uploadFileToApp } from "src/services/attachments/upload";

function getApplicationIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(
    /\/applications\/application\/([a-f0-9-]+)\/form\//,
  );
  return match?.[1] ?? null;
}

const FileUploadWidget = ({
  id,
  value: initialValue,
  required,
  rawErrors = [],
  label,
}: UswdsWidgetProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);
  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `error-for-${id}` : `${id}-hint`;

  const [localValue, setLocalValue] = useState<string | null>(
    typeof initialValue === "string" ? initialValue : null,
  );

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const applicationId = getApplicationIdFromUrl();
    if (!applicationId) {
      console.error("Could not extract applicationId from URL");
      return;
    }

    try {
      const attachmentId = await uploadFileToApp(applicationId, file);
      if (attachmentId) {
        setLocalValue(attachmentId);
        fileInputRef.current?.clearFiles();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleRemove = () => {
    setLocalValue(null);
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

      {localValue ? (
        <>
          <TextInput
            id={id}
            name={id}
            value={localValue}
            disabled
            readOnly
            aria-describedby={describedBy}
            type="text"
          />
          <input type="hidden" name={id} value={localValue} />
          <button
            type="button"
            className="usa-button usa-button--unstyled text-secondary mt-2"
            onClick={handleRemove}
          >
            Remove Attachment
          </button>
        </>
      ) : (
        <FileInput
          id={id}
          name={id}
          ref={fileInputRef}
          type="file"
          className="usa-file-input__input"
          onChange={(e) => {
            const files = e.currentTarget.files;
            e.preventDefault();
            handleFileChange(files);
          }}
          aria-describedby={describedBy}
        />
      )}
    </FormGroup>
  );
};

export default FileUploadWidget;
