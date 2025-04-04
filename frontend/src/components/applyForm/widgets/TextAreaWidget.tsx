// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/widgets/TextareaWidget.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import { ChangeEvent, FocusEvent, useCallback } from "react";
import { ErrorMessage, Textarea } from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";
import { FieldLabel } from "./FieldLabel";

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  options = {},
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  schema,
  updateOnInput = false,
  rawErrors = [],
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
  const error = rawErrors.length ? true : undefined;
  const describedby = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;
  const inputValue = value !== undefined ? String(value) : "";

  return (
    <div key={`wrapper-for-${id}`}>
      <FieldLabel idFor={id} title={title} required={required} />

      {error && <ErrorMessage>{rawErrors[0]}</ErrorMessage>}
      <Textarea
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={id}
        name={id}
        autoFocus={autofocus}
        // update to let form validation happen on the updateOnInput
        aria-required={required}
        disabled={disabled}
        readOnly={readonly}
        onChange={updateOnInput ? handleChange : undefined}
        onBlur={updateOnInput ? handleBlur : undefined}
        onFocus={updateOnInput ? handleFocus : undefined}
        aria-describedby={describedby}
        defaultValue={updateOnInput ? undefined : inputValue}
        value={updateOnInput ? inputValue : undefined}
        rows={options.rows}
      />
    </div>
  );
}

export default TextareaWidget;
