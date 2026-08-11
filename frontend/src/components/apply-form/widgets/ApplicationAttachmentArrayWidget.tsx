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
  Virus scanning file input for form fields that hold multiple attachments.

  Conditionally rendered in place of MultipleAttachmentUploadWidget - see
  src/utils/applyForm/virusScanningForms.ts for the temporary rollout gate, removed
  in #11352.

  Value contract: the persisted value is an ordered array of application_attachment_id
  strings, serialized onto the hidden input. In-flight upload state (progress, scan,
  cancellation, per file errors) lives inside SimplerFileInput and never reaches form
  data - only a successfully created attachment id is added to the selection.

  Lifecycle note: additions and deletions here are local until the form is saved. Save
  associates added attachments with the form and records application history; navigating
  away without saving leaves the previously saved state untouched. The underlying
  ApplicationAttachment row and S3 object are still created at upload time, so an
  abandoned upload leaves an unreferenced record that counts toward the per application
  attachment limit. Cleaning those up requires separate backend lifecycle work.
*/

/*
  Placeholder shown for a selected attachment id whose metadata is not available yet -
  either a saved id before the attachment context loads, or the brief interval after an
  upload before refreshed context includes it.

  Deliberately the same literal the existing attachment widgets use rather than an i18n
  string: AttachmentUploadWidget, MultipleAttachmentUploadWidget and
  MultiAttachmentUploadList compare file names against this exact value to decide how to
  render a row, so a translated value here would silently diverge from those checks.
  Consolidating it belongs with the legacy widget cleanup in #11352.
*/
const PREVIOUSLY_UPLOADED_FILE_NAME = "(Previously uploaded file)";

const ApplicationAttachmentArrayWidget = ({
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
  const t = useTranslations("Application.attachmentUpload");
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);
  const { applicationId } = useParams<{ applicationId: string }>();
  const { attachments: contextAttachments } = useApplicationAttachments();
  const { clientFetch: createApplicationAttachmentFetcher } =
    useClientFetch<ApplicationAttachmentCreateResponse>(
      "Error uploading application attachment",
    );

  /*
    The apply form pipeline does not feed onChange results back into `value` - `value`
    is the last saved response. So the current selection is local state seeded from the
    saved value, and is only re-seeded when the saved value itself actually changes
    (a parent update or a form reset). That keeps a parent rerender from discarding an
    upload that has just completed.
  */
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>(
    () => parseAttachmentIds(value),
  );
  const [lastSeenSavedValue, setLastSeenSavedValue] = useState(() =>
    JSON.stringify(parseAttachmentIds(value)),
  );

  const savedAttachmentIds = useMemo(() => parseAttachmentIds(value), [value]);
  const serializedSavedValue = JSON.stringify(savedAttachmentIds);
  // adjusting state during render rather than in an effect, so a changed saved value is
  // applied in the same pass and no effect can later overwrite a completed upload
  if (serializedSavedValue !== lastSeenSavedValue) {
    setLastSeenSavedValue(serializedSavedValue);
    setSelectedAttachmentIds(savedAttachmentIds);
  }

  // metadata for attachments uploaded in this session, used only until the refreshed
  // attachment context includes them
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

  /*
    The server attachment is always preferred over a locally held copy, even when the id
    is unchanged, so refreshed metadata (file name, size, timestamps, download path) is
    never left stale. The local copy is the fallback for the short interval after an
    upload before refreshed context includes it.
  */
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

  /*
    Runs once per uploaded file after its scan completes. Each file gets its own request,
    so a failure is isolated to that file - SimplerFileInput surfaces the error on that
    row only and already successful attachments are left in place.
  */
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
      // functional setter plus an id check, so a repeated success callback for the same
      // attachment cannot add it twice
      setSelectedAttachmentIds((previousIds) =>
        previousIds.includes(attachment.application_attachment_id)
          ? previousIds
          : [...previousIds, attachment.application_attachment_id],
      );

      return attachment;
    },
    [applicationId, createApplicationAttachmentFetcher],
  );

  /*
    Removal is local only. The attachment is not deleted from the application here - the
    form save diffs the attachment ids and performs the deletion and history event, so
    navigating away without saving restores the previously saved state.
  */
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
    Notify the parent when the selection changes. The apply form pipeline does not
    currently supply onChange, so this is only for consumers that do - the hidden input
    above remains the value that is actually submitted.
  */
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
      {/* the hidden input carries the canonical value - an ordered array of
          application_attachment_id strings */}
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
        onStart={markFormDirty}
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

export default ApplicationAttachmentArrayWidget;
