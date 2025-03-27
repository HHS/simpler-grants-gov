// file adapted from https://github.com/rjsf-team/react-jsonschema-form/blob/main/packages/core/src/components/templates/BaseInputTemplate.tsx
// changes made to include USWDS and allow to functional as non-reactive form field
import {
  ariaDescribedByIds,
  examplesId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { TextTypes, UswdsWidgetProps } from "src/services/applyForm/types";

import { ChangeEvent, FocusEvent, useCallback } from "react";
import {
  ErrorMessage,
  FormGroup,
  Label,
  TextInput,
} from "@trussworks/react-uswds";

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
  options = {},
  autofocus = false,
  schema,
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

  let inputValue;
  if (type === "number" || type === "integer") {
    inputValue = value || value === 0 ? value : "";
  } else {
    inputValue = value == null ? undefined : value;
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

  return (
    <FormGroup error={error} key={`wrapper-for-${id}`}>
      <Label key={`label-for-${id}`} htmlFor={id}>
        {title}
        {required && (
          <span className="usa-hint usa-hint--required text-no-underline">
            *
          </span>
        )}
      </Label>
      {error && <ErrorMessage>{rawErrors[0]}</ErrorMessage>}
      <TextInput
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={id}
        type={inputType as TextTypes}
        autoFocus={autofocus}
        name={id}
        // update to let form validation happen on the server
        aria-required={required}
        disabled={disabled}
        readOnly={readonly}
        aria-describedby={ariaDescribedByIds<T>(id)}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        defaultValue={inputValue ? String(value) : undefined}
        validationStatus={error ? "error" : undefined}
      />
      {Array.isArray(examples) && (
        <datalist key={`datalist_${id}`} id={examplesId<T>(id)}>
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
