import type { Model, Program, Type } from "@typespec/compiler";
import { jsonPropertyName, modelProperties } from "simpler-forms";

import { Calculations, type Place } from "./calculations/index.js";
import type { SyncOptions } from "./decorators.js";
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
 * calculations. A list of objects uses `gg_type: "array"` so the API applies its rules
 * per item.
 */
export function ruleSchema(
  p: Program,
  model: Model,
  casing: "preserve" | "snake",
): Record<string, unknown> {
  const calculations = new Calculations(p, model, casing);
  const rules = modelRules(p, model, casing, calculations, {
    at: [],
    inList: false,
  });
  calculations.finish();
  return rules;
}

function modelRules(
  p: Program,
  model: Model,
  casing: "preserve" | "snake",
  calculations: Calculations,
  place: Place,
  seen: Model[] = [],
): Record<string, unknown> {
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
      rules[name] = { ...fieldRules, ...ATTACHMENT_RULE };
      continue;
    }
    Object.assign(fieldRules, calculations.computed(prop, here));
    // Sum each field of a total from its sources, replacing the block's own rules.
    const totals = calculations.totals(prop, here);
    if (totals) Object.assign(fieldRules, totals);
    else if (item.kind === "Model" && !seen.includes(item)) {
      const inner = modelRules(
        p,
        item,
        casing,
        calculations,
        { at: here.at, inList: here.inList || array },
        [...seen, model],
      );
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
