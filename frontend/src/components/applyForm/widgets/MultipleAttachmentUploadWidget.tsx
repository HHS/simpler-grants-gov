"use client";

import { uploadFileToApp } from "src/services/attachments/upload";
import { useAttachments } from "src/components/applyForm/AttachmentContext";
import { useEffect, useRef, useState } from "react";
import {
  ErrorMessage,
  FileInput,
  FileInputRef,
  FormGroup,
  Icon,
} from "@trussworks/react-uswds";
import { UswdsWidgetProps } from "../types";
import { getLabelComponent } from "../utils/getLabelComponent";

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
  schema,
  onChange,
}: UswdsWidgetProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);
  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `error-for-${id}` : `${id}-hint`;
  const { description, options, title } = schema;

  const attachments = useAttachments();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (Array.isArray(initialValue)) {
      setUploadedFiles(
        initialValue.map((uuid) => {
          const match = attachments.find(a => a.application_attachment_id === uuid);
          return {
            id: uuid,
            name: match?.file_name || "(Previously uploaded file)"
          };
        }),
      );
    }
  }, [initialValue, attachments]);

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
          const updated = [
            ...uploadedFiles,
            { id: attachmentId, name: file.name },
          ];
          setUploadedFiles(updated);
          onChange?.(updated.map(f => f.id));
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    fileInputRef.current?.clearFiles();
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== indexToRemove);
    setUploadedFiles(updated);
    onChange?.(updated.map(f => f.id));
  };

  return (
    <FormGroup key={`wrapper-for-${id}`} error={hasError}>
      {getLabelComponent({ id, title, required, description, options })}

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
        <ul className="usa-list usa-list--unstyled margin-top-2">
          {uploadedFiles.map((file, index) => {
            const attachment = attachments.find(
              (a) => a.application_attachment_id === file.id,
            );

            return (
              <li
                key={`${file.id}-${index}`}
                className="margin-bottom-1 display-flex flex-align-center"
              >
                {attachment?.download_path ? (
                  <a
                    href={attachment.download_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary display-inline-flex align-items-center"
                  >
                    <Icon.Visibility className="margin-right-05 text-middle" />
                    {file.name}
                  </a>
                ) : (
                  <span>{file.name}</span>
                )}

                <button
                  type="button"
                  className="usa-button usa-button--unstyled text-primary margin-left-2 display-inline-flex align-items-center"
                  onClick={() => handleRemove(index)}
                >
                  <Icon.Delete className="margin-right-05 text-middle" />
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </FormGroup>
  );
};

export default MultipleAttachmentUploadWidget;
