"use client";

import { uploadFileToApp } from "src/services/attachments/upload";
import { Attachment } from "src/types/attachmentTypes";

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

const AttachmentUpload = ({
  id,
  value: initialValue,
  required,
  rawErrors = [],
  schema,
  onChange,
}: UswdsWidgetProps) => {
  const { description, options, title } = schema as typeof schema & {
    description?: string;
    title?: string;
  };
  const fileInputRef = useRef<FileInputRef | null>(null);
  const hasError = rawErrors.length > 0;
  const describedBy = hasError ? `error-for-${id}` : `${id}-hint`;

  const [uuid, setUuid] = useState<string | null>(
    typeof initialValue === "string" ? initialValue : null,
  );
  const [fileName, setFileName] = useState<string>("");
  const attachments = useAttachments();

  useEffect(() => {
    if (uuid && !fileName) {
      const existing = attachments.find(
        (a: Attachment) => a.application_attachment_id === uuid,
      );
      if (existing) {
        setFileName(existing.file_name);
      }
    }
  }, [uuid, fileName, attachments]);

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
    <FormGroup key={`form-group__file-upload--${id}`} error={hasError}>
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

      {uuid ? (
        <>
          <div className="margin-top-2 display-flex flex-align-center">
            {(() => {
              const attachment = attachments.find(
                (a) => a.application_attachment_id === uuid,
              );

              return attachment?.download_path ? (
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
                  {fileName || "View uploaded file"}
                </a>
              ) : (
                <span>{fileName || "File uploaded"}</span>
              );
            })()}

            <button
              type="button"
              className="usa-button usa-button--unstyled text-primary margin-left-5 display-inline-flex align-items-center"
              onClick={handleRemove}
            >
              <Icon.Delete
                className="margin-right-02 text-middle"
                role="presentation"
              />
              Delete
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
            handleFileChange(files).catch((error) => {
              console.error("File handling failed:", error);
            });
          }}
          aria-describedby={describedBy}
        />
      )}
    </FormGroup>
  );
};

export default AttachmentUpload;
