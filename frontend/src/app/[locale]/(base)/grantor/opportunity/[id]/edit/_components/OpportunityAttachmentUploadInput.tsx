"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  Alert,
  FileInput,
  FileInputRef,
  FormGroup,
  Label,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { DeleteFileModal } from "src/components/core/fileInput/DeleteFileModal";
import { USWDSIcon } from "src/components/core/USWDSIcon";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

interface UploadedFile {
  id: string;
  name: string;
  deletable: boolean;
}

interface OpportunityAttachmentUploadInputProps {
  opportunityId: string;
  initialAttachments?: OpportunityAttachment[];
  isDraft?: boolean;
}

export function OpportunityAttachmentUploadInput({
  opportunityId,
  initialAttachments = [],
  isDraft = false,
}: OpportunityAttachmentUploadInputProps) {
  const t = useTranslations("OpportunityEdit.attachments");

  const { clientFetch: uploadFetch } = useClientFetch<{
    opportunity_attachment_id: string;
  }>("Error uploading opportunity attachment");
  const { clientFetch: deleteFetch } = useClientFetch<{
    message: string;
  }>("Error deleting opportunity attachment");

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialAttachments.map((attachment) => ({
      id: attachment.opportunity_attachment_id || crypto.randomUUID(),
      name: attachment.file_name,
      deletable: !!attachment.opportunity_attachment_id,
    })),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(
    () =>
      setExistingFiles(
        mapInitialAttachmentsToExistingFiles(initialAttachments),
      ),
    [initialAttachments],
  );
  const handleOpportunityAttachment = async (
    fileId: string,
    abortSignal: AbortSignal,
  ) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await uploadFetch(
        `/api/opportunities/${opportunityId}/attachments/attach/${fileId}`,
        { method: "POST", signal: abortSignal },
      );
    } catch (e) {
      console.error("Attachment upload failed", e);
      setErrorMessage(t("errorUploadFailed"));
      throw e;
    }

    setIsUploading(false);
    fileInputRef.current?.clearFiles();
  };

  const confirmDelete = async (): Promise<void> => {
    if (!fileToDelete) return;
    setErrorMessage(null);
    setDeletePending(true);

    try {
      await deleteFetch(
        `/api/opportunities/${opportunityId}/attachments/${fileToDelete.id}`,
        { method: "DELETE" },
      );
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err) {
      console.error("Attachment delete failed", err);
      setErrorMessage(
        t("errorDeleteFailed", { fileName: fileToDelete?.name ?? "" }),
      );
    } finally {
      setDeletePending(false);
      deleteModalRef.current?.toggleModal();
    }
  };

  return (
    <FormGroup>
      {errorMessage && (
        <Alert
          type="error"
          headingLevel="h4"
          heading={t("errorHeading")}
          className="margin-bottom-2"
        >
          {errorMessage}
        </Alert>
      )}

      <Label htmlFor="opportunity-attachment-upload">{t("uploadLabel")}</Label>
      <FileInput
        id="opportunity-attachment-upload"
        name="opportunity-attachment-upload"
        ref={fileInputRef}
        type="file"
        multiple
        disabled={isUploading || !isDraft}
        readOnly={false}
        required={false}
        existingFiles={existingFiles}
        multiFile={true}
      />
    </FormGroup>
  );
}
