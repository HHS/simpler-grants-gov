/** Dotted paths into a form's response. */

/** The value at a dotted path below `scope`, or undefined. */
export function read(scope: unknown, path: string): unknown {
  let value: unknown = scope;
  for (const step of path.split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[step];
  }
  return value;
}
