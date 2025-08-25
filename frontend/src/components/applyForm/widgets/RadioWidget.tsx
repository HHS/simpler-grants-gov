import {
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
  EnumOptionsType,
} from "@rjsf/utils";

import { FocusEvent, useCallback, useMemo } from "react";
import { ErrorMessage, FormGroup, Radio } from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

/** The `RadioWidget` renders a radio group.
 *  It now prefers options.enumOptions (supplied by our utils), and falls back to schema.enum.
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
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, enum: enumFromSchema, description } = schema;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { enumDisabled, emptyValue } = options as {
    enumDisabled?: unknown[];
    emptyValue?: unknown;
  };
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  // Prefer options.enumOptions (can hold boolean values), else fall back to schema.enum
  const enumOptions = useMemo<EnumOptionsType<S>[]>(() => {
    const uiEnum = (options as any)?.enumOptions as EnumOptionsType<S>[] | undefined;
    if (Array.isArray(uiEnum) && uiEnum.length) {
      return uiEnum;
    }
    const fromSchema =
      Array.isArray(enumFromSchema) && enumFromSchema.length
        ? enumFromSchema.map((v) => ({ label: String(v), value: v }))
        : [];
    return fromSchema as EnumOptionsType<S>[];
  }, [options, enumFromSchema]);

  // DEBUG (safe to remove):
  if (id === "delinquent_federal_debt") {
    // should show two options with boolean values true/false
    // and current value either true/false/undefined
    // eslint-disable-next-line no-console
    console.log("[RadioWidget] debt field", {
      id,
      value,
      valueType: typeof value,
      enumOptions: enumOptions.map((o) => ({
        label: o.label,
        value: o.value,
        valueType: typeof o.value,
      })),
    });
  }

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onBlur(
        id,
        enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue),
      ),
    [onBlur, id, enumOptions, emptyValue],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onFocus(
        id,
        enumOptionsValueForIndex<S>(target && target.value, enumOptions, emptyValue),
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
    <FormGroup error={error} key={`form-group__radio--${id}`}>
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
            : Object.values(rawErrors[0] as Record<string, string>)
                .map((v) => v)
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
