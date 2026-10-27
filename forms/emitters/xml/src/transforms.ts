import type {
  DecoratorContext,
  Enum,
  EnumMember,
  ModelProperty,
  Namespace,
  Program,
} from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "./lib.js";

// TODO(agilesix/simpler-forms#21): move `@Mapping.transforms` and `@Mapping.transform` to simpler-forms.

export const $transforms = (
  ctx: DecoratorContext,
  target: Namespace,
  transforms: Enum,
) => ctx.program.stateMap(stateKeys.transforms).set(target, transforms);

export const $transform = (
  ctx: DecoratorContext,
  target: ModelProperty,
  transform: EnumMember,
) => ctx.program.stateMap(stateKeys.transform).set(target, transform);

/**
 * The name of the transformation `@Mapping.transform` gives `property`, or `undefined` when
 * it has none. Reports a transformation that no `@Mapping.transforms` enum declares.
 */
export const transformOf = (
  program: Program,
  property: ModelProperty,
): string | undefined => {
  const member = program.stateMap(stateKeys.transform).get(property) as
    EnumMember | undefined;
  if (member === undefined) return undefined;
  const declared = [
    ...(program.stateMap(stateKeys.transforms).values() as Iterable<Enum>),
  ];
  if (!declared.includes(member.enum)) {
    reportDiagnostic(program, {
      code: "mapping-transform-unknown",
      format: { name: `${member.enum.name}.${member.name}` },
      target: property,
    });
  }
  return typeof member.value === "string" ? member.value : member.name;
};
