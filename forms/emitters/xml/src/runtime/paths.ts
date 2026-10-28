/** Dotted paths into a form's response. */

/**
 * The value at a dotted path below `scope`, or undefined. A whole-number step reads a list's
 * entry by index (`types.0`), as the API's `read` does; any other step reads an object's own
 * key.
 */
export function read(scope: unknown, path: string): unknown {
  let value: unknown = scope;
  for (const step of path.split(".")) {
    if (Array.isArray(value)) {
      value = /^\d+$/.test(step) ? value[Number(step)] : undefined;
      continue;
    }
    if (
      value === null ||
      typeof value !== "object" ||
      !Object.hasOwn(value, step)
    )
      return undefined;
    value = (value as Record<string, unknown>)[step];
  }
  return value;
}
