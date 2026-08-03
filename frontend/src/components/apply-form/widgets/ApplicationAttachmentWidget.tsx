"use client";

import { useApplicationAttachments } from "src/hooks/ApplicationAttachments";
import { useClientFetch } from "src/hooks/useClientFetch";
import { ApplicationAttachmentCreateResponse } from "src/types/applicationResponseTypes";
import { UswdsWidgetProps } from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";
import { UploadFileMetadata } from "src/types/fileUploadTypes";
import { mapAttachmentsToFileMetadata } from "src/utils/applyForm/applicationAttachmentUtils";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { FormGroup } from "@trussworks/react-uswds";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";
import { FieldErrors } from "src/components/core/forms/FieldErrors";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

const ApplicationAttachmentWidget = ({
  disabled,
  id,
  onChange,
  options,
  rawErrors = [],
  readOnly,
  required,
  schema: { description, title },
  value,
}: UswdsWidgetProps) => {
  const t = useTranslations("Application.attachmentUpload");
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);
  const { clientFetch: createApplicationAttachmentFetcher } =
    useClientFetch<ApplicationAttachmentCreateResponse>(
      "Error uploading application attachment",
    );
  const { applicationId } = useParams<{ applicationId: string }>();
  const { attachments } = useApplicationAttachments();
  const [attachment, setAttachment] = useState<Attachment | null>(
    attachments?.find(
      (attachmentItem) => attachmentItem.application_attachment_id === value,
    ) ?? null,
  );

  const handleUploadApplicationAttachment = async (
    fileId: string,
    abortSignal: AbortSignal,
  ) => {
    const response = await createApplicationAttachmentFetcher(
      `/api/applications/${applicationId}/attachments/create`,
      {
        method: "POST",
        signal: abortSignal,
        body: JSON.stringify({ pending_file_id: fileId }),
      },
    );
    onChange?.(response.data.application_attachment_id);
    setAttachment(response.data);
  };

  const handleDeletattachment = (): Promise<undefined> => {
    setAttachment(null);
    onChange?.(undefined);
    return Promise.resolve(undefined);
  };

  const visibleInputId = `${id}-visible`;
  const error = rawErrors.length ? true : undefined;
  const describedby = error
    ? `error-for-${visibleInputId}`
    : title
      ? `label-for-${visibleInputId}`
      : "app-form-attachment-upload-label";

  const existingFiles: UploadFileMetadata[] = attachment
    ? mapAttachmentsToFileMetadata([attachment])
    : [];

  return (
    <FormGroup key={`form-group__multi-file-upload--${id}`} error={error}>
      <DynamicFieldLabel
        idFor={visibleInputId}
        title={title}
        required={required}
        description={description}
        labelType={labelType}
      />
      <input
        type="hidden"
        name={id}
        id={id}
        value={attachment?.application_attachment_id ?? ""}
      />
      {error && (
        <FieldErrors
          fieldName={visibleInputId}
          rawErrors={rawErrors as string[]}
        />
      )}
      <SimplerFileInput
        id={visibleInputId}
        postUploadAction={handleUploadApplicationAttachment}
        postUploadActionProgressMessage={t("uploading")}
        postUploadActionSuccessMessage={t("success")}
        postUploadActionErrorMessage={t("error")}
        onDelete={handleDeletattachment}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        labelId={describedby}
        existingFiles={existingFiles}
      />
    </FormGroup>
  );
};

export default ApplicationAttachmentWidget;
