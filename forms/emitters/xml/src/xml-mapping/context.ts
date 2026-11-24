import {
  resolveEncodedName,
  type EnumMember,
  type Model,
  type ModelProperty,
  type Program,
} from "@typespec/compiler";
import { getNs } from "@typespec/xml";

import { jsonPropertyName, type PropertyCasing } from "../simpler-forms.js";

/** An XML namespace from `@Xml.ns`: its URI and prefix. */
export type Namespace = NonNullable<ReturnType<typeof getNs>>;

/** The inputs every step of building one form's XML mapping needs. */
export interface MappingContext {
  program: Program;
  /** The mapping being built, e.g. `Mappings.grantsGov`. */
  mapping: EnumMember;
  /** The casing of the form's JSON property names. */
  casing: PropertyCasing;
  /** The root element's namespace. Elements in it are written without a prefix. */
  rootNs: Namespace;
}

/**
 * Where an element's fields are read from: a form model, and that model's JSON path below
 * the response, or below the current item inside an `$each`.
 */
export interface ReadScope {
  from: Model;
  prefix: string[];
}

/**
 * Return the mapping key for an element or attribute: its XML name, with a prefix when it's
 * in another namespace than the root.
 */
export function elementKey(
  ctx: MappingContext,
  prop: ModelProperty | Model,
  attribute = false,
): string {
  const name = resolveEncodedName(ctx.program, prop, "application/xml");
  const ns =
    getNs(ctx.program, prop) ??
    (prop.kind === "ModelProperty" && prop.model
      ? getNs(ctx.program, prop.model)
      : undefined);
  // An attribute is unqualified unless prefixed, so it always takes one.
  if (attribute) return `@${ns?.prefix ?? ctx.rootNs.prefix}:${name}`;
  return ns && ns.namespace !== ctx.rootNs.namespace
    ? `${ns.prefix}:${name}`
    : name;
}

/** Return the JSON path to `steps` below `prefix`, with each property in the form's casing. */
export function jsonPath(
  ctx: MappingContext,
  prefix: string[],
  steps: ModelProperty[],
): string[] {
  return [
    ...prefix,
    ...steps.map((step) => jsonPropertyName(ctx.program, step, ctx.casing)),
  ];
}
