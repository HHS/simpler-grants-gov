import {
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { FocusEvent, useCallback, useMemo } from "react";
import { ErrorMessage, FormGroup, Radio } from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

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
  options = {},
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
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

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
    <FormGroup
      error={error}
      key={`form-group__radio--${id}`}
      className="margin-top-0"
    >
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description as string}
        labelType={labelType}
      />

      {error && (
        <ErrorMessage>
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : Object.values(rawErrors[0])
                .map((value) => value)
                .join(",")}
        </ErrorMessage>
      )}
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
              defaultValue={updateOnInput ? undefined : String(option.value)}
              value={updateOnInput ? String(option.value) : undefined}
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
