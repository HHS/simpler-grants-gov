/**
 * Walk a mapping and resolve it against a form's response.
 *
 * Modeled on the CommonGrants SDK's `transformFromMapping`: a node whose one key names a
 * handler is passed to that handler; any other object is output shape, and each of its
 * values is resolved in turn. The result is a tree shaped like the mapping, with every
 * function replaced by what it yields, which `writeXml` then writes.
 *
 * Two departures from the SDK:
 *
 *   - Handlers receive the walker itself, so a function's inputs can be any value and
 *     functions nest (a `$match` branch can be a `$when`).
 *   - Vocabulary keys start with `$`, and anything that resolves to nothing (undefined,
 *     null, "", or an empty group or list) is left out.
 */

/** Resolve a mapping node against a scope. */
export type Transform = (scope: unknown, node: unknown) => unknown;

/** A vocabulary word: returns what the node yields, calling `transform` on its inputs. */
export type Handler = (
  scope: unknown,
  argument: never,
  transform: Transform,
) => unknown;

/**
 * Output shape: elements to write, in order. Kept apart from a plain object a `$field`
 * reads from the response, which is data, not elements.
 */
export class Group extends Map<string, unknown> {}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/** Resolve `mapping` against `data`, a form's response or, inside `$each`, an item. */
export function transformFromMapping(
  data: unknown,
  mapping: unknown,
  handlers: Record<string, Handler>,
): unknown {
  const transform: Transform = (scope, node) => {
    if (node === null || typeof node !== "object") return node; // a literal
    const record = node as Record<string, unknown>;
    const name = functionName(record, handlers);
    if (name !== undefined)
      return handlers[name](scope, record[name] as never, transform);

    const group = new Group();
    for (const [key, child] of Object.entries(record)) {
      const value = transform(scope, child);
      if (!isEmpty(value)) group.set(key, value);
    }
    return group;
  };
  return transform(data, mapping);
}

/** Whether a resolved value has nothing to write. */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (value instanceof Map) return value.size === 0;
  return Array.isArray(value) && value.length === 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The handler a node names, or undefined for output shape. A `$` key that isn't a handler,
 * or one beside other keys, is an error.
 */
function functionName(
  node: Record<string, unknown>,
  handlers: Record<string, Handler>,
): string | undefined {
  const keys = Object.keys(node);
  const names = keys.filter((key) => key.startsWith("$"));
  if (!names.length) return undefined;
  if (keys.length !== 1 || !(names[0] in handlers))
    throw new Error(`not a mapping function: ${keys.join(", ")}`);
  return names[0];
}
