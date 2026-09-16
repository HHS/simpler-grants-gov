"use client";

import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

type ApplicationInstructionsProps = {
  existingFiles?: UploadFileMetadata[];
  readOnly?: boolean;
};

export function ApplicationInstructions({
  existingFiles = [],
  readOnly = false,
}: ApplicationInstructionsProps) {
  const t = useTranslations(
    "OpportunityCompetition.sectionApplicationInstructions",
  );
  const [fileId, setFileId] = useState<string>("");

  const handleDeleteFile = (): Promise<undefined> => {
    // TODO: once we implement load data on page edit,
    // then the delete button will appear. Then add a
    // call to the backend to delete the persisted/perminate file.
    setFileId("");
    return Promise.resolve(undefined);
  };

  const handlePostFileUpload: PostUploadAction = (
    fileId: string,
  ): Promise<undefined> => {
    if (fileId) {
      setFileId(fileId);
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
        disabled={readOnly}
        postUploadAction={handlePostFileUpload}
        postUploadActionProgressMessage={t("uploadWidget.uploading")}
        postUploadActionSuccessMessage={t("uploadWidget.success")}
        postUploadActionErrorMessage={t("uploadWidget.error")}
        onDelete={handleDeleteFile}
        describedByIds={["label-for-competition-instruction-file"]}
        existingFiles={existingFiles}
      />
    </div>
  );
}
