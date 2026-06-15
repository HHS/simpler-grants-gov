"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { UploadFileMetadata } from "src/types/fileUploadTypes";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Alert, FormGroup, Label } from "@trussworks/react-uswds";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";

interface OpportunityAttachmentUploadInputProps {
  opportunityId: string;
  initialAttachments?: OpportunityAttachment[];
  isDraft?: boolean;
}

/*
  - [ ] translate initialAttachments into proper metadata format
  - [ ] integrate delete behavior (build delete route?)
  - [ ] integrate upload behavior (build upload route(s)?)
*/

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

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const existingFiles: UploadFileMetadata[] = useMemo(() => {
    return initialAttachments.map((initialAttachment) => {});
  });

  const handleOpportunityAttachment = async (
    fileId: string,
    abortSignal: AbortSignal,
  ) => {
    try {
      await uploadFetch(
        `/api/opportunities/${opportunityId}/attachments/${fileId}`,
        { method: "POST", signal: abortSignal },
      );
    } catch (err) {
      console.error("Attachment upload failed", err);
      setErrorMessage(t("errorUploadFailed", { fileName: file.name }));
    }
    setIsUploading(false);
  };

  const confirmDelete = async (fileToDeleteId: string): Promise<void> => {
    setErrorMessage(null);

    try {
      await deleteFetch(
        `/api/opportunities/${opportunityId}/attachments/${fileToDeleteId}`,
        { method: "DELETE" },
      );
    } catch (err) {
      console.error("Attachment delete failed", err);
      setErrorMessage(t("errorDeleteFailed"));
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

      <Label
        htmlFor="opportunity-attachment-upload"
        id="opportunity-attachment-upload-label"
      >
        {t("uploadLabel")}
      </Label>
      <SimplerFileInput
        postUploadAction={handleOpportunityAttachment}
        postUploadActionProgressMessage="attaching to opportunity"
        id="opportunity-attachment-upload"
        labelId={"opportunity-attachment-upload-label"}
        onDelete={confirmDelete}
        // onStart={noop}
        // onSuccess={noop}
        // onComplete={noop}
        // onError={noop}
        disabled={isUploading || !isDraft}
        readOnly={false}
        required={false}
        existingFiles={initialAttachments}
      />
    </FormGroup>
  );
}
