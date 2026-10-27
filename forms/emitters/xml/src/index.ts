import type { DecoratorContext, Model, Program } from "@typespec/compiler";
import { stateKeys } from "./lib.js";

export { $lib } from "./lib.js";
export { $onEmit } from "./emitter.js";
export { xmlTransform, type XmlTransformRules } from "./xml-transform.js";

export const $xsd = (ctx: DecoratorContext, target: Model, url: string) =>
  ctx.program.stateMap(stateKeys.xsd).set(target, url);

/** Each XSD TypeSpec model's root, with the URL of the XSD it models. */
export const xsdRoots = (program: Program) =>
  program.stateMap(stateKeys.xsd) as Map<Model, string>;

/** How Grants.gov identifies a form, from `@GrantsGov.form`. */
export interface FormIdentity {
  legacyFormId?: number;
  shortFormName: string;
  formVersion: string;
  agencyCode?: string;
  ombNumber?: string;
  expirationDate?: string;
}

const $form = (
  ctx: DecoratorContext,
  target: Model,
  identity: FormIdentity,
) => ctx.program.stateMap(stateKeys.form).set(target, identity);

/** Each form's Grants.gov identity, keyed by the model with `@Meta.form`. */
export const formIdentities = (program: Program) =>
  program.stateMap(stateKeys.form) as Map<Model, FormIdentity>;

export const $decorators = {
  GrantsGov: { xsd: $xsd, form: $form },
};
