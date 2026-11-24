import type { Model, Program, Type } from "@typespec/compiler";
import { jsonPropertyName, modelProperties } from "simpler-forms";

import type { SyncOptions } from "./decorators.js";
import { Formulas, type Scope } from "./formulas/index.js";
import { stateKeys } from "./lib.js";

/** `@Sgg.sync`'s options, or undefined when sync does not install this form. */
export const modelSync = (p: Program, model: Model) =>
  p.stateMap(stateKeys.sync).get(model) as SyncOptions | undefined;

/** Whether `type` is an `@Sgg.attachment` question, or a scalar that extends one. */
function isAttachment(p: Program, type: Type): boolean {
  for (
    let scalar = type.kind === "Scalar" ? type : undefined;
    scalar;
    scalar = scalar.baseScalar
  )
    if (p.stateSet(stateKeys.attachment).has(scalar)) return true;
  return false;
}

const ATTACHMENT_RULE = { gg_validation: { rule: "attachment" } };

/**
 * Rules follow the emitted answer paths and property names, including snake casing.
 * The schema records attachment ownership, pre- or post-population rules, and
 * formulas. A list of objects uses `gg_type: "array"` so the API applies its rules
 * per item.
 */
export function ruleSchema(
  p: Program,
  model: Model,
  casing: "preserve" | "snake",
): Record<string, unknown> {
  const formulas = new Formulas(p, casing);
  const rules = modelRules(p, model, casing, formulas, [
    { model, place: { at: [], inList: false } },
  ]);
  formulas.finish();
  return rules;
}

function modelRules(
  p: Program,
  model: Model,
  casing: "preserve" | "snake",
  formulas: Formulas,
  scopes: Scope[],
): Record<string, unknown> {
  const { place } = scopes.at(-1)!;
  const rules: Record<string, unknown> = {};
  for (const prop of modelProperties(model)) {
    const name = jsonPropertyName(p, prop, casing);
    const here = { at: [...place.at, name], inList: place.inList };
    const type = prop.type;
    const array = type.kind === "Model" && type.indexer?.key.name === "integer";
    const item = array ? type.indexer!.value : type;
    const fieldRules: Record<string, unknown> = {};
    const pre = p.stateMap(stateKeys.prePopulation).get(prop);
    const post = p.stateMap(stateKeys.postPopulation).get(prop);
    if (pre) fieldRules.gg_pre_population = { rule: pre };
    if (post) fieldRules.gg_post_population = { rule: post };
    if (isAttachment(p, item)) {
      formulas.rejectAttachment(prop);
      rules[name] = { ...fieldRules, ...ATTACHMENT_RULE };
      continue;
    }
    Object.assign(fieldRules, formulas.rules(prop, here, scopes));
    if (item.kind === "Model" && !scopes.some((s) => s.model === item)) {
      const inner = modelRules(p, item, casing, formulas, [
        ...scopes,
        { model: item, place: { at: here.at, inList: here.inList || array } },
      ]);
      // A block answer with a formula adds up the fields it doesn't calculate itself.
      merge(inner, formulas.blockRules(prop, here, scopes) ?? {});
      if (Object.keys(inner).length)
        Object.assign(
          fieldRules,
          array ? { gg_type: "array", ...inner } : inner,
        );
    }
    if (Object.keys(fieldRules).length) rules[name] = fieldRules;
  }
  return rules;
}

/** Copy `from`'s rules into `into`, merging the rules of fields both have. */
function merge(into: Record<string, unknown>, from: Record<string, unknown>) {
  for (const [key, value] of Object.entries(from)) {
    const existing = into[key];
    if (existing && typeof existing === "object" && typeof value === "object")
      merge(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    else into[key] = value;
  }
}
