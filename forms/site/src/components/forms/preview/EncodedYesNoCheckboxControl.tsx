import type { ControlProps, JsonSchema } from "@jsonforms/core";
import type { RJSFSchema } from "@rjsf/utils";
import { useEffect, useId, useRef, useState } from "react";

import { controlToNodes } from "../../../vendor/sgg/jsonFormsUiSchema";

const YES = "Y: Yes";
const NO = "N: No";

/** Only the source string domain; ordinary boolean and broader checkboxes stay native. */
export const isEncodedYesNoSchema = (schema: JsonSchema): boolean =>
  schema.type === "string" &&
  schema.enum?.length === 2 &&
  schema.enum.includes(YES) &&
  schema.enum.includes(NO);

/**
 * Library extension for the existing Checkbox contract with source YesNo string values.
 * The visible checkbox has no successful-input name. One hidden input carries an explicit
 * answer; untouched absence remains absent. No default or applicant attestation is inferred.
 */
export function EncodedYesNoCheckboxControl({
  data,
  path,
  label,
  description,
  required,
  enabled,
  readonly,
  visible,
  schema,
  rootSchema,
  uischema,
}: ControlProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [answer, setAnswer] = useState<string | undefined>(() =>
    typeof data === "string" ? data : undefined,
  );
  const name = path
    .split(".")
    .reduce(
      (parent, part) =>
        /^\d+$/.test(part)
          ? `${parent}[${part}]`
          : parent
            ? `${parent}--${part}`
            : part,
      "",
    );
  // Reuse the library's source-ownership interpretation, including readonly ancestors.
  const inheritedReadOnly =
    rootSchema && uischema
      ? controlToNodes(uischema, rootSchema as RJSFSchema).some(
          (node) => node.type === "null",
        )
      : false;
  const disabled =
    !enabled ||
    readonly ||
    (schema as RJSFSchema).readOnly === true ||
    inheritedReadOnly;

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // Publish only after the successful hidden input has the new encoded value.
    root.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [answer]);

  if (visible === false) return null;
  return (
    <div className="usa-checkbox margin-y-3" ref={root}>
      {answer !== undefined && (
        <input type="hidden" name={name} value={answer} disabled={disabled} />
      )}
      <input
        className="usa-checkbox__input"
        id={id}
        type="checkbox"
        checked={answer === YES}
        disabled={disabled}
        required={required}
        aria-describedby={description ? `${id}-description` : undefined}
        onInput={(event) => event.stopPropagation()}
        onChange={(event) => {
          event.stopPropagation();
          if (!disabled) setAnswer(event.currentTarget.checked ? YES : NO);
        }}
      />
      <label className="usa-checkbox__label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      {description && (
        <p className="usa-hint" id={`${id}-description`}>
          {description}
        </p>
      )}
    </div>
  );
}
