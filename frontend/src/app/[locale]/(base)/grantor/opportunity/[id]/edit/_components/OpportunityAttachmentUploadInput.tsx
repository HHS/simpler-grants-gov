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
  file_name: "file name 1",
  file_size: 1,
  mime_type: "file",
  updated_at: new Date().getTime(),
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
      // updated_at, // this is not in the API response type, unsure if we need to update anything to get it sent back
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

  for failure path scenario testing, use these filenames:
  - "scenario-infected"
  - "scenario-wait10s"
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
  const [existingFiles, setExistingFiles] = useState<UploadFileMetadata[]>(
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
  };

  // note that this doesn't actually delete any files, just removes them from the
  // dummy existing files array
  // returning a promise to satisfy the interface
  const confirmDelete = (fileToDeleteId: string): Promise<undefined> => {
    setErrorMessage(null);

    try {
      const deleteAtIndex = existingFiles.findIndex(
        (existingFile) => existingFile.id === fileToDeleteId,
      );
      existingFiles.splice(deleteAtIndex, 1);
      console.log("!!! removed", existingFiles);
      setExistingFiles(([] as UploadFileMetadata[]).concat(existingFiles));
    } catch (err) {
      console.error("Attachment delete failed", err);
      setErrorMessage(t("errorDeleteFailed"));
    }
    return Promise.resolve(undefined);
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
        postUploadActionProgressMessage="ATTACHING TO OPPORTUNITY (custom message)"
        postUploadActionErrorMessage="POST UPLOAD FAILED (custom message)"
        postUploadActionSuccessMessage="POST UPLOAD SUCCESS (custom message)"
        id="opportunity-attachment-upload"
        labelId={"opportunity-attachment-upload-label"}
        onDelete={(id) => {
          console.log("onDelete callback");
          return confirmDelete(id);
        }}
        onStart={() => console.log("onStart callback")}
        onSuccess={() => {
          console.log("onSuccess callback");
          addExistingFile(FakeFILE_____DELIETEmeeee);
        }}
        onComplete={() => console.log("onComplete callback")}
        onError={(e) => console.error("onError callback", e)}
        disabled={isUploading || !isDraft}
        readOnly={false}
        required={false}
        existingFiles={existingFiles}
        // multiFile={true}
      />
    </FormGroup>
  );
}
