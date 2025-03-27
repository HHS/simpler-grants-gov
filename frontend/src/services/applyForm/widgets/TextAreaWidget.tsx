/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/widgets/TextareaWidget.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import {
  ariaDescribedByIds,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { UswdsWidgetProps } from "src/services/applyForm/types";

import { ChangeEvent, FocusEvent, useCallback } from "react";
import { Label, Textarea } from "@trussworks/react-uswds";

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextareaWidget<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends FormContextType = any,
>({
  id,
  options = {},
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  schema,
  // passing on* functions made optional
  onBlur = () => ({}),
  onChange = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, maxLength, minLength } = schema as S;
  const handleChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
      onChange(value === "" ? options.emptyValue : value),
    [onChange, options.emptyValue],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLTextAreaElement>) =>
      onBlur(id, target && target.value),
    [onBlur, id],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLTextAreaElement>) =>
      onFocus(id, target && target.value),
    [id, onFocus],
  );
  return (
    <div key={`wrapper-for-${id}`}>
      <Label key={`label-for-${id}`} htmlFor={id}>
        {title}
        {required && (
          <span className="usa-hint usa-hint--required text-no-underline">
            *
          </span>
        )}
      </Label>
      <Textarea
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={id}
        name={id}
        autoFocus={autofocus}
        // update to let form validation happen on the server
        aria-required={required}
        disabled={disabled}
        readOnly={readonly}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onChange={handleChange}
        aria-describedby={ariaDescribedByIds<T>(id)}
        // passing value made optional
        value={value ? String(value) : undefined}
        rows={options.rows}
      />
    </div>
  );
}

export default TextareaWidget;
