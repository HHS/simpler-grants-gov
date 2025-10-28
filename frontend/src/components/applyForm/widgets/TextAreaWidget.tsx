// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/widgets/TextareaWidget.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import { ChangeEvent, FocusEvent, useCallback } from "react";
import { FormGroup, Textarea } from "@trussworks/react-uswds";

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextAreaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  disabled,
  required,
  readonly,
  schema,
  value,
  autofocus = false,
  options = {},
  rawErrors = [],
  updateOnInput = false,
  // passing on* functions made optional
  onBlur = () => ({}),
  onChange = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { description, title, maxLength, minLength } = schema;
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLTextAreaElement>) =>
      onBlur(id, target && target.value),
    [onBlur, id],
  );

  const handleChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
      onChange(value === "" ? options.emptyValue : value),
    [onChange, options.emptyValue],
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
    <FormGroup error={error} key={`form-group__text-area--${id}`}>
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description as string}
        labelType={labelType}
      />
      {error && (
        <FieldErrors fieldName={id} rawErrors={rawErrors as string[]} />
      )}
      <Textarea
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={id}
        name={id}
        autoFocus={autofocus}
        // update to let form validation happen on the updateOnInput
        aria-required={required}
        disabled={disabled || readonly}
        readOnly={readonly}
        onChange={updateOnInput ? handleChange : undefined}
        onBlur={updateOnInput ? handleBlur : undefined}
        onFocus={updateOnInput ? handleFocus : undefined}
        aria-describedby={describedby}
        defaultValue={updateOnInput ? undefined : inputValue}
        value={updateOnInput ? inputValue : undefined}
        rows={options.rows}
        error={error}
      />
    </FormGroup>
  );
}

export default TextAreaWidget;
