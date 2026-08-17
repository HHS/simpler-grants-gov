"use client";

import { useApplicationAttachments } from "src/hooks/ApplicationAttachments";
import { useClientFetch } from "src/hooks/useClientFetch";
import { ApplicationAttachmentCreateResponse } from "src/types/applicationResponseTypes";
import { UswdsWidgetProps } from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";
import { UploadFileMetadata } from "src/types/fileUploadTypes";
import {
  buildAttachmentDescribedByIds,
  mapAttachmentsToFileMetadata,
  parseAttachmentIds,
} from "src/utils/applyForm/applicationAttachmentUtils";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormGroup } from "@trussworks/react-uswds";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";
import { FieldErrors } from "src/components/core/forms/FieldErrors";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

/*
  Virus-scanning attachment input for form fields that allow multiple files.
  Uploads and deletions update the form locally and persist when the form is saved.

  Rendered in place of MultipleAttachmentUploadWidget for the forms listed in
  src/utils/applyForm/virusScanningForms.ts, until that rollout gate is removed in #11352.
*/

/*
  Fallback name used when attachment metadata has not loaded yet.
  Matches the existing attachment widgets, which compare file names against this exact
  value to decide how to render a row, so it cannot be translated independently of them.
  Consolidate when the legacy widgets are removed in #11352.
*/
const PREVIOUSLY_UPLOADED_FILE_NAME = "(Previously uploaded file)";

