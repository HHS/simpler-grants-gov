import { FocusEvent, useCallback } from "react";
import {
  ariaDescribedByIds,
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import { ErrorMessage, Fieldset, Label, Radio } from "@trussworks/react-uswds";
import { TextTypes, UswdsWidgetProps } from "src/services/applyForm/types";

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
  schema,
  options,
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  rawErrors = [],
  // passing on* functions made optional
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { enumOptions, enumDisabled, emptyValue } = options;

  const { title } = schema;

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

  return (
    <Fieldset id={id}>
      <Label key={`label-for-${id}`} htmlFor={id}>
        {title}
        {required && (
          <span className="usa-hint usa-hint--required text-no-underline">
            *
          </span>
        )}
      </Label>
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
                checked={checked}
                name={id}
                required={required}
                key={optionId(id, i)}
                value={String(i)}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && i === 0}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                aria-describedby={ariaDescribedByIds<T>(id)}
              />
          );
        })}
    </Fieldset>
  );
}

export default RadioWidget;
