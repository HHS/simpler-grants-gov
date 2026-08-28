"use client";

import { deleteCompetitionInstructionAction } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/actions";
import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

type ApplicationInstructionsProps = {
  opportunityId: string;
  competitionId: string;
  existingFiles?: UploadFileMetadata[];
};

export function ApplicationInstructions({
  opportunityId,
  competitionId,
  existingFiles = [],
}: ApplicationInstructionsProps) {
  const t = useTranslations(
    "OpportunityCompetition.sectionApplicationInstructions",
  );

  // --- Upload a file ---
  // Currently, only a single instruction file is allowed.
  // After form save (in actions.tsx) execution redirects to a different page and fileId is discarded.
  const [fileId, setFileId] = useState<string>("");
  const handlePostFileUpload: PostUploadAction = (
    fileId: string,
  ): Promise<undefined> => {
    if (fileId) {
      setFileId(fileId);
    }
    return Promise.resolve(undefined);
  };

  // ---- Delete a file ---
  // Currently implementation: after the page is loaded with data (existingFiles) only then can the file be deleted.
  // SimplerFileInput will display the Delete button if there is an existing file.
  // Note: After deletion, the user can upload a new file. But they must save it
  // and then return to load this page before they can delete it.
  const [files, setFiles] = useState<UploadFileMetadata[]>(existingFiles);
  const handleDeleteFile = async (fileId: string): Promise<undefined> => {
    if (files.length > 0 && fileId) {
      await deleteCompetitionInstructionAction(
        opportunityId,
        competitionId,
        fileId,
      );
      setFiles((currentFiles) =>
        currentFiles.filter((file) => file.id !== fileId),
      );
    }
    return Promise.resolve(undefined);
  };

  return (
    <div
      id="application-instructions"
      className="margin-top-4 padding-bottom-4 border-bottom border-base-lighter simpler-page-anchor-offset"
    >
      <input type="hidden" name="pending-file-id" value={fileId} />
      <h2 className="font-heading-lg margin-top-0 margin-bottom-1">
        {t("header")}
      </h2>
      <p className="font-body-md text-base-dark margin-top-0">
        {t("subHeader")}
      </p>
      <DynamicFieldLabel
        idFor="competition-instruction-file"
        title={t("uploadAFile")}
        description={t("multipleFiles")}
      />
      <SimplerFileInput
        id="competition-instruction-file"
        postUploadAction={handlePostFileUpload}
        postUploadActionProgressMessage={t("uploadWidget.uploading")}
        postUploadActionSuccessMessage={t("uploadWidget.success")}
        postUploadActionErrorMessage={t("uploadWidget.error")}
        deleteActionConfirmationMessage={t("uploadWidget.deleteConfirmation")}
        onDelete={handleDeleteFile}
        describedByIds={["label-for-competition-instruction-file"]}
        existingFiles={files}
      />
    </div>
  );
}
