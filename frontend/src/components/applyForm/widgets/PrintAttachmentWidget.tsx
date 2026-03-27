import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { useApplicationAttachments } from "src/hooks/ApplicationAttachments";
import { Attachment } from "src/types/attachmentTypes";

import { FormGroup } from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";

const hydrateAttachmentReferences = (
  attachmentIds: unknown,
  attachments: Attachment[] | null,
): { id: string; name: string }[] => {
  if (!attachmentIds) {
    return [];
  }
  const values = Array.isArray(attachmentIds)
    ? (attachmentIds as string[])
    : ([attachmentIds] as string[]);

  let hydrated: { id: string; name: string }[] = [];

  if (values.length > 0) {
    hydrated = values.map((uuid) => {
      const match = attachments?.find(
        (a) => a.application_attachment_id === uuid,
      );
      return {
        id: uuid,
        name: match?.file_name || "(Previously uploaded file)",
      };
    });
  }
  return hydrated;
};

function PrintAttachmentWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({ id, required, schema, value, formClassName }: UswdsWidgetProps<T, S, F>) {
  const { title } = schema as S;
  const { attachments } = useApplicationAttachments();

  const hydrated = hydrateAttachmentReferences(value, attachments);

  return (
    <FormGroup className={formClassName} key={`form-group__text-input--${id}`}>
      <div className="text-bold">
        {title}
        {required && (
          <span className="usa-hint usa-hint--required text-no-underline">
            *
          </span>
        )}
      </div>
      {hydrated.length > 0 && (
        <ul className="usa-list usa-list--unstyled margin-top-2">
          {hydrated.map((file, index) => {
            return (
              <li
                key={`${file.id}-${index}`}
                className="margin-bottom-1 display-flex flex-align-center border-1px bg-base-lightest font-family-mono padding-05 maxw-tablet border-base-lighter"
              >
                <span className="">{file.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </FormGroup>
  );
}

export default PrintAttachmentWidget;
