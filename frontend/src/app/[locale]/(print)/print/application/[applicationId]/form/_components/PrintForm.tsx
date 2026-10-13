"use client";

import { RJSFSchema } from "@rjsf/utils";
import { AttachmentsProvider } from "src/hooks/ApplicationAttachments";
import { UiSchema } from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";
import { JsonFormsUiSchema } from "src/utils/applyForm/jsonFormsUiSchema";

import { FormFields } from "src/components/apply-form/FormFields";
import { JsonFormsFields } from "src/components/apply-form/jsonforms/JsonFormsFields";

export default function PrintForm({
  attachments,
  formSchema,
  savedFormData,
  uiSchema,
  jsonFormsUiSchema,
  setAttachmentsChanged,
}: {
  attachments: Attachment[];
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
  jsonFormsUiSchema?: JsonFormsUiSchema;
  setAttachmentsChanged: (value: boolean) => void;
}) {
  return (
    <AttachmentsProvider
      value={{ attachments: attachments ?? [], setAttachmentsChanged }}
    >
      <div className="apply-form-print-preview">
        {jsonFormsUiSchema ? (
          <JsonFormsFields
            errors={null}
            formData={savedFormData}
            schema={formSchema}
            uiSchema={jsonFormsUiSchema}
            formContext={{
              rootFormData: savedFormData,
              rootSchema: formSchema,
            }}
            isFormLocked
            print
          />
        ) : (
          <FormFields
            errors={null}
            formData={savedFormData}
            schema={formSchema}
            uiSchema={uiSchema}
            formContext={{
              rootFormData: savedFormData,
              rootSchema: formSchema,
            }}
            isFormLocked
          />
        )}
      </div>
    </AttachmentsProvider>
  );
}
