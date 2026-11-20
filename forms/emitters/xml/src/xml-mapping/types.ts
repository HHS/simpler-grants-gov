import type { Model, ModelProperty, Program, Type } from "@typespec/compiler";

import { stateKeys } from "../lib.js";
import type { Value } from "../runtime/format.js";
import { propTransform } from "../simpler-forms.js";

/** Whether a type is a list, and the model it contains, directly or as each item. */
export interface TypeShape {
  array: boolean;
  object?: Model;
  /** A list's item type. */
  item?: Type;
}

/** Return whether `type` is a list, and the model it contains, directly or as each item. */
export function typeShape(type: Type): TypeShape {
  if (type.kind === "Model" && type.indexer?.key.name === "integer") {
    const item = type.indexer.value;
    return {
      array: true,
      object: item.kind === "Model" ? item : undefined,
      item,
    };
  }
  return { array: false, object: type.kind === "Model" ? type : undefined };
}

/** Return the value of a literal type, e.g. the `"1.0"` in `FormVersion: "1.0"`. */
export function literalValue(
  type: Type,
): string | number | boolean | undefined {
  if (
    type.kind === "String" ||
    type.kind === "Number" ||
    type.kind === "Boolean"
  )
    return type.value;
  return undefined;
}

/** Return whether `type` is a `@GrantsGov.attachment` scalar, whose answer is an upload id. */
export function isAttachment(
  program: Program,
  type: Type | undefined,
): boolean {
  return (
    type?.kind === "Scalar" && program.stateSet(stateKeys.attachment).has(type)
  );
}

/**
 * Return the mapping value for an element that writes one value from `field`: an
 * `$attachment`, a `$transform` from `@Mapping.transform`, or the field as is. Pass the item
 * type as `type` for a list of values.
 */
export function valueElement(
  program: Program,
  prop: ModelProperty,
  field: string,
  type = prop.type,
): Value {
  if (isAttachment(program, type)) return { $attachment: field };
  const { name: transform, params } = propTransform(program, prop) ?? {};
  return transform
    ? {
        $transform: {
          name: transform,
          value: { $field: field },
          ...(params ? { params } : {}),
        },
      }
    : { $field: field };
}
