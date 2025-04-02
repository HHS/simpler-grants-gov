// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import {
  examplesId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { ChangeEvent, FocusEvent, useCallback } from "react";
import { ErrorMessage, FormGroup, TextInput } from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { FieldLabel } from "./FieldLabel";

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
  value,
  required,
  disabled,
  readonly,
  schema,
  options = {},
  autofocus = false,
  updateOnInput = false,
  // passing on* functions made optional
  onBlur = () => ({}),
  onChange = () => ({}),
  onFocus = () => ({}),
  rawErrors = [],
}: UswdsWidgetProps<T, S, F>) {
  const {
    title,
    maxLength,
    minLength,
    format,
    type,
    examples,
    default: defaultValue,
  } = schema as S;

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
    <FormGroup error={error} key={`wrapper-for-${id}`}>
      <FieldLabel idFor={id} title={title} required={required} />
      {error && (
        <ErrorMessage id={`error-for-${id}`}>{rawErrors[0]}</ErrorMessage>
      )}
      <TextInput
        data-testid={id}
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={id}
        type={inputType as TextTypes}
        autoFocus={autofocus}
        name={id}
        aria-required={required}
        disabled={disabled}
        readOnly={readonly}
        list={examples ? examplesId<T>(id) : undefined}
        aria-describedby={describedby}
        onChange={updateOnInput ? _onChange : undefined}
        onBlur={updateOnInput ? _onBlur : undefined}
        onFocus={updateOnInput ? _onFocus : undefined}
        defaultValue={updateOnInput ? undefined : inputValue}
        value={updateOnInput ? inputValue : undefined}
        validationStatus={error ? "error" : undefined}
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
