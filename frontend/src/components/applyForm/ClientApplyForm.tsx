"use client";

import { Attachment } from "src/types/attachmentTypes";
import { AttachmentContext } from "./AttachmentContext";
import ApplyForm from "./ApplyForm";
import { FormValidationWarning, UiSchema } from "./types";
import { RJSFSchema } from "@rjsf/utils";

export default function ClientApplyForm({
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
}) {
  return (
    <AttachmentContext.Provider value={attachments}>
      <ApplyForm
        validationWarnings={validationWarnings}
        savedFormData={savedFormData}
        formSchema={formSchema}
        uiSchema={uiSchema}
        formId={formId}
        applicationId={applicationId}
        attachments={attachments}
      />
    </AttachmentContext.Provider>
  );
}
