"use client";

import { uploadFileToApp } from "src/services/attachments/upload";

import { useRef, useState } from "react";
import {
  ErrorMessage,
  FileInput,
  FileInputRef,
  FormGroup,
  Label,
} from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";
import { getApplicationIdFromUrl } from "src/components/applyForm/utils";

const AttachmentUpload = ({
  id,
  value: initialValue,
  required,
  rawErrors = [],
  label,
  onChange,
}: UswdsWidgetProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);
  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `error-for-${id}` : `${id}-hint`;

  const [uuid, setUuid] = useState<string | null>(
    typeof initialValue === "string" ? initialValue : null,
  );
  const [fileName, setFileName] = useState<string>("");

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
        setUuid(attachmentId);
        setFileName(file.name);
        onChange?.(attachmentId);
        fileInputRef.current?.clearFiles();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleRemove = () => {
    setUuid(null);
    setFileName("");
    onChange?.("");
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

      {uuid ? (
        <>
          <div className="usa-file-input__target text-base">
            {fileName || "File uploaded"}{" "}
            <button
              type="button"
              className="usa-button usa-button--unstyled text-secondary ml-2"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
          <input type="hidden" name={id} value={uuid} />
        </>
      ) : (
        <FileInput
          id={id}
          name={`${id}-file`}
          ref={fileInputRef}
          type="file"
          className="usa-file-input__input"
          onChange={(e) => {
            const files = e.currentTarget.files;
            e.preventDefault();
            void handleFileChange(files);
          }}
          aria-describedby={describedBy}
        />
      )}
    </FormGroup>
  );
};

export default AttachmentUpload;
