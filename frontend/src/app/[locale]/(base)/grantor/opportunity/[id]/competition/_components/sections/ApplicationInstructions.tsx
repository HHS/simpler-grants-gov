"use client";

import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";
import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";

export function getFileMetadata(fileId: string) {
  // TODO: call a backend API to get this info.
  // This is a dummy record for testing until the API is created.
  const fileInfo: UploadFileMetadata = {
    id: "unique-id-123",
    fileName: "dummy.txt",
    fileSize: 2048,
    updatedAt: "2026-08-17",
  };
  return fileInfo;
}

export function ApplicationInstructions() {
  const t = useTranslations(
    "OpportunityCompetition.sectionApplicationInstructions",
  );
  const [fileId, setFileId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadFileMetadata[]>([]);

  const handleDeleteFile = (): Promise<undefined> => {
    setFileId("");
    return Promise.resolve(undefined);
  };

  const handlePostFileUpload: PostUploadAction = (
    fileId: string,
  ): Promise<undefined> => {
    console.log("DEBUG: Post upload, fileId: ", fileId);
    if (fileId) {
      setFileId(fileId);
      const newFile: UploadFileMetadata = getFileMetadata(fileId);
      setUploadedFiles((prevFiles) => [...prevFiles, newFile]);
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
        idFor="simpler-file-upload"
        title={t("uploadAFile")}
        description={t("multipleFiles")}
      />
      <SimplerFileInput
        id="simpler-file-upload"
        postUploadAction={handlePostFileUpload}
        postUploadActionProgressMessage={t("uploadWidget.uploading")}
        postUploadActionSuccessMessage={t("uploadWidget.success")}
        postUploadActionErrorMessage={t("uploadWidget.error")}
        onDelete={handleDeleteFile}
        labelId="label-for-simpler-file-upload"
        existingFiles={uploadedFiles}
        // onStart={markFormDirty}
        // disabled={disabled}
        // readOnly={readOnly}
        // required={required}
      />
    </div>
  );
}
