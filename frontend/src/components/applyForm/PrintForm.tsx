"use client";

import { RJSFSchema } from "@rjsf/utils";
import { AttachmentsProvider } from "src/hooks/ApplicationAttachments";
import { Attachment } from "src/types/attachmentTypes";

import { UiSchema } from "../../types/applyForm/types";
import { FormFields } from "./FormFields";

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
      <div className="apply-form-print-preview">
        <FormFields
          errors={null}
          formData={savedFormData}
          schema={formSchema}
          uiSchema={uiSchema}
          formContext={{ rootFormData: savedFormData, rootSchema: formSchema }}
        />
      </div>
    </AttachmentsProvider>
  );
}
