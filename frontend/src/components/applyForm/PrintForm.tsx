"use client";

import { RJSFSchema } from "@rjsf/utils";
import { AttachmentsProvider } from "src/hooks/ApplicationAttachments";
import { Attachment } from "src/types/attachmentTypes";

import { FormFields } from "./FormFields";
import { UiSchema } from "./types";

export default function PrintForm({
  attachments,
  formSchema,
  savedFormData,
  uiSchema,
  setAttachmentsChanged,
}: {
  attachments: Attachment[];
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
  setAttachmentsChanged: (value: boolean) => void;
}) {
  return (
    <AttachmentsProvider
      value={{ attachments: attachments ?? [], setAttachmentsChanged }}
    >
      <FormFields
        errors={null}
        formData={savedFormData}
        schema={formSchema}
        uiSchema={uiSchema}
      />
    </AttachmentsProvider>
  );
}
