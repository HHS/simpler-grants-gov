"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { UploadFileMetadata } from "src/types/fileUploadTypes";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Alert, FormGroup, Label } from "@trussworks/react-uswds";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";

interface OpportunityAttachmentUploadInputProps {
  opportunityId: string;
  initialAttachments?: OpportunityAttachment[];
  isDraft?: boolean;
  addExistingFile: (fakeFile: UploadFileMetadata) => void;
}

const FakeFILE_____DELIETEmeeee = {
  id: "1",
  fileName: "file name 1",
  fileSize: 1,
  mimeType: "file",
  updatedAt: new Date().getTime(),
};

const mapInitialAttachmentsToExistingFiles = (
  initialAttachments: OpportunityAttachment[],
) => {
  return initialAttachments.map((initialAttachment) => {
    const {
      opportunity_attachment_id,
      file_name,
      mime_type,
      file_size,
      // updated_at, // this is not in the type, unsure if we need to update anything to get it sent back
    } = initialAttachment;

    return {
      id: opportunity_attachment_id,
      fileName: file_name,
      fileSize: file_size,
      mimeType: mime_type,
      // updatedAt: updated_at,
      updatedAt: new Date().getTime(),
    };
  });
};

/*
  - [x] translate initialAttachments into proper metadata format
  - [x] integrate delete behavior (build delete route?)
  - [x] integrate upload behavior (build upload route(s)?)
*/

export function OpportunityAttachmentUploadInput({
  opportunityId,
  initialAttachments = [],
  isDraft = false,
  addExistingFile,
}: OpportunityAttachmentUploadInputProps) {
  console.log("!!! initial", initialAttachments);
  const t = useTranslations("OpportunityEdit.attachments");

  const { clientFetch: uploadFetch } = useClientFetch<{
    opportunity_attachment_id: string;
  }>("Error uploading opportunity attachment");
  // const { clientFetch: deleteFetch } = useClientFetch<{
  //   message: string;
  // }>("Error deleting opportunity attachment");

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState(
    mapInitialAttachmentsToExistingFiles(initialAttachments),
  );

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
      await uploadFetch(
        `/api/opportunities/${opportunityId}/attachments/attach/${fileId}`,
        { method: "POST", signal: abortSignal },
      );
    } catch (e) {
      console.error("Attachment upload failed", e);
      setErrorMessage(t("errorUploadFailed"));
    }
    setIsUploading(false);
  };

  const confirmDelete = (fileToDeleteId: string) => {
    setErrorMessage(null);

    try {
      const deleteAtIndex = existingFiles.findIndex(
        (existingFile) => existingFile.id === fileToDeleteId,
      );
      existingFiles.splice(deleteAtIndex, 1);
      console.log("!!! removed", existingFiles);
      setExistingFiles(existingFiles);
    } catch (err) {
      console.error("Attachment delete failed", err);
      setErrorMessage(t("errorDeleteFailed"));
    }
  };

  console.log("!!! existing", existingFiles);

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
        onSuccess={() => addExistingFile(FakeFILE_____DELIETEmeeee)}
        // onComplete={noop}
        onError={(e) => console.error("onError callback", e)}
        disabled={isUploading || !isDraft}
        readOnly={false}
        required={false}
        existingFiles={existingFiles}
      />
    </FormGroup>
  );
}
