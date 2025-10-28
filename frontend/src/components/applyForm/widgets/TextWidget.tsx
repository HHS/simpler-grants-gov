// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import {
  examplesId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { ChangeEvent, FocusEvent, useCallback } from "react";
import { FormGroup, TextInput } from "@trussworks/react-uswds";

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

/** The `TextWidget` component uses the `BaseInputTemplate`.
 *
 * @param props - The `WidgetProps` for this component
 */
function TextWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  disabled,
  readonly,
  required,
  schema,
  value,
  autofocus = false,
  options = {},
  rawErrors = [],
  updateOnInput = false,
  placeholder,
  // passing on* functions made optional
  onBlur = () => ({}),
  onChange = () => ({}),
  onFocus = () => ({}),
  formClassName,
  inputClassName,
}: UswdsWidgetProps<T, S, F>) {
  const {
    title,
    description,
    maxLength,
    minLength,
    format,
    type,
    examples,
    default: defaultValue,
    pattern,
  } = schema as S;
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  let inputValue: string | number | undefined;
  if (type === "number" || type === "integer") {
    inputValue = value || value === 0 ? Number(value) : undefined;
  } else {
    inputValue = value ? String(value) : undefined;
  }

  let inputType = "text";
  if (format === "email") {
    inputType = "email";
  } else if (type === "number" || type === "integer") {
    inputType = "number";
  } else if (format === "password") {
    inputType = "password";
  } else if (format === "date") {
    inputType = "date";
  }

  const _onChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      onChange(value === "" ? options.emptyValue : value),
    [onChange, options],
  );
  const _onBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onBlur(id, target && target.value),
    [onBlur, id],
  );
  const _onFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onFocus(id, target && target.value),
    [onFocus, id],
  );
  const error = rawErrors.length ? true : undefined;

  const describedby = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

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
        labelType={labelType}
      />
      {error && (
        <FieldErrors fieldName={id} rawErrors={rawErrors as string[]} />
      )}
      <TextInput
        data-testid={id}
        className={inputClassName}
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={id}
        type={inputType as TextTypes}
        autoFocus={autofocus}
        name={id}
        aria-required={required}
        disabled={disabled || readonly}
        readOnly={readonly}
        placeholder={placeholder ?? undefined}
        list={examples ? examplesId<T>(id) : undefined}
        aria-describedby={describedby}
        onChange={updateOnInput ? _onChange : undefined}
        onBlur={updateOnInput ? _onBlur : undefined}
        onFocus={updateOnInput ? _onFocus : undefined}
        defaultValue={updateOnInput ? undefined : inputValue}
        value={updateOnInput ? inputValue : undefined}
        validationStatus={error ? "error" : undefined}
        pattern={pattern || undefined}
      />
      {Array.isArray(examples) && (
        <datalist
          key={`datalist_${id}`}
          id={examplesId<T>(id)}
          data-testid={`datalist_${id}`}
        >
          {(examples as string[])
            .concat(
              defaultValue && !examples.includes(defaultValue)
                ? ([defaultValue] as string[])
                : [],
            )
            .map((example: unknown) => {
              return (
                <option key={example as string} value={example as string} />
              );
            })}
        </datalist>
      )}
    </FormGroup>
  );
}

export default TextWidget;
