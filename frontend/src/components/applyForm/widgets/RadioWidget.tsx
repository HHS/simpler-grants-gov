import {
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { FocusEvent, useCallback, useMemo } from "react";
import {
  ErrorMessage,
  Fieldset,
  FormGroup,
  Radio,
} from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { FieldLabel } from "./FieldLabel";

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  disabled,
  options,
  schema,
  required,
  readonly,
  value,
  autofocus = false,
  rawErrors = [],
  updateOnInput = false,
  // passing on* functions made optional
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, enum: enumFromSchema, description } = schema;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { enumDisabled, emptyValue } = options;

  const enumOptions = useMemo(
    () =>
      (enumFromSchema ?? []).map((value) => ({
        label: String(value),
        value,
      })),
    [enumFromSchema],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onBlur(
        id,
        enumOptionsValueForIndex<S>(
          target && target.value,
          enumOptions,
          emptyValue,
        ),
      ),
    [onBlur, id, enumOptions, emptyValue],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onFocus(
        id,
        enumOptionsValueForIndex<S>(
          target && target.value,
          enumOptions,
          emptyValue,
        ),
      ),
    [onFocus, id, enumOptions, emptyValue],
  );
  const error = rawErrors.length ? true : undefined;
  const describedby = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

  return (
    <FormGroup error={error} key={`wrapper-for-${id}`}>
      <FieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description}
      />{" "}
      {error && <ErrorMessage>{rawErrors[0]}</ErrorMessage>}
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => {
          const checked = enumOptionsIsSelected<S>(option.value, value);
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value as TextTypes) !== -1;

          const handleChange = () => onChange(option.value);

          return (
            <Radio
              label={option.label}
              id={optionId(id, i)}
              checked={updateOnInput ? checked : undefined}
              defaultChecked={updateOnInput ? undefined : checked}
              name={id}
              required={required}
              key={optionId(id, i)}
              disabled={disabled || itemDisabled || readonly}
              autoFocus={autofocus && i === 0}
              defaultValue={updateOnInput ? undefined : String(i)}
              value={updateOnInput ? String(i) : undefined}
              onChange={updateOnInput ? handleChange : undefined}
              onBlur={updateOnInput ? handleBlur : undefined}
              onFocus={updateOnInput ? handleFocus : undefined}
              aria-describedby={describedby}
            />
          );
        })}
    </FormGroup>
  );
}

export default RadioWidget;
