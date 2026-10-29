// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/widgets/TextareaWidget.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { UswdsWidgetProps } from "src/types/applyForm/types";

import { ChangeEvent, FocusEvent, useCallback } from "react";
import { FormGroup, Textarea } from "@trussworks/react-uswds";

import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";
import { FieldErrors } from "src/components/core/forms/FieldErrors";
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
  readOnly,
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
  // I think the intention here is that it is a string or boolean, but no easy way to type that given
  // the open nature of the value prop at this point. We can remove this when we make the widget value prop generic
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const inputValue = value !== undefined ? String(value) : "";

  return (
    <FormGroup error={error} key={`form-group__text-area--${id}`}>
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description}
        labelType={labelType}
      />
      {error && (
        <FieldErrors fieldName={id} rawErrors={rawErrors as string[]} />
      )}
      <Textarea
        minLength={minLength ?? undefined}
        maxLength={maxLength ?? undefined}
        id={id}
        key={id}
        name={id}
        autoFocus={autofocus}
        // update to let form validation happen on the updateOnInput
        aria-required={required}
        disabled={disabled}
        readOnly={readOnly}
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
