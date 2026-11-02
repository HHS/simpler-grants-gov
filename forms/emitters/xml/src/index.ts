import type {
  DecoratorContext,
  Model,
  Program,
  Scalar,
} from "@typespec/compiler";
import { stateKeys } from "./lib.js";
import { $transform, $transforms } from "./transforms.js";

export { $lib } from "./lib.js";
export { $onEmit } from "./emitter.js";
export { transformOf } from "./transforms.js";
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

const $attachment = (ctx: DecoratorContext, target: Scalar) =>
  ctx.program.stateSet(stateKeys.attachment).add(target);

export const $decorators = {
  GrantsGov: { xsd: $xsd, form: $form, attachment: $attachment },
  // TODO(agilesix/simpler-forms#21): move to simpler-forms with `lib/mapping.tsp`.
  "SimplerForms.Mapping": { transforms: $transforms, transform: $transform },
};
