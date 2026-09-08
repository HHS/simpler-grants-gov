"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import {
  FileResultsMetadata,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";
import { mapOpportunityAttachmentsToFileMetadata } from "src/utils/opportunity/opportunityAttachmentUtils";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { FormGroup, Label } from "@trussworks/react-uswds";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";

interface OpportunityAttachmentUploadInputProps {
  initialAttachments?: OpportunityAttachment[];
}

// this name, along with the two hidden inputs below, is registered as a non schema form data
// key (see isNonSchemaFormDataKey) - all three are read by name at save time and none belongs
// in the opportunity summary body, so renaming one means updating that list too
const UPLOAD_INPUT_ID = "opportunity-attachment-upload";
const UPLOAD_LABEL_ID = `${UPLOAD_INPUT_ID}-label`;

export function OpportunityAttachmentUploadInput({
  initialAttachments = [],
}: OpportunityAttachmentUploadInputProps) {
  const t = useTranslations("OpportunityEdit.attachments");

  const { clientFetch: fetchResultsMetadata } = useClientFetch<{
    file_metadata: FileResultsMetadata;
  }>("Error fetching uploaded file metadata");

  // scanned this session, not yet a real attachment - nothing is sent to the backend
  // until Save, per the settled "nothing persists until Save" design for this page.
  const [heldFiles, setHeldFiles] = useState<UploadFileMetadata[]>([]);
  // ids of already-saved attachments (from initialAttachments) marked for removal -
  // the real DELETE call is deferred to the next Save action, same reasoning as above.
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(
    new Set(),
  );

  const existingFileMetadata = useMemo(
    () => mapOpportunityAttachmentsToFileMetadata(initialAttachments),
    [initialAttachments],
  );

  const visibleFiles = useMemo(
    () => [
      ...existingFileMetadata.filter((file) => !markedForDeletion.has(file.id)),
      ...heldFiles,
    ],
    [existingFileMetadata, markedForDeletion, heldFiles],
  );

  // does not call any create endpoint - the file is only held locally until Save
  const handlePostUpload = useCallback(
    async (pendingFileId: string, signal: AbortSignal) => {
      const { file_metadata: metadata } = await fetchResultsMetadata(
        `/api/file/${pendingFileId}/results-metadata`,
        { method: "GET", signal },
      );
      // no server timestamp exists for a held, not-yet-saved file - left blank rather
      // than fabricated, which FileInputExistingFiles already renders correctly
      const fileMetadata: UploadFileMetadata = {
        id: pendingFileId,
        fileName: metadata.file_name,
        fileSize: metadata.file_size_bytes,
        updatedAt: "",
      };
      setHeldFiles((previous) =>
        previous.some((file) => file.id === pendingFileId)
          ? previous
          : [...previous, fileMetadata],
      );
      return fileMetadata;
    },
    [fetchResultsMetadata],
  );

  // neither branch calls a backend endpoint - both are purely local per the settled
  // "delete deferred to Save" design, for held files and already-saved files alike
  const handleDelete = useCallback(
    (fileId: string): Promise<undefined> => {
      const isHeldFile = heldFiles.some((file) => file.id === fileId);
      if (isHeldFile) {
        setHeldFiles((previous) =>
          previous.filter((file) => file.id !== fileId),
        );
      } else {
        setMarkedForDeletion((previous) => new Set(previous).add(fileId));
      }
      return Promise.resolve(undefined);
    },
    [heldFiles],
  );

  return (
    <FormGroup>
      <Label htmlFor={UPLOAD_INPUT_ID} id={UPLOAD_LABEL_ID}>
        {t("uploadLabel")}
      </Label>
      {/* carries the held/marked-for-deletion state through to the next Save action,
          the same way every other field on this page already does */}
      <input
        type="hidden"
        name="held_pending_file_ids"
        value={JSON.stringify(heldFiles.map((file) => file.id))}
      />
      <input
        type="hidden"
        name="deleted_attachment_ids"
        value={JSON.stringify(Array.from(markedForDeletion))}
      />
      <SimplerFileInput
        id={UPLOAD_INPUT_ID}
        multiFile
        postUploadAction={handlePostUpload}
        postUploadActionProgressMessage={t("uploading")}
        postUploadActionSuccessMessage={t("success")}
        postUploadActionErrorMessage={t("error")}
        onDelete={handleDelete}
        describedByIds={[UPLOAD_LABEL_ID]}
        existingFiles={visibleFiles}
      />
    </FormGroup>
  );
}
