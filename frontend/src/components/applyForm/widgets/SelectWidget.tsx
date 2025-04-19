import {
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { ChangeEvent, FocusEvent, SyntheticEvent, useCallback } from "react";
import { ErrorMessage, Select } from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { FieldLabel } from "./FieldLabel";

function getValue(event: SyntheticEvent<HTMLSelectElement>, multiple: boolean) {
  if (multiple) {
    return Array.from((event.target as HTMLSelectElement).options)
      .slice()
      .filter((o) => o.selected)
      .map((o) => o.value);
  }
  return (event.target as HTMLSelectElement).value;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function SelectWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  schema,
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  multiple = false,
  autofocus = false,
  updateOnInput = false,
  rawErrors = [],
  // passing on* functions made optional
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const { title, description } = schema;
  const selectValue = value ? String(value) : "";

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onFocus(
        id,
        enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal),
      );
    },
    [onFocus, id, multiple, enumOptions, optEmptyVal],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onBlur(
        id,
        enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal),
      );
    },
    [onBlur, id, multiple, enumOptions, optEmptyVal],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onChange(
        enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal),
      );
    },
    [onChange, multiple, enumOptions, optEmptyVal],
  );

  const error = rawErrors.length ? true : undefined;
  const describedby = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

  return (
    <div key={`wrapper-for-${id}`}>
      <FieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description}
      />

      {error && <ErrorMessage>{rawErrors[0]}</ErrorMessage>}

      <Select
        // necessary due to react 19 bug https://github.com/facebook/react/issues/30580
        key={selectValue}
        id={id}
        name={id}
        multiple={multiple}
        defaultValue={updateOnInput ? undefined : selectValue}
        value={updateOnInput ? selectValue : undefined}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={updateOnInput ? handleChange : undefined}
        onBlur={updateOnInput ? handleBlur : undefined}
        onFocus={updateOnInput ? handleFocus : undefined}
        aria-describedby={describedby}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map(({ value, label }) => {
            const disabled =
              enumDisabled && enumDisabled.indexOf(value as TextTypes) !== -1;
            return (
              <option key={label} value={String(label)} disabled={disabled}>
                {label}
              </option>
            );
          })}
      </Select>
    </div>
  );
}

export default SelectWidget;
