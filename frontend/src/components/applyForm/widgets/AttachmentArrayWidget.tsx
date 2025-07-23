"use client";

import React, { useState } from "react";
import { FileInput } from "@trussworks/react-uswds";
import { UswdsWidgetProps } from "../types";
import { uploadFileToApp } from "src/services/attachments/upload";

function getApplicationIdFromUrl(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(
    /\/applications\/application\/([a-f0-9-]+)\/form\//,
  );
  return match?.[1] || "";
}

const AttachmentArrayWidget = ({
  id,
  value = [],
  required,
  rawErrors = [],
  onChange,
  schema,
  label,
}: UswdsWidgetProps) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const attachments: string[] = Array.isArray(value) ? value : [];
  const hasError = rawErrors.length > 0;

  const handleFilesChange = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const applicationId = getApplicationIdFromUrl();
    if (!applicationId) return;

    setUploading(true);
    const newIds: string[] = [];
    const newNames: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const attachmentId = await uploadFileToApp(applicationId, file);
        newIds.push(attachmentId as string);
        newNames.push(file.name);
      } catch (err) {
        console.error("Failed to upload", err);
      }
    }

    setUploading(false);
    onChange?.([...attachments, ...newIds]);
    setFileNames([...fileNames, ...newNames]);
  };

  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    const updatedNames = fileNames.filter((_, i) => i !== index);
    onChange?.(updated);
    setFileNames(updatedNames);
  };

  return (
    <div
      key={id}
      className={`usa-form-group ${hasError ? "usa-form-group--error" : ""}`}
    >
      {label && (
        <label className="usa-label">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}
      {schema?.description && (
        <div className="usa-hint mb-1">{schema.description}</div>
      )}
      {hasError && (
        <div className="usa-error-message" role="alert">
          {rawErrors[0]}
        </div>
      )}

      <FileInput
        key={`${id}-input`}
        id={`${id}-file-input`}
        name={`${id}-file-input`}
        multiple
        onChange={(e) => handleFilesChange(e.currentTarget.files)}
        disabled={uploading}
      />

      <ul className="usa-list usa-list--unstyled mt-2">
        {attachments.map((attachmentId, idx) => (
          <li key={`${id}-${idx}`} className="mb-1">
            <span className="font-mono text-sm">
              {fileNames[idx] || "Unnamed file"} – <code>{attachmentId}</code>
            </span>
            <button
              type="button"
              className="usa-button usa-button--unstyled text-secondary ml-2"
              onClick={() => handleRemove(idx)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttachmentArrayWidget;
