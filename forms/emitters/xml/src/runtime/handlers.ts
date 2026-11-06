/**
 * The mapping vocabulary: one handler per `$` word.
 *
 * Each handler takes the current scope (the response, or an item inside `$each`), its
 * argument, and `transform`, which it calls to resolve any input that is itself a value. A
 * handler returns what its node yields, or undefined for nothing to write.
 *
 *   $field       the answer at a dotted path
 *   $const       a fixed value
 *   $match       the `case` entry for a value, or `default`
 *   $transform   a value changed by a function in `valueTransforms.ts`
 *   $when        `then` or `else`, as a condition holds
 *   $each        `map` once per item of a list, read relative to each item
 *   $attachment  the upload whose id is at a path
 *   $required    a value, or an empty element when it has nothing to write
 */
import { holds } from "./conditions.js";
import type {
  Each,
  Match,
  Transform as TransformFn,
  Value,
  When,
} from "./format.js";
import { read } from "./paths.js";
import { isEmpty, type Handler, type Transform } from "./transform.js";
import { VALUE_TRANSFORMS } from "./valueTransforms.js";

/** An uploaded file, as the API's `AttachmentInfo` describes it. */
export interface AttachmentInfo {
  fileName: string;
  mimeType: string;
  fileLocation: string;
  hashValue: string;
  hashAlgorithm?: string;
}

/** What `$attachment` yields: an upload to write as an `att:AttachedFileDataType`. */
export class AttachedFile {
  constructor(readonly info: AttachmentInfo) {}
}

/** What `$required` yields when its value has nothing to write: an empty element. */
export class EmptyElement {}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/** Every handler, with `$attachment` resolving upload ids through `attachment`. */
export function defaultHandlers(
  attachment: (id: string) => AttachmentInfo | undefined = () => undefined,
): Record<string, Handler> {
  return {
    $field: field,
    $const: constant,
    $match: match,
    $transform: transformValue,
    $when: when,
    $each: each,
    $required: required,
    $attachment: (scope: unknown, path: string) => {
      const id = read(scope, path);
      if (typeof id !== "string" || id === "") return undefined;
      const info = attachment(id);
      if (!info) throw new Error(`no attachment with id ${id}`);
      return new AttachedFile(info);
    },
  };
}

export const field = (scope: unknown, path: string) => read(scope, path);

export const constant = (_scope: unknown, value: unknown) => value;

/**
 * The `case` entry for the value, or `default`. A string is its own key; anything else is
 * keyed as JSON writes it, so `true` matches "true". A value with neither is an error.
 */
export function match(
  scope: unknown,
  argument: Match["$match"],
  transform: Transform,
): unknown {
  const value = transform(scope, argument.value);
  if (isEmpty(value)) return undefined;
  const key = typeof value === "string" ? value : JSON.stringify(value);
  if (key in argument.case) return transform(scope, argument.case[key]);
  if (argument.default !== undefined) return transform(scope, argument.default);
  throw new Error(`match has no case for ${key} and no default`);
}

export function transformValue(
  scope: unknown,
  argument: TransformFn["$transform"],
  transform: Transform,
): unknown {
  const fn = VALUE_TRANSFORMS[argument.name];
  if (!fn) throw new Error(`unknown transform ${argument.name}`);
  const value = transform(scope, argument.value);
  return isEmpty(value) ? undefined : fn(value, argument.params ?? {});
}

export function when(
  scope: unknown,
  argument: When["$when"],
  transform: Transform,
): unknown {
  const chosen = holds(argument.condition, scope)
    ? argument.then
    : argument.else;
  return chosen === undefined ? undefined : transform(scope, chosen);
}

export function each(
  scope: unknown,
  argument: Each["$each"],
  transform: Transform,
): unknown[] | undefined {
  const items = transform(scope, argument.items);
  if (!Array.isArray(items)) return undefined;
  return items
    .map((item) => transform(item, argument.map))
    .filter((value) => !isEmpty(value));
}

export function required(
  scope: unknown,
  argument: Value,
  transform: Transform,
): unknown {
  const value = transform(scope, argument);
  return isEmpty(value) ? new EmptyElement() : value;
}
