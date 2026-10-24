import type { ControlProps } from "@jsonforms/core";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Preview the attachment answer contract without an application or upload service. The
 * TypeSpec still selects the normal Attachment/AttachmentArray widgets; only this library's
 * registry substitutes a reference editor. File contents and ownership are never simulated.
 */
export function AttachmentReferenceControl({
  data,
  path,
  label,
  description,
  required,
  enabled,
  schema,
}: ControlProps) {
  const id = useId();
  const root = useRef<HTMLFieldSetElement>(null);
  const mounted = useRef(false);
  const multiple = schema.type === "array";
  const [references, setReferences] = useState<string[]>(() =>
    multiple
      ? Array.isArray(data)
        ? data
        : []
      : [typeof data === "string" ? data : ""],
  );
  // Match the SGG collector's names, including nested roles and repeated entries.
  const name = path
    .split(".")
    .reduce(
      (p, part) =>
        /^\d+$/.test(part) ? `${p}[${part}]` : p ? `${p}--${part}` : part,
      "",
    );
  useEffect(() => {
    // Loading external sample data already triggers the parent's validation. Reporting from
    // a child's mount effect would race that load and repeatedly remount the native form.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // Add/remove/reorder changes the native form after React commits, just like typing.
    root.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [references]);
  const moveUp = (index: number) =>
    setReferences((current) => {
      const next = [...current];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });

  return (
    <fieldset
      className="usa-fieldset margin-y-3"
      ref={root}
      disabled={!enabled}
    >
      <legend className="usa-legend font-body-md">
        {label}
        {required ? " *" : ""}
      </legend>
      {description && <p>{description}</p>}
      <p className="usa-hint" id={`${id}-hint`}>
        Preview attachment references only. Enter an illustrative file UUID or
        load sample data. No file is uploaded; its content, existence and
        ownership are not checked here.
        {multiple && " Reference order is the file order."}
      </p>
      {references.map((reference, index) => (
        <div key={index} className="margin-y-2">
          <label className="usa-label" htmlFor={`${id}-${index}`}>
            {multiple ? `File ${index + 1} reference` : "File reference"}
          </label>
          <input
            className="usa-input"
            id={`${id}-${index}`}
            name={multiple ? `${name}[${index}]` : name}
            type="text"
            value={reference}
            aria-describedby={`${id}-hint`}
            onChange={(event) =>
              setReferences((current) =>
                current.map((value, i) =>
                  i === index ? event.target.value : value,
                ),
              )
            }
          />
          {multiple && (
            <>
              <button
                type="button"
                className="usa-button usa-button--unstyled margin-right-2"
                onClick={() =>
                  setReferences((current) =>
                    current.filter((_, i) => i !== index),
                  )
                }
                aria-label={`Remove file ${index + 1} reference`}
              >
                Remove
              </button>
              {index > 0 && (
                <button
                  type="button"
                  className="usa-button usa-button--unstyled"
                  onClick={() => moveUp(index)}
                  aria-label={`Move file ${index + 1} reference up`}
                >
                  Move up
                </button>
              )}
            </>
          )}
        </div>
      ))}
      {multiple && (
        <button
          type="button"
          className="usa-button usa-button--outline"
          disabled={
            schema.maxItems !== undefined &&
            references.length >= schema.maxItems
          }
          onClick={() => setReferences((current) => [...current, ""])}
        >
          Add file reference
        </button>
      )}
    </fieldset>
  );
}
