/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

import { ChangeEvent, FocusEvent, SyntheticEvent, useCallback } from "react";
import { Select } from "@trussworks/react-uswds";

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
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: WidgetProps<T, S, F>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const emptyValue = multiple ? [] : undefined;

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onFocus(
        id,
        enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFocus, id, schema, multiple, enumOptions, optEmptyVal],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onBlur(
        id,
        enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onBlur, id, schema, multiple, enumOptions, optEmptyVal],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = getValue(event, multiple);
      return onChange(
        enumOptionsValueForIndex<S>(newValue, enumOptions, optEmptyVal),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, schema, multiple, enumOptions, optEmptyVal],
  );

  const selectedIndexes = enumOptionsIndexForValue<S>(
    value,
    enumOptions,
    multiple,
  );

  return (
    <div key={`wrapper-for-${id}`}>
      <Select
        id={id}
        name={id}
        multiple={multiple}
        value={
          typeof selectedIndexes === "undefined" ? emptyValue : selectedIndexes
        }
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onChange={handleChange}
        aria-describedby={ariaDescribedByIds<T>(id)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map(({ value, label }, i) => {
            const disabled =
              enumDisabled && enumDisabled.indexOf(String(value)) !== -1;
            return (
              <option key={i} value={String(i)} disabled={disabled}>
                {label}
              </option>
            );
          })}
      </Select>
    </div>
  );
}

export default SelectWidget;
