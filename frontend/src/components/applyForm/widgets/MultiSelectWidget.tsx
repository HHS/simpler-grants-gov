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

function toArray(selectedValue: unknown): string[] {
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
  // allows us to inforce the minimum number
  // we can later pass it as prop if design likes the idea
  // this will be used for some dropdowns that have the possibility of having one option
  // example would be starting an application and it is defaulted to "individual" and no other options are available
  const enforceMinInUI = false;
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);
  const allOptions: ComboBoxOption[] = useMemo(() => opts ?? [], [opts]);

  const [selected, setSelected] = React.useState<string[]>(toArray(value));

  const comboRef = useRef<ComboBoxRef>(null);

  const maxSelections = typeof maxItems === "number" ? maxItems : 3;
  const minSelectionsEff = typeof minItems === "number" ? minItems : 0;
  const atCap = selected.length >= maxSelections;

  const isOptDisabled = useCallback(
    (opt: ComboBoxOption) =>
      !!enumDisabled &&
      (enumDisabled.includes(opt.label) || enumDisabled.includes(opt.value)),
    [enumDisabled],
  );

  const availableOptions = useMemo(
    () =>
      allOptions.filter(
        (o) => !selected.includes(String(o.value)) && !isOptDisabled(o),
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

  const addByLabelOrValue = (raw: string): boolean => {
    const txt = raw.trim();
    if (!txt || atCap) return false;

    const match =
      allOptions.find(
        (o) => String(o.label).toLowerCase() === txt.toLowerCase(),
      ) ??
      allOptions.find(
        (o) => String(o.value).toLowerCase() === txt.toLowerCase(),
      );

    if (!match) return false;

    const v = String(match.value);
    if (selected.includes(v)) return false;

    const next = [...selected, v];
    syncUpstream(next);
    comboRef.current?.clearSelection();
    return true;
  };

  const removeValue = (v: string) => {
    const next = selected.filter((s) => s !== v);
    if (enforceMinInUI && next.length < minSelectionsEff) return;
    syncUpstream(next);
  };

  const getLabelForValue = (v: string) =>
    allOptions.find((o) => String(o.value) === v)?.label ?? v;

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
        disabled={disabled || readonly || atCap}
        onChange={(val?: string) => {
          if (!val) return;
          addByLabelOrValue(val);
        }}
        inputProps={{
          autoFocus: autofocus,
          "aria-describedby": describedBy,
          placeholder: atCap
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
