import type { RJSFSchema } from "@rjsf/utils";
import { shapeFormData } from "@sgg/frontend/utils/applyForm/applyFormUtils";

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Preview rules can disable an answer without clearing it. Native submission omits
 * disabled controls, so include their actual displayed values here. Reading the
 * current DOM (rather than merging old answers) keeps deletion and clearing real.
 * Hidden/unmounted controls and explicit source clearing need their own contract.
 */
export function previewFormData(form: HTMLFormElement): FormData {
  const data = new FormData(form);
  for (const control of Array.from(form.elements)) {
    if (!control.matches(":disabled") || !control.getAttribute("name"))
      continue;
    if (control instanceof HTMLInputElement) {
      if (["button", "submit", "reset", "image", "file"].includes(control.type))
        continue;
      if (["radio", "checkbox"].includes(control.type) && !control.checked)
        continue;
      data.append(control.name, control.value);
    } else if (control instanceof HTMLSelectElement) {
      for (const option of Array.from(control.selectedOptions))
        data.append(control.name, option.value);
    } else if (control instanceof HTMLTextAreaElement) {
      data.append(control.name, control.value);
    }
  }
  return data;
}

export function collectPreviewForm(
  form: HTMLFormElement,
  schema: RJSFSchema,
  context: unknown,
  widgetLists?: ReadonlySet<string>,
): unknown {
  return collectPreviewData(
    previewFormData(form),
    schema,
    context,
    widgetLists,
  );
}

/**
 * Disabled/read-only controls are not successful native inputs. In this preview,
 * their values come from the explicitly loaded context, not an application service.
 * Preserve only schema-declared read-only values; never merge back cleared answers.
 * Editable array rows remain the collector's output: this does not invent row
 * identity or restore removed rows from a previous sample.
 * This handles unconditional schema annotations, not conditional ownership or
 * presence rules, nor ownership of objects or editable array rows.
 */
function withReadOnlyContext(
  schema: RJSFSchema,
  context: unknown,
  collected: unknown,
): unknown {
  if (
    schema.readOnly &&
    schema.type !== "object" &&
    schema.type !== "array" &&
    !schema.properties &&
    !schema.items
  )
    return structuredClone(context);
  if (!schema.properties) return collected;
  const result = object(collected) ? { ...collected } : {};
  for (const [key, property] of Object.entries(schema.properties)) {
    if (typeof property === "boolean") continue;
    const value = withReadOnlyContext(
      property,
      object(context) ? context[key] : undefined,
      result[key],
    );
    if (value === undefined) delete result[key];
    else result[key] = value;
  }
  return Object.keys(result).length || object(collected) ? result : collected;
}

/** The real SGG collector, plus the preview's explicitly supplied immutable context. */
export function collectPreviewData(
  data: FormData,
  schema: RJSFSchema,
  context: unknown,
  widgetLists?: ReadonlySet<string>,
): unknown {
  const collected = withReadOnlyContext(
    schema,
    context,
    shapeFormData(data, schema),
  );
  // Library collapsible lists own draft rows through their change callback.
  // In particular, blank rows and deleted rows must survive a sibling's native edit.
  if (object(collected) && object(context))
    for (const name of widgetLists ?? [])
      if (Array.isArray(context[name]))
        collected[name] = structuredClone(context[name]);
  return collected;
}