const ApplicationMultipleAttachmentWidget = ({
  disabled,
  formContext,
  id,
  onChange,
  options,
  rawErrors = [],
  readOnly,
  required,
  schema: { description, title },
  value,
}: UswdsWidgetProps) => {
  const markFormDirty = formContext?.widgetSupport?.markFormDirty;
  const attachmentsUploadingCounter =
    formContext?.widgetSupport?.attachmentsUploadingCounter;
  const t = useTranslations("Application.attachmentUpload");
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);
  const { applicationId } = useParams<{ applicationId: string }>();
  const { attachments: contextAttachments } = useApplicationAttachments();
  const { clientFetch: createApplicationAttachmentFetcher } =
    useClientFetch<ApplicationAttachmentCreateResponse>(
      "Error uploading application attachment",
    );

  /*
    `value` is the last saved response, not a live value - the apply form does not feed
    onChange back into it. Re-seeding only when the saved value actually changes keeps a
    parent rerender from discarding an upload that has just completed.
  */
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>(
    () => parseAttachmentIds(value),
  );
  const [lastSeenSavedValue, setLastSeenSavedValue] = useState(() =>
    JSON.stringify(parseAttachmentIds(value)),
  );

  const savedAttachmentIds = useMemo(() => parseAttachmentIds(value), [value]);
  const serializedSavedValue = JSON.stringify(savedAttachmentIds);
  // adjusted during render rather than in an effect, so no effect can later overwrite a
  // completed upload
  if (serializedSavedValue !== lastSeenSavedValue) {
    setLastSeenSavedValue(serializedSavedValue);
    setSelectedAttachmentIds(savedAttachmentIds);
  }

  // metadata for files uploaded in this session, used only until the attachment context
  // refreshes to include them
  const [locallyUploadedAttachments, setLocallyUploadedAttachments] = useState<
    Record<string, Attachment>
  >({});

  const contextAttachmentsById = useMemo(() => {
    const byId = new Map<string, Attachment>();
    contextAttachments?.forEach((attachment) => {
      byId.set(attachment.application_attachment_id, attachment);
    });
    return byId;
  }, [contextAttachments]);

  // server metadata always wins over the local copy, so a refreshed file name or download
  // path is never left stale
  const existingFiles: UploadFileMetadata[] = useMemo(
    () =>
      selectedAttachmentIds.map((attachmentId) => {
        const attachment =
          contextAttachmentsById.get(attachmentId) ??
          locallyUploadedAttachments[attachmentId];
        if (attachment) {
          return mapAttachmentsToFileMetadata([attachment])[0];
        }
        return {
          id: attachmentId,
          fileName: PREVIOUSLY_UPLOADED_FILE_NAME,
          updatedAt: "",
        };
      }),
    [selectedAttachmentIds, contextAttachmentsById, locallyUploadedAttachments],
  );

  // one request per uploaded file, so a failure is isolated to that file and already
  // successful attachments are left in place
  const handleCreateApplicationAttachment = useCallback(
    async (pendingFileId: string, abortSignal: AbortSignal) => {
      const response = await createApplicationAttachmentFetcher(
        `/api/applications/${applicationId}/attachments/create`,
        {
          method: "POST",
          signal: abortSignal,
          body: JSON.stringify({ pending_file_id: pendingFileId }),
        },
      );
      const attachment = response.data;

      setLocallyUploadedAttachments((previous) => ({
        ...previous,
        [attachment.application_attachment_id]: attachment,
      }));
      // id check, so a repeated success callback cannot add the same attachment twice
      setSelectedAttachmentIds((previousIds) =>
        previousIds.includes(attachment.application_attachment_id)
          ? previousIds
          : [...previousIds, attachment.application_attachment_id],
      );

      return attachment;
    },
    [applicationId, createApplicationAttachmentFetcher],
  );

  // removal is local only - saving the form is what actually deletes the attachment, so
  // navigating away without saving restores the previously saved state
  const handleDeleteAttachment = useCallback(
    (attachmentId: string): Promise<undefined> => {
      setSelectedAttachmentIds((previousIds) =>
        previousIds.filter((previousId) => previousId !== attachmentId),
      );
      markFormDirty?.();
      return Promise.resolve(undefined);
    },
    [markFormDirty],
  );

  /*
    SimplerFileInput renders one upload per selected file and fires these per file, so a
    batch increments once per file and each file decrements as it settles. onComplete runs
    from a `finally`, so failed and canceled uploads decrement too and the save button
    cannot stay disabled on a stuck count.
  */
  const handleUploadStart = useCallback(() => {
    markFormDirty?.();
    attachmentsUploadingCounter?.incrementAttachmentsProcessing();
  }, [markFormDirty, attachmentsUploadingCounter]);

  const handleUploadComplete = useCallback(() => {
    attachmentsUploadingCounter?.decrementAttachmentsProcessing();
  }, [attachmentsUploadingCounter]);

  // only for consumers that pass onChange - the apply form does not, and submits the
  // hidden input below instead
  const lastNotifiedSelection = useRef(JSON.stringify(selectedAttachmentIds));
  useEffect(() => {
    const serialized = JSON.stringify(selectedAttachmentIds);
    if (serialized === lastNotifiedSelection.current) {
      return;
    }
    lastNotifiedSelection.current = serialized;
    onChange?.(selectedAttachmentIds);
  }, [selectedAttachmentIds, onChange]);

  const visibleInputId = `${id}-visible`;
  const error = rawErrors.length ? true : undefined;
  const describedByIds = buildAttachmentDescribedByIds({
    visibleInputId,
    hasTitle: Boolean(title),
    hasError: Boolean(error),
  });

  return (
    <FormGroup key={`form-group__multi-file-upload--${id}`} error={error}>
      <DynamicFieldLabel
        idFor={visibleInputId}
        title={title}
        required={required}
        description={description}
        labelType={labelType}
      />
      {/* the submitted value: the selected attachment ids, in display order */}
      <input
        type="hidden"
        name={id}
        id={id}
        value={JSON.stringify(selectedAttachmentIds)}
      />
      {error && (
        <FieldErrors
          fieldName={visibleInputId}
          rawErrors={rawErrors as string[]}
        />
      )}
      <SimplerFileInput
        id={visibleInputId}
        multiFile={true}
        postUploadAction={handleCreateApplicationAttachment}
        postUploadActionProgressMessage={t("uploading")}
        postUploadActionSuccessMessage={t("success")}
        postUploadActionErrorMessage={t("error")}
        onStart={handleUploadStart}
        onComplete={handleUploadComplete}
        onDelete={handleDeleteAttachment}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        describedByIds={describedByIds}
        formInvalid={Boolean(error)}
        existingFiles={existingFiles}
      />
    </FormGroup>
  );
};

export default ApplicationMultipleAttachmentWidget;
