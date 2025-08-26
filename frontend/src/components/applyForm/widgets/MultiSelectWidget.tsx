"use client";

import {
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import React, { useCallback, useMemo, useRef } from "react";
import {
  ComboBox,
  ErrorMessage,
  FormGroup,
  type ComboBoxOption,
  type ComboBoxRef,
} from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";
import { Pill } from "src/components/Pill";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

function toStringArray(selectedValue: unknown): string[] {
  if (Array.isArray(selectedValue)) return selectedValue.map(String);
  if (selectedValue == null || selectedValue === "") return [];
  return [String(selectedValue)];
}

export default function MultiSelect<
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
  options = {},
  autofocus = false,
  rawErrors = [],
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, description, maxItems, minItems } = schema;

  const { enumOptions: opts, enumDisabled } = (options ?? {}) as {
    enumOptions?: ComboBoxOption[];
    enumDisabled?: Array<string | number>;
  };
  // Future:
  // allows us to enforce the minimum number
  // we can later pass it as prop if design likes the idea
  // this will be used for some dropdowns that have the possibility of having one option
  // example would be starting an application and it is defaulted to "individual" and no other options are available
  const enforceMinInUI = false;
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);
  const allOptions: ComboBoxOption[] = useMemo(() => opts ?? [], [opts]);

  const [selected, setSelected] = React.useState<string[]>(
    toStringArray(value),
  );

  const comboRef = useRef<ComboBoxRef>(null);

  const maxSelections = typeof maxItems === "number" ? maxItems : 3;
  const minSelectionsEff = typeof minItems === "number" ? minItems : 0;
  const atMaxSelection = selected.length >= maxSelections;

  const isOptDisabled = useCallback(
    (opt: ComboBoxOption) =>
      !!enumDisabled &&
      (enumDisabled.includes(opt.label) || enumDisabled.includes(opt.value)),
    [enumDisabled],
  );

  const availableOptions = useMemo(
    () =>
      allOptions.filter(
        (option) =>
          !selected.includes(String(option.value)) && !isOptDisabled(option),
      ),
    [allOptions, selected, isOptDisabled],
  );

  const error = rawErrors.length ? true : undefined;
  const describedBy = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

  const syncUpstream = (next: string[]) => {
    setSelected(next);
    onChange(
      enumOptionsValueForIndex<S>(next, allOptions, undefined) as unknown as T,
    );
  };

  const addByLabelOrValue = (raw: string): void => {
    const text = raw.trim();
    if (!text || atMaxSelection) return;

    const match =
      allOptions.find(
        (option) => String(option.label).toLowerCase() === text.toLowerCase(),
      ) ??
      allOptions.find(
        (option) => String(option.value).toLowerCase() === text.toLowerCase(),
      );

    if (!match) return;

    const selectValue = String(match.value);
    if (selected.includes(selectValue)) return;

    const next = [...selected, selectValue];
    syncUpstream(next);
    comboRef.current?.clearSelection();
  };

  const removeValue = (value: string) => {
    const next = selected.filter((selectedValue) => selectedValue !== value);
    if (enforceMinInUI && next.length < minSelectionsEff) return;
    syncUpstream(next);
  };

  const getLabelForValue = (value: string) =>
    allOptions.find((option) => String(option.value) === value)?.label ?? value;

  return (
    <FormGroup error={error} key={`form-group__uswds-combomulti--${id}`}>
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description as string}
        labelType={labelType}
      />

      {error && (
        <ErrorMessage id={`error-for-${id}`}>
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : Object.values(rawErrors[0]).join(",")}
        </ErrorMessage>
      )}

      {/* Hidden inputs so your form posts an array */}
      {selected.map((v, i) => (
        <input
          key={`${id}-hidden-${v}`}
          type="hidden"
          name={`${id}[${i}]`}
          value={v}
        />
      ))}

      <ComboBox
        ref={comboRef}
        id={`${id}__combobox`}
        name={`${id}__combobox_input`}
        options={availableOptions}
        disabled={disabled || readonly || atMaxSelection}
        onChange={(val?: string) => {
          if (!val) return;
          addByLabelOrValue(val);
        }}
        inputProps={{
          autoFocus: autofocus,
          "aria-describedby": describedBy,
          placeholder: atMaxSelection
            ? `Maximum ${maxSelections} selected`
            : "Type to search and press Enter to add",
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addByLabelOrValue(e.currentTarget.value);
            }
          },
          onBlur: (e) => {
            // Commit exact match on blur, then bubble RJSF blur
            addByLabelOrValue(e.currentTarget.value);
            onBlur(id, selected as unknown as T);
          },
          onFocus: () => onFocus(id, selected as unknown as T),
        }}
      />

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="margin-top-1 display-flex flex-wrap">
          {selected.map((v) => {
            const label = String(getLabelForValue(v));
            return (
              <div key={v} className="margin-right-1 margin-bottom-1">
                <Pill
                  label={label}
                  onClose={() => {
                    if (disabled || readonly) return;
                    removeValue(v);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="margin-top-1 text-base-dark text-italic">
        Selected {selected.length} / {maxSelections}
      </div>
    </FormGroup>
  );
}
