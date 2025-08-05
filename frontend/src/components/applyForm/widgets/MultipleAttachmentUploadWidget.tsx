"use client";

import { uploadFileToApp } from "src/services/attachments/upload";

import { useEffect, useRef, useState } from "react";
import {
  ErrorMessage,
  FileInput,
  FileInputRef,
  FormGroup,
  Icon,
} from "@trussworks/react-uswds";

import { useAttachments } from "src/components/applyForm/AttachmentContext";
import { UswdsWidgetProps } from "src/components/applyForm/types";
import {
  getApplicationIdFromUrl,
  getLabelComponent,
} from "src/components/applyForm/utils";

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
  const { description, options, title } = schema as typeof schema & {
    description?: string;
    title?: string;
  };

  const attachments = useAttachments();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadedFilesRef = useRef<UploadedFile[]>([]);

  useEffect(() => {
    let parsedValue: string[] = [];

    if (Array.isArray(initialValue)) {
      parsedValue = initialValue as string[];
    } else if (typeof initialValue === "string") {
      try {
        const parsed: unknown = JSON.parse(initialValue);
        if (
          Array.isArray(parsed) &&
          (parsed as unknown[]).every((item) => typeof item === "string")
        ) {
          parsedValue = parsed as string[];
        }
      } catch {
        console.warn("Invalid JSON string for initialValue:", initialValue);
      }
    }

    if (parsedValue.length > 0 && uploadedFiles.length === 0) {
      const hydrated = parsedValue.map((uuid) => {
        const match = attachments.find(
          (a) => a.application_attachment_id === uuid,
        );
        return {
          id: uuid,
          name: match?.file_name || "(Previously uploaded file)",
        };
      });
      setUploadedFiles(hydrated);
      uploadedFilesRef.current = hydrated;
    }
  }, [initialValue, attachments, uploadedFiles.length]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const applicationId = getApplicationIdFromUrl();
    if (!applicationId) {
      console.error("Could not extract applicationId from URL");
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        const attachmentId = await uploadFileToApp(applicationId, file);
        if (attachmentId) {
          newFiles.push({ id: attachmentId, name: file.name });
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    const combined = [...uploadedFilesRef.current, ...newFiles];

    setUploadedFiles(combined);
    uploadedFilesRef.current = combined;
    onChange?.(combined.map((f) => f.id));

    fileInputRef.current?.clearFiles();
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== indexToRemove);
    setUploadedFiles(updated);
    onChange?.(updated.map((f) => f.id));
  };

  return (
    <FormGroup key={`form-group__multi-file-upload--${id}`} error={hasError}>
      {/* casting doesn’t fully satisfy the linter because it treats schema as possibly any underneath. */}
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      {getLabelComponent({ id, title, required, description, options })}

      {hasError && (
        <ErrorMessage id={`error-for-${id}`}>
          {(() => {
            const error = rawErrors[0];
            if (!error) return null;
            if (typeof error === "string") return error;
            if (typeof error === "object" && "message" in error) {
              return error.message;
            }
            return "Invalid input";
          })()}
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
          const files = e.currentTarget.files;
          e.preventDefault();
          handleFileChange(files).catch((error) => {
            console.error("File handling failed:", error);
          });
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
                    <Icon.Visibility
                      className="margin-right-02 text-middle"
                      role="presentation"
                    />
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
                  <Icon.Delete
                    className="margin-right-02 text-middle"
                    role="presentation"
                    aria-label=""
                  />
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
