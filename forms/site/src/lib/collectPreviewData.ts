import type { RJSFSchema } from "@rjsf/utils";
import { shapeFormData } from "@sgg/frontend/utils/applyForm/applyFormUtils";

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Disabled/read-only controls are not successful native inputs. In this preview,
 * their values come from the explicitly loaded context, not an application service.
 * Preserve only schema-declared read-only values; never merge back cleared answers.
 * Editable array rows remain the collector's output: this does not invent row
 * identity or restore removed rows from a previous sample.
 * This handles unconditional schema annotations, not conditional ownership or
 * presence rules. A read-only object is supplied atomically by the context;
 * schema validation, not collection, determines whether its members are valid.
 */
function withReadOnlyContext(
  schema: RJSFSchema,
  context: unknown,
  collected: unknown,
): unknown {
  if (schema.readOnly) return structuredClone(context);
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
  // Native and library collapsible lists own draft rows through their change callback.
  // In particular, blank rows and deleted rows must survive a sibling's native edit.
  if (object(collected) && object(context))
    for (const name of widgetLists ?? [])
      if (Array.isArray(context[name]))
        collected[name] = structuredClone(context[name]);
  return collected;
}
