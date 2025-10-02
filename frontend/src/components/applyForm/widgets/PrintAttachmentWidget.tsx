// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { useApplicationAttachments } from "src/hooks/ApplicationAttachments";

import { useEffect, useState } from "react";
import { FormGroup } from "@trussworks/react-uswds";

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { UploadedFile, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
function PrintAttachmentWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  required,
  schema,
  value,
  rawErrors = [],
  formClassName,
}: UswdsWidgetProps<T, S, F>) {
  const { title, description } = schema as S;
  const { attachments } = useApplicationAttachments();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    let parsedValue: string[] = [];

    if (Array.isArray(value)) {
      parsedValue = value as string[];
    } else if (typeof value === "string") {
      try {
        // casting doesn’t fully satisfy the linter because it treats schema as possibly any underneath
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(value);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          parsedValue = parsed;
        }
      } catch {
        console.warn("Invalid JSON string for attachment:", value);
      }
    }

    if (parsedValue.length > 0) {
      const hydrated = parsedValue.map((uuid) => {
        const match = attachments?.find(
          (a) => a.application_attachment_id === uuid,
        );
        return {
          id: uuid,
          name: match?.file_name || "(Previously uploaded file)",
        };
      });

      setUploadedFiles(hydrated);
    }
  }, [value, attachments]);

  const error = rawErrors.length ? true : undefined;

  return (
    <FormGroup
      className={formClassName}
      key={`form-group__text-input--${id}`}
      error={error}
    >
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description as string}
        labelType={"hide-helper-text"}
      />
      {error && (
        <FieldErrors fieldName={id} rawErrors={rawErrors as string[]} />
      )}
      {uploadedFiles.length > 0 && (
        <ul className="usa-list usa-list--unstyled margin-top-2">
          {uploadedFiles.map((file, index) => {
            const attachment = attachments?.find(
              (a) => a.application_attachment_id === file.id,
            );

            return (
              <li
                key={`${file.id}-${index}`}
                className="margin-bottom-1 display-flex flex-align-center"
              >
                {attachment?.download_path ? (
                  <a
                    href={attachment.download_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary display-inline-flex align-items-center"
                  >
                    {file.name}
                  </a>
                ) : (
                  <span>{file.name}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </FormGroup>
  );
}

export default PrintAttachmentWidget;
