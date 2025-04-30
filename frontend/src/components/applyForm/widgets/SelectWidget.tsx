import {
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { noop } from "lodash";

import {
  ChangeEvent,
  FocusEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
} from "react";
import {
  ComboBox,
  ComboBoxOption,
  ErrorMessage,
  FormGroup,
  Select,
} from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";
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
  id,
  disabled,
  options,
  readonly,
  required,
  schema,
  value,
  autofocus = false,
  multiple = false,
  rawErrors = [],
  updateOnInput = false,
  // passing on* functions made optional
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, description } = schema;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { enumOptions: opts, enumDisabled, emptyValue: optEmptyVal } = options;
  const enums = useMemo(() => (opts && opts.length > 0 ? opts : []), [opts]);
  const selectValue = value ? String(value) : "";
  // uswds recommends a combo box for lists larger than 15
  const useCombo = enums && enums.length > 15;
  const enumOptions = useMemo(() => {
    if (!enums) return [];
    return !useCombo && optEmptyVal
      ? [...[{ value: "", label: optEmptyVal as string }], ...enums]
      : enums;
  }, [useCombo, optEmptyVal, enums]);

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

  const Widget = useCombo ? ComboBox : Select;

  return (
    <FormGroup error={error} key={`wrapper-for-${id}`}>
      <FieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description}
      />

      {error && <ErrorMessage>{rawErrors[0]}</ErrorMessage>}

      <Widget
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
        onChange={updateOnInput ? handleChange : noop}
        onBlur={updateOnInput ? handleBlur : undefined}
        options={useCombo ? (enumOptions as ComboBoxOption[]) : []}
        onFocus={updateOnInput ? handleFocus : undefined}
        aria-describedby={describedby}
      >
        {Array.isArray(enumOptions) &&
          !useCombo &&
          enumOptions.map(({ label, value }) => {
            const disabled = enumDisabled && enumDisabled.indexOf(label) !== -1;
            return (
              <option key={label} value={String(value)} disabled={disabled}>
                {label}
              </option>
            );
          })}
      </Widget>
    </FormGroup>
  );
}

export default SelectWidget;
