"use client";

import { RJSFSchema } from "@rjsf/utils";
import { Attachment } from "src/types/attachmentTypes";

import ApplyForm from "./ApplyForm";
import { AttachmentContext } from "./AttachmentContext";
import { FormValidationWarning, UiSchema } from "./types";

export const ClientApplyForm = ({
  applicationId,
  attachments,
  formId,
  formSchema,
  savedFormData,
  uiSchema,
  validationWarnings,
}: {
  applicationId: string;
  attachments: Attachment[];
  formId: string;
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
  validationWarnings: FormValidationWarning[] | null;
}) => {
  return (
    <AttachmentContext.Provider value={attachments}>
      <ApplyForm
        validationWarnings={validationWarnings}
        savedFormData={savedFormData}
        formSchema={formSchema}
        uiSchema={uiSchema}
        formId={formId}
        applicationId={applicationId}
      />
    </AttachmentContext.Provider>
  );
};
