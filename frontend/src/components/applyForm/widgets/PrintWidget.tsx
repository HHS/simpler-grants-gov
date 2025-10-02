// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import { FormGroup } from "@trussworks/react-uswds";

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
function PrintWidget<
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
  inputClassName,
}: UswdsWidgetProps<T, S, F>) {
  const { title, description } = schema as S;

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
      <div data-testid={id} className={inputClassName} id={id} key={id}>
        {(value as string) ?? ""}
      </div>
    </FormGroup>
  );
}

export default PrintWidget;
