/** Paths into a form's response. */

/**
 * One step of a path: an object's key, a list's entry by index, or a range of a list's
 * entries. Indexes count from 0, and a negative one counts back from the end.
 */
export type Step =
  { key: string } | { index: number } | { start?: number; stop?: number };

const SEGMENT = /^([^[\]]*)((?:\[[^\]]*\])*)$/;
const BRACKET = /\[([^\]]*)\]/g;
const INDEX = /^-?\d+$/;
const RANGE = /^(-?\d+)?:(-?\d+)?$/;

/**
 * A path's steps. Steps are separated by `.`, and a name can be followed by brackets: `[i]`
 * reads one entry (`types[0]`, `types[-1]`), `[start:stop]` a range, its stop excluded
 * (`sites[1:]`, `codes[:3]`). A range must be the last step. A whole-number step (`types.0`)
 * also reads an entry, as before brackets. `.` is no steps: the scope itself.
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
 * The value at a path below `scope`, or undefined. `.` is `scope` itself: inside `$each`, the
 * item. See `steps` for what a path can say; the API's `read` reads the same paths.
 */
export function read(scope: unknown, path: string): unknown {
  let value: unknown = scope;
  for (const step of steps(path)) {
    if (Array.isArray(value)) {
      if (isRange(step)) value = value.slice(step.start, step.stop);
      else if ("index" in step) value = value.at(step.index);
      else value = /^\d+$/.test(step.key) ? value[Number(step.key)] : undefined;
      continue;
    }
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
