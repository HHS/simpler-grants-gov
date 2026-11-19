/** Paths to data values in a form's response. */

/**
 * One step of a path: an object's key, a list's entry by index, or a range of a list's
 * entries. Indexes count from 0, and a negative one counts back from the end.
 */
export type Step =
  { key: string } | { index: number } | { start?: number; stop?: number };

// Split a path into steps with these patterns. A segment between dots can be a name followed
// by any number of brackets, so a plain split on "." isn't enough.
const SEGMENT = /^([^[\]]*)((?:\[[^\]]*\])*)$/; // "sites[1:]" -> "sites", "[1:]"
const BRACKET = /\[([^\]]*)\]/g; // "[0][2]" -> "0", "2"
const INDEX = /^-?\d+$/; // "0", "-1"
const RANGE = /^(-?\d+)?:(-?\d+)?$/; // "1:3", "1:", ":2", "-2:"

/**
 * Parse a path into the steps you would take to pluck its value from nested JSON.
 *
 * Each step is an object key, an array index or an array slice. Steps are separated by `.`,
 * and a key can be followed by brackets that index or slice the array at that key, as in
 * Python and jq. The API's `steps` parses the same paths.
 *
 * @example
 * steps("name")          // [{ key: "name" }]
 * steps("contact.email") // [{ key: "contact" }, { key: "email" }]
 * steps("types[0]")      // [{ key: "types" }, { index: 0 }]
 * steps("types[-1]")     // [{ key: "types" }, { index: -1 }]
 * steps("types.0")       // [{ key: "types" }, { key: "0" }] (a whole-number key also reads an entry)
 * steps("sites[1:]")     // [{ key: "sites" }, { start: 1 }]
 * steps("sites[0].name") // [{ key: "sites" }, { index: 0 }, { key: "name" }]
 * steps(".")             // [] (the scope itself, e.g. the item inside `$each`)
 *
 * @throws for a path that isn't valid, e.g. `sites[a]` (a bracket that isn't an index or
 * slice), `sites..name` (an empty step), or `sites[1:].name` (a slice that isn't the last
 * step).
 */
export function steps(path: string): Step[] {
  if (path === ".") return [];
  const result: Step[] = [];
  for (const segment of path.split(".")) {
    const [, name, brackets] = SEGMENT.exec(segment) ?? [];
    if (name === undefined || (name === "" && brackets === ""))
      throw new Error(`not a path: ${path}`);
    if (name !== "") result.push({ key: name });
    for (const [, inner] of brackets.matchAll(BRACKET)) {
      const range = RANGE.exec(inner);
      if (INDEX.test(inner)) result.push({ index: Number(inner) });
      else if (range)
        result.push({
          ...(range[1] !== undefined ? { start: Number(range[1]) } : {}),
          ...(range[2] !== undefined ? { stop: Number(range[2]) } : {}),
        });
      else throw new Error(`not a path: ${path}`);
    }
  }
  if (result.slice(0, -1).some(isRange))
    throw new Error(`a range must be a path's last step: ${path}`);
  return result;
}

/**
 * Return the value at `path` below `scope`, or undefined if the response doesn't have it.
 * `.` returns `scope` itself: inside `$each`, the item. See `steps` for the paths this reads;
 * the API's `read` reads the same paths.
 */
export function read(scope: unknown, path: string): unknown {
  let value: unknown = scope;
  for (const step of steps(path)) {
    // The current value is an array: `types[...]` or `types.0`
    if (Array.isArray(value)) {
      // The step is a slice, `sites[1:]`: read every entry in the range
      if (isRange(step)) value = value.slice(step.start, step.stop);
      // The step is an index, `types[0]` or `types[-1]`: read one entry, or undefined
      else if ("index" in step) value = value.at(step.index);
      // The step is a whole-number key, `types.0`: read it as an index, or undefined
      else value = /^\d+$/.test(step.key) ? value[Number(step.key)] : undefined;
      continue;
    }
    // The current value must be an object with the step as its own key: `contact.email`
    if (
      !("key" in step) ||
      value === null ||
      typeof value !== "object" ||
      !Object.hasOwn(value, step.key)
    )
      return undefined;
    value = (value as Record<string, unknown>)[step.key];
  }
  return value;
}

const isRange = (step: Step): step is { start?: number; stop?: number } =>
  !("key" in step) && !("index" in step);
